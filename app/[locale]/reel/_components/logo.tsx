import { LOGO, LOGO_BOTTOM, LOGO_TOP } from "../_lib/logo";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${LOGO.width} ${LOGO.height}`}
      role="img"
      aria-label="ARTIFACT Futures"
    >
      <g className="af-logo__top">
        {LOGO_TOP.map((glyph, index) => (
          <path key={index} d={glyph.d} />
        ))}
      </g>
      <g className="af-logo__bottom">
        {LOGO_BOTTOM.map((glyph, index) => (
          <path key={index} d={glyph.d} />
        ))}
      </g>
    </svg>
  );
}
