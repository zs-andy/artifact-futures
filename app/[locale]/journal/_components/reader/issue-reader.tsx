"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import { CentralIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import {
  ISSUE_META,
  PROJECT_INTROS,
  type IssueArticle,
  type IssueMeta,
  type IssueText,
} from "../../_lib/issue-text";
import "./issue-reader.css";

const pad = (n: number) => String(n).padStart(2, "0");
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
const snapshot = () => window.location.hash.slice(1);
const serverSnapshot = () => "";
function navigate(slug: string, reading = false) {
  const hash = `${slug}${reading ? "/read" : ""}`;
  if (window.location.hash === `#${hash}`) return;
  window.history.pushState(window.history.state, "", `#${hash}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
function Arrow({ back = false }: { back?: boolean }) {
  return (
    <CentralIcon
      className="ir-icon"
      name={back ? "IconArrowLeft" : "IconArrowRight"}
      size={18}
      stroke="1"
    />
  );
}
function textOf(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&");
}
function captionOf(article: IssueArticle, image: number) {
  const figure = article.blocks.find((block) => block.t === "fig" && block.images.includes(image));
  return figure?.t === "fig" && figure.caption
    ? textOf(figure.caption)
    : `${article.title} — ${article.author}`;
}

// Consecutive figures form one plate, preserving their original source order.
function platesOf(article: IssueArticle) {
  const plates: { start: number; images: number[] }[] = [];
  article.blocks.forEach((block, index) => {
    if (block.t !== "fig") return;
    if (index > 0 && article.blocks[index - 1].t === "fig") {
      plates[plates.length - 1].images.push(...block.images);
    } else {
      plates.push({ start: index, images: [...block.images] });
    }
  });
  return plates;
}

function Gallery({
  article,
  active,
  onChange,
  reading = false,
}: {
  article: IssueArticle;
  active: number;
  onChange: (index: number) => void;
  reading?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [enlarged, setEnlarged] = useState(0);
  const plate = reading
    ? platesOf(article).find((entry) => entry.images.includes(active))
    : undefined;
  const images = plate?.images ?? [active];
  const image = article.images[enlarged];
  const caption = captionOf(article, enlarged);
  if (!image) return null;
  return (
    <section className="ir-gallery" aria-label="Project images">
      <div className="ir-running-head">
        <span>{article.author}</span>
        <span>
          {pad(images[0] + 1)}
          {images.length > 1 ? `–${pad(images[images.length - 1] + 1)}` : ""}
        </span>
      </div>
      <div
        key={images.join("-")}
        className={`ir-plates ${images.length > 1 ? "ir-plates--group" : ""} ${images.length > 6 ? "ir-plates--dense" : ""}`}
      >
        {images.map((n) => (
          <figure key={n}>
            <button
              className="ir-plate"
              aria-label={`Enlarge image ${n + 1}`}
              onClick={() => {
                setEnlarged(n);
                dialog.current?.showModal();
              }}
            >
              <Image
                unoptimized
                src={article.images[n].src}
                width={article.images[n].width}
                height={article.images[n].height}
                alt={captionOf(article, n)}
                sizes={images.length > 1 ? "22vw" : "(max-width: 760px) 90vw, 44vw"}
                loading="eager"
              />
            </button>
            <figcaption>
              <span>{pad(n + 1)}</span> {captionOf(article, n)}
            </figcaption>
          </figure>
        ))}
      </div>
      {!reading && (
        <div className="ir-image-controls">
          <button
            aria-label="Previous image"
            disabled={active === 0}
            onClick={() => onChange(active - 1)}
          >
            <Arrow back />
          </button>
          <button
            aria-label="Next image"
            disabled={active === article.images.length - 1}
            onClick={() => onChange(active + 1)}
          >
            <Arrow />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="ir-lightbox"
        data-lenis-prevent=""
        aria-label="Enlarged project image"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <button className="ir-close" onClick={() => dialog.current?.close()}>
          Close image
        </button>
        <Image
          unoptimized
          src={image.src}
          width={image.width}
          height={image.height}
          alt={caption}
          sizes="100vw"
          loading="eager"
        />
        <p>{caption}</p>
      </dialog>
    </section>
  );
}

function ArticleBody({
  article,
  onImage,
  onNext,
}: {
  article: IssueArticle;
  onImage: (index: number) => void;
  onNext?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const lightbox = useRef<HTMLDialogElement>(null);
  const [enlarged, setEnlarged] = useState(0);
  const plates = platesOf(article);
  const enlargedImage = article.images[enlarged];
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const figures = Array.from(root.querySelectorAll<HTMLElement>("[data-reading-figure]"));
    const desktop = window.matchMedia("(min-width: 761px)");
    let timer: ReturnType<typeof setTimeout>;
    const sync = () => {
      if (!desktop.matches || !figures.length) return;
      // Follow the last figure to cross the reading line, in either direction.
      const line = root.getBoundingClientRect().top + root.clientHeight * 0.4;
      let active = 0;
      for (const figure of figures) {
        if (figure.getBoundingClientRect().top > line) break;
        active = Number(figure.dataset.readingFigure);
      }
      onImage(active);
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(sync, 180);
    };
    root.addEventListener("scroll", schedule, { passive: true });
    desktop.addEventListener("change", schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    const prose = root.querySelector(".ir-prose");
    if (prose) resize.observe(prose);
    schedule();
    return () => {
      clearTimeout(timer);
      root.removeEventListener("scroll", schedule);
      desktop.removeEventListener("change", schedule);
      resize.disconnect();
    };
  }, [article, onImage]);
  const showImage = (index: number) => {
    onImage(index);
    if (window.matchMedia("(max-width: 760px)").matches) {
      setEnlarged(index);
      lightbox.current?.showModal();
    }
  };
  return (
    <article
      ref={ref}
      className="ir-article"
      tabIndex={0}
      aria-label={`${article.title}, full text`}
    >
      <div className="ir-prose">
        <h1>{article.title}</h1>
        <p className="ir-byline">{article.author || "Sophie Huang, Editor in Chief"}</p>
        {article.blocks.map((block, index) => {
          if (block.t === "fig") {
            const plate = plates.find((entry) => entry.start === index);
            if (!plate) return null;
            return (
              <section
                className="ir-figure-reference"
                key={index}
                data-reading-figure={plate.images[0]}
              >
                <div className="ir-mobile-plates">
                  {plate.images.map((n) => (
                    <figure key={n}>
                      <button
                        onClick={() => showImage(n)}
                        className="ir-figure-link"
                        aria-label={`Enlarge figure ${n + 1}`}
                      >
                        <Image
                          unoptimized
                          src={article.images[n].src}
                          width={article.images[n].width}
                          height={article.images[n].height}
                          alt={captionOf(article, n)}
                          sizes="90vw"
                          loading={n === 0 ? "eager" : "lazy"}
                        />
                      </button>
                      <figcaption>{captionOf(article, n)}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          }
          if (block.t === "h")
            return <h2 key={index} dangerouslySetInnerHTML={{ __html: block.html }} />;
          if (block.t === "q")
            return <blockquote key={index} dangerouslySetInnerHTML={{ __html: block.html }} />;
          if (block.t === "ul" || block.t === "ol") {
            const List = block.t;
            return (
              <List key={index} start={block.t === "ol" ? block.start : undefined}>
                {block.items.map((item, n) => (
                  <li key={n} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </List>
            );
          }
          if (block.t === "p")
            return (
              <div key={index} className={block.ask ? "ir-question" : "ir-paragraph"}>
                {block.who && <span className="ir-speaker">{block.who}</span>}
                <p dangerouslySetInnerHTML={{ __html: block.html }} />
              </div>
            );
          return null;
        })}
        <div className="ir-article-end">
          <span>End of project</span>
          {onNext && (
            <button onClick={onNext}>
              <span className="ir-control-label">Next project</span>
              <Arrow />
            </button>
          )}
        </div>
      </div>
      {enlargedImage && (
        <dialog
          ref={lightbox}
          className="ir-lightbox"
          data-lenis-prevent=""
          aria-label="Enlarged article image"
          onClick={(event) => {
            if (event.target === event.currentTarget) lightbox.current?.close();
          }}
        >
          <button className="ir-close" onClick={() => lightbox.current?.close()}>
            Close image
          </button>
          <Image
            unoptimized
            src={enlargedImage.src}
            width={enlargedImage.width}
            height={enlargedImage.height}
            alt={captionOf(article, enlarged)}
            sizes="100vw"
            loading="eager"
          />
          <p>{captionOf(article, enlarged)}</p>
        </dialog>
      )}
    </article>
  );
}

function ProjectSpread({
  article,
  index,
  issue,
  meta,
  reading,
  onNext,
}: {
  article: IssueArticle;
  index: number;
  issue: string;
  meta: IssueMeta;
  reading: boolean;
  onNext?: () => void;
}) {
  const [image, setImage] = useState(0);
  const intro = PROJECT_INTROS[article.slug];
  return (
    <div className={`ir-spread ${reading ? "ir-spread--reading" : ""}`} data-lenis-prevent="">
      {reading ? (
        <>
          <Gallery article={article} active={image} onChange={setImage} reading />
          <ArticleBody article={article} onImage={setImage} onNext={onNext} />
        </>
      ) : (
        <>
          <section className="ir-cover" aria-labelledby="ir-project-title">
            <div className="ir-running-head">
              <span>{article.section}</span>
              <span>Project {pad(index + 1)}</span>
            </div>
            <div className="ir-cover-title">
              <p className="ir-kicker">
                <span className="ir-highlight">{issue}</span> {intro?.place}
              </p>
              <h1 id="ir-project-title">{intro?.title || article.title}</h1>
              {intro?.subtitle && <p className="ir-subtitle">{intro.subtitle}</p>}
            </div>
            <div className="ir-cover-note">
              <span className="ir-note-label">Introduction</span>
              <p>{intro?.summary}</p>
            </div>
            <div className="ir-cover-bottom">
              <div>
                <span className="ir-note-label">By</span>
                <p>{article.author}</p>
              </div>
              <button className="ir-read" onClick={() => navigate(article.slug, true)}>
                <span className="ir-control-label">Read project</span>
                <Arrow />
              </button>
            </div>
            <div className="ir-cover-folio">
              <span>{meta.theme}</span>
              <span>p. {article.page}</span>
            </div>
          </section>
          <Gallery article={article} active={image} onChange={setImage} />
        </>
      )}
    </div>
  );
}

export function IssueReader({ issue }: { issue: IssueText }) {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [slug, mode] = hash.split("/");
  const editorial = slug === "editorial-note";
  const index = Math.max(
    issue.articles.findIndex((entry) => entry.slug === slug),
    0,
  );
  const article = editorial ? issue.editorial : issue.articles[index];
  const reading = mode === "read" || editorial;
  const menu = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const previous = index > 0 ? issue.articles[index - 1] : null;
  const next = index < issue.articles.length - 1 ? issue.articles[index + 1] : null;
  const meta = ISSUE_META[issue.slug];
  const label = `Issue ${pad(issue.number)}`;
  const go = (target: string, read = false) => {
    menu.current?.close();
    navigate(target, read);
  };

  return (
    <main
      className="ir"
      aria-label={`${label} reader`}
      style={{ "--ir-accent": meta.accent } as CSSProperties}
    >
      <div className="ir-perimeter" aria-hidden="true" />
      <header className="ir-nav">
        <Link href="/" className="ir-exit" aria-label="Back to home" title="Home">
          <Arrow back />
          <span className="ir-control-label">Home</span>
        </Link>
        <button
          className="ir-contents-button"
          aria-label="Contents"
          aria-haspopup="dialog"
          aria-controls="ir-contents"
          title="Contents"
          onClick={() => menu.current?.showModal()}
        >
          <span className="ir-control-label">Contents</span>
          <CentralIcon className="ir-icon" name="IconBarsTwo" size={18} stroke="1" />
        </button>
      </header>
      <div
        className="ir-book"
        tabIndex={0}
        aria-label="Project spread"
        onKeyDown={(event) => {
          if (event.target instanceof Element && event.target.closest("dialog")) return;
          if (event.key === "ArrowRight" && next) {
            event.preventDefault();
            go(next.slug);
          }
          if (event.key === "ArrowLeft" && previous) {
            event.preventDefault();
            go(previous.slug);
          }
        }}
        onTouchStart={(event) => {
          if (event.target instanceof Element && event.target.closest("dialog")) return;
          const point = event.touches[0];
          touch.current =
            event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const point = event.changedTouches[0];
          const dx = point.clientX - start.x;
          const dy = point.clientY - start.y;
          if (Math.abs(dx) < 90 || Math.abs(dx) < Math.abs(dy) * 2) return;
          if (dx < 0 && next) go(next.slug);
          if (dx > 0 && previous) go(previous.slug);
        }}
      >
        {editorial ? (
          <div className="ir-spread ir-spread--editorial" data-lenis-prevent="">
            <section className="ir-editorial-cover">
              <p className="ir-kicker">ARTIFACT Journal / No. {pad(issue.number)}</p>
              <h1>
                {meta.heading.map((line, n) => (
                  <span key={n}>
                    {n > 0 && <br />}
                    {line}
                  </span>
                ))}
              </h1>
              <p>
                {meta.lede.map((line, n) => (
                  <span key={n}>
                    {n > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
              <span className="ir-highlight">{meta.edition}</span>
            </section>
            <ArticleBody
              key="editorial"
              article={article}
              onImage={() => {}}
              onNext={() => go(issue.articles[0].slug)}
            />
          </div>
        ) : (
          <ProjectSpread
            key={`${article.slug}/${reading}`}
            article={article}
            index={index}
            issue={label}
            meta={meta}
            reading={reading}
            onNext={next ? () => go(next.slug) : undefined}
          />
        )}
      </div>
      <footer className="ir-footer">
        <button
          className="ir-previous"
          aria-label={editorial ? "Projects" : "Previous project"}
          disabled={!previous && !editorial}
          onClick={() => go(editorial ? issue.articles[0].slug : previous!.slug)}
        >
          <Arrow back />
          <span className="ir-control-label">{editorial ? "Projects" : "Previous project"}</span>
        </button>
        <button
          className="ir-next"
          aria-label="Next project"
          disabled={!next && !editorial}
          onClick={() => go(editorial ? issue.articles[0].slug : next!.slug)}
        >
          <span className="ir-control-label">Next project</span>
          <Arrow />
        </button>
      </footer>
      <dialog
        ref={menu}
        id="ir-contents"
        className="ir-contents"
        data-lenis-prevent=""
        aria-labelledby="ir-contents-title"
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom
          ) menu.current?.close();
        }}
      >
        <header className="ir-contents-top">
          <h2 id="ir-contents-title">Contents</h2>
          <button aria-label="Close contents" onClick={() => menu.current?.close()}>Close</button>
        </header>
        <nav className="ir-contents-list" aria-label="Issue projects">
          <button
            aria-current={editorial ? "page" : undefined}
            onClick={() => go("editorial-note", true)}
          >
            <strong>Editorial</strong>
          </button>
          {issue.articles.map((entry) => (
            <button
              key={entry.slug}
              aria-current={!editorial && entry.slug === article.slug ? "page" : undefined}
              onClick={() => go(entry.slug)}
            >
              <strong>
                {PROJECT_INTROS[entry.slug]?.title.replace(/\n/g, " ") || entry.title}
              </strong>
              <small>{entry.author}</small>
            </button>
          ))}
        </nav>
      </dialog>
    </main>
  );
}
