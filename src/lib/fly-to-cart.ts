export type FlyToCartPayload = {
  rect: DOMRect;
  imgSrc?: string | null;
  tint?: string;
};

type Listener = (payload: FlyToCartPayload) => void;

let listeners: Listener[] = [];

export function onFlyToCart(cb: Listener) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function triggerFlyToCart(payload: FlyToCartPayload) {
  listeners.forEach((l) => l(payload));
}
