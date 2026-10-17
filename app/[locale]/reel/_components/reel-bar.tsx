import { Link } from "@/i18n/navigation";
import { CONTENTS } from "../_lib/reel-data";

export function ReelBar() {
  return (
    <header className="rl-bar">
      <Link href="/reel" className="rl-bar__mark">
        ARTIFACT Futures
      </Link>
      <nav className="rl-bar__nav" aria-label="Sections">
        {CONTENTS.map((entry) => (
          <Link key={entry.href} href={entry.href} className="rl-bar__link">
            {entry.title}
          </Link>
        ))}
      </nav>
    </header>
  );
}
