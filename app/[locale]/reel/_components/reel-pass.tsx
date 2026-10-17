import type { ReactNode } from "react";

export function Pass({
  children,
  className,
  axis,
  head,
}: {
  children: ReactNode;
  className?: string;
  axis?: "x" | "y";
  head?: "orange" | "pale" | "white" | "black" | "blue" | "none";
}) {
  return (
    <span
      className={className ? `rl-pass ${className}` : "rl-pass"}
      data-axis={axis ?? "x"}
      data-head={head ?? "orange"}
    >
      <span className="rl-pass__clip">
        <span className="rl-pass__ink">{children}</span>
      </span>
      {head === "none" ? null : <span className="rl-pass__head" aria-hidden="true" />}
    </span>
  );
}
