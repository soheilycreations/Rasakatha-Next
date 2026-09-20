import { NextResponse } from "next/server";
import { authClient, setSessionCookies, toAccount } from "@/lib/server/customerAuth";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  const { data, error } = await authClient().auth.signInWithPassword({
    email: (email ?? "").trim().toLowerCase(),
    password: password ?? "",
  });
  if (error || !data.session) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  await setSessionCookies(data.session);
  return NextResponse.json(toAccount(data.user));
}
