import { code128 } from "../_lib/code128";

export function Barcode({ text, className }: { text: string; className?: string }) {
  const { bars, modules } = code128(text);
  return (
    <svg className={className} viewBox={`0 0 ${modules} 1`} preserveAspectRatio="none" role="img" aria-label={text}>
      {bars.map((bar) => (
        <rect key={bar.at} className="cv-bar" x={bar.at} y={0} width={bar.size} height={1} />
      ))}
    </svg>
  );
}
