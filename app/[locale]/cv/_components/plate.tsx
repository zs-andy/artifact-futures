import { BASES, INQUIRY } from "../_lib/content";
import { Barcode } from "./barcode";
import { Logo } from "./logo";
import { M } from "./mask";

export function Plate({
  tone,
  foot,
  count,
}: {
  tone: "ink" | "paper";
  foot: readonly string[];
  count?: boolean;
}) {
  const [stamp, ...lines] = foot;
  return (
    <div className={`cv-plate cv-plate--${tone}`}>
      <ol className="cv-plate__bases">
        {BASES.map((base, index) => (
          <li key={base}>
            <M>
              <span className="cv-plate__num">{String(index + 1).padStart(2, "0")}</span>
              {base}
            </M>
          </li>
        ))}
      </ol>
      <div className="cv-plate__code">
        <Barcode text={INQUIRY} />
      </div>
      <div className="cv-plate__mark">
        <M block>
          <Logo className="cv-plate__logo" />
        </M>
      </div>
      <div className="cv-plate__foot">
        <p className="cv-plate__stamp">
          {count ? (
            <M>
              <span className="cv-plate__count">0%</span>
            </M>
          ) : null}
          <M>{stamp}</M>
        </p>
        {lines.map((line) => (
          <p key={line} className="cv-plate__line">
            <M>{line}</M>
          </p>
        ))}
      </div>
    </div>
  );
}
