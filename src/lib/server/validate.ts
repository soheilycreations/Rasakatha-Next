import { NextResponse } from "next/server";
import type { ZodType } from "zod";

// Parse a JSON request body with a zod schema shared with the client forms.
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  return { ok: false, response: NextResponse.json({ error: `${where}${issue?.message ?? "Invalid request"}` }, { status: 400 }) };
}
