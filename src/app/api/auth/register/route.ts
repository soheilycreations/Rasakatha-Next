import { NextResponse } from "next/server";
import { authClient, setSessionCookies, toAccount } from "@/lib/server/customerAuth";

export async function POST(request: Request) {
  const { name, email, phone, password } = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };

  const cleanEmail = (email ?? "").trim().toLowerCase();
  if (!name?.trim()) return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const sb = authClient();
  const { error } = await sb.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), phone: (phone ?? "").trim() },
  });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return NextResponse.json(
      { error: exists ? "An account with this email already exists" : "Could not create account" },
      { status: exists ? 409 : 500 }
    );
  }

  const { data, error: signInError } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
  if (signInError || !data.session) {
    return NextResponse.json({ error: "Account created, please sign in" }, { status: 500 });
  }
  await setSessionCookies(data.session);
  return NextResponse.json(toAccount(data.user));
}
