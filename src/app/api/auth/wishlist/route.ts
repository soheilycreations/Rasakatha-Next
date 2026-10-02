import { NextResponse } from "next/server";
import { authClient, currentAccount } from "@/lib/server/customerAuth";

// The signed-in customer's wishlist ("My Library"), kept in their Supabase
// user_metadata so it follows them across devices without another table.
const MAX_IDS = 500;

async function readIds(userId: string): Promise<string[]> {
  const { data } = await authClient().auth.admin.getUserById(userId);
  const ids = data.user?.user_metadata?.wishlist;
  return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
}

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ ids: await readIds(account.id) });
}

export async function PUT(request: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.ids)) return NextResponse.json({ error: "Invalid wishlist" }, { status: 400 });
  const ids = [...new Set((body.ids as unknown[]).map((x) => String(x).slice(0, 40)))].slice(0, MAX_IDS);

  const sb = authClient();
  const { data } = await sb.auth.admin.getUserById(account.id);
  const { error } = await sb.auth.admin.updateUserById(account.id, {
    user_metadata: { ...(data.user?.user_metadata ?? {}), wishlist: ids },
  });
  if (error) return NextResponse.json({ error: "Could not save wishlist" }, { status: 500 });
  return NextResponse.json({ ids });
}
