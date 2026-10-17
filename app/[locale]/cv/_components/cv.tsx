"use client";

import { useEffect, useRef } from "react";
import { COVER_FOOT, FINALE_FOOT } from "../_lib/content";
import { stage } from "../_lib/stage";
import { Plate } from "./plate";
import { Experience, Fellowship, Practice, Profile, With } from "./sections";

function Lines({ tone }: { tone: "ink" | "paper" }) {
  return (
    <div className={`cv-lines cv-lines--${tone}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

export function Cv() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return stage(root);
  }, []);

  return (
    <div ref={rootRef} className="cv-root" data-phase="intro">
      <Lines tone="ink" />
      <div className="cv-sheet" aria-hidden="true">
        <div className="cv-sheet__in">
          <Lines tone="paper" />
          <div className="cv-track">
            <Plate tone="paper" foot={COVER_FOOT} count />
          </div>
          <div className="cv-finale">
            <Plate tone="paper" foot={FINALE_FOOT} />
          </div>
        </div>
      </div>
      <header className="cv-cover">
        <Plate tone="ink" foot={COVER_FOOT} count />
      </header>
      <main className="cv-main">
        <Profile />
        <Practice />
        <Experience />
        <Fellowship />
        <With />
      </main>
      <footer className="cv-end">
        <Plate tone="paper" foot={FINALE_FOOT} />
      </footer>
    </div>
  );
}
