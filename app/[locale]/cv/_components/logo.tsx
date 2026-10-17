import { LOGO, LOGO_BOTTOM, LOGO_TOP } from "../_lib/logo";

export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${LOGO.width} ${LOGO.height}`} role="img" aria-label="ARTIFACT Futures">
      {[...LOGO_TOP, ...LOGO_BOTTOM].map((glyph, index) => (
        <path key={index} d={glyph.d} />
      ))}
    </svg>
  );
}
