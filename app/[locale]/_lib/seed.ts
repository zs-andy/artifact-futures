import type { CSSProperties } from "react";

export const SEED = {
  size: 14,
  radius: 3,
  color: "#1546b0",
} as const;

export const seedStyle = {
  "--home-seed": `${SEED.size}px`,
  "--home-radius": `${SEED.radius}px`,
  "--home-blue": "var(--brand)",
} as CSSProperties;
