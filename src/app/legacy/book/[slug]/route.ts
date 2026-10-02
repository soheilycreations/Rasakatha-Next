import { NextResponse } from "next/server";
import { getBookById } from "@/lib/catalog";
import { bookHref, ROUTES } from "@/lib/links";
import { legacyBookId } from "@/lib/legacy";

// Old WooCommerce /books/<slug> and /product/<slug> URLs (rewritten here from next.config.ts).
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = legacyBookId(slug);
  const book = id ? await getBookById(id) : null;
  const target = book ? bookHref(book) : null;
  if (!target) return NextResponse.redirect(new URL(ROUTES.categories, req.url), 308);
  return NextResponse.redirect(new URL(target, req.url), 308);
}
