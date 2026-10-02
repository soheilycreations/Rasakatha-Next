import { NextResponse } from "next/server";
import { getBookById } from "@/lib/catalog";
import { bookHref, ROUTES } from "@/lib/links";

// Old shortlinks: /?p=<id> and /?post_type=product&p=<id>. The id is the WooCommerce product id.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookById(id);
  return NextResponse.redirect(new URL(book ? bookHref(book) : ROUTES.home, req.url), 308);
}
