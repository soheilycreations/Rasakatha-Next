import type { CSSProperties } from "react";

// Shared by the server-rendered hero (initial state, slide 0 active) and the client carousel.
// Slide width comes from CSS (--hero-w, container-query units), so server and client agree
// without any JavaScript measuring: no layout shift when the carousel becomes interactive.
export const GAP = 26;

export function circularOffset(i: number, active: number, n: number) {
  let o = i - active;
  const half = n / 2;
  if (o > half) o -= n;
  else if (o < -half) o += n;
  return o;
}

export function slideStyle(offset: number): CSSProperties {
  const isActive = offset === 0;
  const hidden = Math.abs(offset) > 1;
  const dir = offset === 0 ? 0 : offset > 0 ? 1 : -1;
  return {
    width: "var(--hero-w)",
    aspectRatio: "1695 / 1020",
    marginLeft: "calc(var(--hero-w) / -2)",
    zIndex: isActive ? 10 : 5 - Math.abs(offset),
    transformStyle: "preserve-3d",
    transform: isActive
      ? "translateX(0px) scale(1) rotateY(0deg) translateZ(0px)"
      : `translateX(calc(${offset} * (var(--hero-w) * 0.55 + ${GAP}px))) scale(0.86) rotateY(${dir * -22}deg) translateZ(-140px)`,
    opacity: hidden ? 0 : isActive ? 1 : 0.55,
    filter: isActive ? "none" : "brightness(0.55)",
    pointerEvents: hidden ? "none" : "auto",
    boxShadow: isActive ? "0 40px 80px -24px rgba(0,0,0,0.9)" : "0 20px 50px -20px rgba(0,0,0,0.8)",
    transition: "transform 650ms cubic-bezier(0.22,0.61,0.36,1), opacity 650ms ease, filter 650ms ease, box-shadow 650ms ease",
  };
}

