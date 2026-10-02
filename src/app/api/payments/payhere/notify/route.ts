import { NextResponse, after } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { notifyOrderPlaced } from "@/lib/server/notify";
import { formatAmount, verifyPayHereNotification } from "@/lib/server/payments";

// PayHere server-to-server callback (notify_url). Always answer 200 once the
// request is authentic so PayHere stops retrying; reject anything unsigned.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return new NextResponse("Bad request", { status: 400 });
  const p: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") p[k] = v;

  if (!verifyPayHereNotification(p)) return new NextResponse("Invalid signature", { status: 400 });

  const { data: order } = await supabase()
    .from("orders")
    .select("*")
    .eq("id", p.order_id)
    .maybeSingle();
  if (!order || order.payment !== "payhere") return new NextResponse("Unknown order", { status: 404 });
  if (p.payhere_currency !== "LKR" || p.payhere_amount !== formatAmount(Number(order.total))) {
    return new NextResponse("Amount mismatch", { status: 400 });
  }

  // status_code: 2 success, 0 pending, -1 cancelled, -2 failed, -3 charged back
  const code = Number(p.status_code);
  let next: "paid" | "failed" | null = null;
  if (code === 2) next = "paid";
  else if (code === -3) next = "failed";
  else if ((code === -1 || code === -2) && order.payment_status !== "paid") next = "failed";

  if (next && order.payment_status !== next) {
    await supabase().from("orders").update({ payment_status: next }).eq("id", order.id);
    if (next === "paid") {
      const paidOrder = rowToOrder({ ...(order as OrderRow), payment_status: "paid" });
      after(() => notifyOrderPlaced(paidOrder));
    }
  }
  return new NextResponse("OK");
}
