import { useId } from "react";
import { LOGO, LOGO_BOTTOM, LOGO_TOP } from "../_lib/logo";

export const LOGO_LINES = [
  { glyphs: LOGO_TOP, top: -2, bottom: 158 },
  { glyphs: LOGO_BOTTOM, top: 158, bottom: LOGO.height + 2 },
] as const;

export function Logo({ className }: { className?: string }) {
  const id = useId();

  return (
    <svg className={className} viewBox={`0 0 ${LOGO.width} ${LOGO.height}`} role="img" aria-label="ARTIFACT Futures">
      <defs>
        {LOGO_LINES.map((line, index) => (
          <clipPath key={index} id={`${id}-${index}`}>
            <rect x={-2} y={line.top} width={LOGO.width + 4} height={line.bottom - line.top} />
          </clipPath>
        ))}
      </defs>
      {LOGO_LINES.map((line, index) => (
        <g key={index} clipPath={`url(#${id}-${index})`}>
          <g className="logo__line" data-line={index}>
            {line.glyphs.map((glyph, glyphIndex) => (
              <path key={glyphIndex} className="logo__glyph" d={glyph.d} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}
