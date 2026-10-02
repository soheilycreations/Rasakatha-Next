import { NextResponse } from "next/server";
import { supabase } from "./supabase";

// Per-IP fixed-window rate limiting. Backends, in order of preference:
//   1. Upstash Redis REST   (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
//   2. Supabase             (rate_limit_hit() from supabase/rate-limit.sql)
//   3. In-memory            (per server instance; best effort only)
// If a backend errors, the next one is used. A limiter outage never blocks customers.

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, windowSec: number): number {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    if (memory.size > 5000) for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return 1;
  }
  entry.count++;
  return entry.count;
}

async function upstashHit(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec, "NX"],
      ]),
    });
    if (!res.ok) return null;
    const out = (await res.json()) as { result?: number }[];
    return typeof out[0]?.result === "number" ? out[0].result : null;
  } catch {
    return null;
  }
}

async function supabaseHit(key: string, windowSec: number): Promise<number | null> {
  try {
    const { data, error } = await supabase().rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSec });
    if (error || typeof data !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
}

// Returns a 429 response when the caller is over the limit, otherwise null.
export async function rateLimit(request: Request, name: string, limit: number, windowSec: number): Promise<NextResponse | null> {
  const key = `rl:${name}:${clientIp(request)}`;
  const count = (await upstashHit(key, windowSec)) ?? (await supabaseHit(key, windowSec)) ?? memoryHit(key, windowSec);
  if (count <= limit) return null;
  return NextResponse.json(
    { error: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(windowSec) } }
  );
}
