import { Fragment, type ReactNode } from "react";

export function M({ children, block }: { children: ReactNode; block?: boolean }) {
  return (
    <span className={block ? "cv-m cv-m--block" : "cv-m"}>
      <span className="cv-m__in">{children}</span>
    </span>
  );
}

export function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return words.map((word, index) => (
    <Fragment key={index}>
      <M>{word}</M>
      {index < words.length - 1 ? " " : null}
    </Fragment>
  ));
}
