"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { RESIDENCY_CHAPTER_MEDIA } from "../_lib/residency-media";
import { ResidencyCommunity } from "./residency-community";

export function ResidencyChapters() {
  const t = useTranslations("residency.chapters");

  return (
    <div className="residency-chapters">
      <section className="residency-chapter residency-chapter--why" id="residency-why" data-nav-tone="paper" aria-labelledby="residency-why-title">
        <div className="inquiry-intro chapter-pad">
          <h2 className="inquiry-display" id="residency-why-title">{t("design.whyDisplay")}</h2>
          <div className="inquiry-statement" data-reveal>
            <span className="inquiry-caption">{t("why.title")}</span>
            <p>{t("why.lead")} {t("why.context")}</p>
          </div>
        </div>
        <div className="inquiry-reading chapter-pad">
          <p className="chapter-lead" data-reveal>{t("why.conditions")}</p>
          <div className="chapter-copy" data-reveal>
            <p>{t("why.exchangeCopy")}</p>
          </div>
        </div>
      </section>

      <section className="residency-chapter residency-chapter--experience" id="residency-experience" data-nav-tone="dark" aria-label={t("experience.title")}>
        <div className="experience-room" data-nav-tone="dark">
          <div className="experience-room__image">
            <Image
              src={RESIDENCY_CHAPTER_MEDIA.experience.src}
              alt={t("experience.imageAlt")}
              fill
              sizes="100vw"
              draggable={false}
            />
          </div>
          <div className="experience-room__shade" />
          <div className="experience-room__content chapter-pad">
            <p className="room-display"><span>{t("design.roomLine1")}</span> <em>{t("design.roomLine2")}</em></p>
          </div>
        </div>
        <div className="chapter-scene chapter-scene--score">
          <div className="chapter-scene__frame experience-score chapter-pad" data-nav-tone="dark">
            {(["practice", "conversation", "place", "dialogue", "editorial"] as const).map((step) => (
              <article className="experience-line" key={step}>
                <h3>{t(`experience.${step}.title`)}</h3>
                <div className="experience-detail">
                  <p className="chapter-copy">{t(`experience.${step}.copy`)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="residency-chapter residency-chapter--archive chapter-pad" data-nav-tone="paper" aria-labelledby="residency-archive-title">
          <h2 className="archive-display" id="residency-archive-title"><span>{t("design.archiveLine1")}</span> <em>{t("design.archiveLine2")}</em></h2>
          <div className="archive-workspace">
            <div className="archive-desk" aria-hidden="true">
              <div className="archive-sheet archive-sheet--back"><span>ARTIFACT<br />Futures</span><span>{t("design.researchNotes")}</span></div>
              <div className="archive-sheet archive-sheet--editorial">
                <Image
                  src={RESIDENCY_CHAPTER_MEDIA.archiveEditorial.src}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 70vw, 32vw"
                  draggable={false}
                />
                <span>01 / {t("design.visualPractice")}</span>
              </div>
              <div className="archive-sheet archive-sheet--documentation">
                <Image
                  src={RESIDENCY_CHAPTER_MEDIA.archiveDocumentation.src}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 70vw, 32vw"
                  draggable={false}
                />
                <span>02 / {t("design.evolvingRecord")}</span>
              </div>
            </div>
            <div className="archive-reading">
              <section className="archive-entry" id="residency-documentation" data-reveal>
                <h3>{t("documentation.title")}</h3>
                <div className="chapter-copy archive-entry__copy">
                  <p className="chapter-copy__emphasis">{t("documentation.lead")}</p>
                  <p>{t("documentation.process")}</p>
                  <p>{t("documentation.archive")}</p>
                </div>
              </section>
            </div>
          </div>
      </section>

      <ResidencyCommunity />

      <section className="residency-chapter residency-chapter--beyond chapter-pad" id="residency-beyond" data-nav-tone="paper" aria-label={t("beyond.title")}>
        <p className="beyond-display" data-reveal><span>{t("design.beyondLine1")}</span><em>{t("design.beyondLine2")}</em></p>
        <div className="beyond-reading">
          <p className="chapter-lead" data-reveal>{t("beyond.lead")}</p>
          <div className="chapter-copy" data-reveal><p>{t("beyond.continuation")}</p><p>{t("beyond.time")}</p></div>
        </div>
      </section>
    </div>
  );
}
