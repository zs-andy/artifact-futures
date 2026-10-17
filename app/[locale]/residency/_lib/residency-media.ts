export const RESIDENCY_WEST_BUND_MEDIA = {
  hall: {
    src: "/residency/west-bund-murmurs/hall.jpg",
    alt: "The Murmurs booth at Shanghai West Bund Art & Design, seen across the industrial hall.",
  },
  booth: {
    src: "/residency/west-bund-murmurs/booth.jpg",
    alt: "ARTIFACT journals on a low wooden plinth in front of the Murmurs booth at West Bund.",
  },
} as const;

export const RESIDENCY_OPEN_STUDIO_MEDIA = {
  work: {
    src: "/residency/hanoi-open-studio/work.jpg",
    alt: "White sculptural forms on a translucent block at the VAC Hanoi open studio.",
  },
  statement: {
    src: "/residency/hanoi-open-studio/statement.jpg",
    alt: "A visitor reading an artist statement at VAC Hanoi.",
  },
  visit: {
    src: "/residency/hanoi-open-studio/visit.jpg",
    alt: "A visitor photographing studio models at VAC Hanoi.",
  },
} as const;

export const RESIDENCY_STORY_MEDIA = {
  side: RESIDENCY_OPEN_STUDIO_MEDIA.visit,
  stacked: RESIDENCY_WEST_BUND_MEDIA.hall,
} as const;

export const RESIDENCY_CHAPTER_MEDIA = {
  experience: {
    src: "/residency/experience/gathering.jpg",
    alt: "A group of people gathered informally in a wood-paneled room.",
  },
  archiveEditorial: RESIDENCY_WEST_BUND_MEDIA.booth,
  archiveDocumentation: RESIDENCY_OPEN_STUDIO_MEDIA.work,
} as const;
