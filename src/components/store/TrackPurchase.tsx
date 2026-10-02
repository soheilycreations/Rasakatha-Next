"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

type Line = { id: string; title: string; price: number; qty: number };

export default function TrackPurchase({
  orderId,
  total,
  shipping,
  items,
}: {
  orderId: string;
  total: number;
  shipping: number;
  items: Line[];
}) {
  useEffect(() => {
    trackPurchase(orderId, total, shipping, items);
    // items is rebuilt per render on the server; the id guard in trackPurchase prevents repeats
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);
  return null;
}
