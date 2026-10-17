export function HeroStage({ lines }: { lines: string[] }) {
  return (
    <div className="hero__stage">
      <h1 className="hero__title">
        {lines.map((line) => (
          <span key={line} className="hero__title-mask">
            <span className="hero__title-line">{line}</span>
          </span>
        ))}
      </h1>
    </div>
  );
}
