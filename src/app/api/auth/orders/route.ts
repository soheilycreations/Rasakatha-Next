import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/server/customerAuth";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase()
    .from("orders")
    .select("*")
    .eq("customer->>email", account.email.toLowerCase())
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load orders" }, { status: 500 });
  return NextResponse.json((data as OrderRow[]).map(rowToOrder));
}
