import { NextResponse } from "next/server";
import { categoryHref, ROUTES } from "@/lib/links";
import { legacyCategoryName } from "@/lib/legacy";

// Old /product-category/<slug> URLs. Categories that don't map cleanly fall back to /categories.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = legacyCategoryName(slug);
  return NextResponse.redirect(new URL(name ? categoryHref(name) : ROUTES.categories, req.url), 308);
}
