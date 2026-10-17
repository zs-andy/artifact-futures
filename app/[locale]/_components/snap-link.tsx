import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type SnapLinkProps = { href: string; className?: string; children: ReactNode } & Pick<
  ComponentProps<"a">,
  "target" | "rel"
>;

export function SnapLink({ href, className, children, ...rest }: SnapLinkProps) {
  return (
    <Link className={className ? `home__cta-link ${className}` : "home__cta-link"} href={href} data-snap {...rest}>
      {children}
      <span className="home__cta-ink" aria-hidden="true">
        {children}
      </span>
    </Link>
  );
}
