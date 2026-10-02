import { NextResponse } from "next/server";
import { authClient, currentAccount } from "@/lib/server/customerAuth";

export async function GET() {
  return NextResponse.json(await currentAccount());
}

export async function PATCH(request: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { name, phone } = (await request.json()) as { name?: string; phone?: string };
  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
  }

  const next = {
    name: name !== undefined ? name.trim() : account.name,
    phone: phone !== undefined ? phone.trim() : account.phone,
  };
  // keep other metadata (e.g. the wishlist) when updating name/phone
  const sb = authClient();
  const { data: current } = await sb.auth.admin.getUserById(account.id);
  const { error } = await sb.auth.admin.updateUserById(account.id, {
    user_metadata: { ...(current.user?.user_metadata ?? {}), ...next },
  });
  if (error) return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  return NextResponse.json({ ...account, ...next });
}
