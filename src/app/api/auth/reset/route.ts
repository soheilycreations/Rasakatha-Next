import { NextResponse } from "next/server";
import { authClient } from "@/lib/server/customerAuth";
import { rateLimit } from "@/lib/server/rateLimit";

// Completes a password reset. The access token comes from the recovery link
// Supabase emailed (it lands on /reset-password in the URL hash).
export async function POST(request: Request) {
  const limited = await rateLimit(request, "customer-reset", 10, 60 * 60);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const token = String(body?.accessToken ?? "");
  const password = String(body?.password ?? "");
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  const sb = authClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 401 });
  }
  const { error: updateError } = await sb.auth.admin.updateUserById(data.user.id, { password });
  if (updateError) return NextResponse.json({ error: "Could not update your password" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
