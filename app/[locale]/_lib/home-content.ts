import { asset } from "@/lib/assets";

export type Media = { src: string; alt: string; width: number; height: number };

const mock = (name: string, width: number, height: number): Media => ({
  src: `/home/mock/${name}.webp`,
  alt: "",
  width,
  height,
});

export const SLOGAN = ["We support", "ideas that matter", "beyond the moment."];

export type Issue = {
  number: string;
  title: string;
  place: string;
  date: string;
  cover: Media | null;
};

export const JOURNAL = {
  index: "01",
  label: "Journal",
  href: "/journal",
  cta: "Explore the Journal",
  lead: "The Journal is an annual publication that brings together voices across art, technology, science and public life to examine questions that shape our shared future.",
  media: mock("05", 1600, 1067),
  issues: [
    {
      number: "No. 1",
      title: "Collectivity and Alternative Forms of Knowledge",
      place: "Venice",
      date: "May 2025",
      cover: {
        src: asset("journal/issue-01/en/0001.webp"),
        alt: "Cover of Issue No. 1, Collectivity and Alternative Forms of Knowledge.",
        width: 2000,
        height: 2806,
      },
    },
    {
      number: "No. 2",
      title: "Migration, Fluidity, Resilience",
      place: "Shanghai",
      date: "November 2025",
      cover: {
        src: asset("journal/issue-02/zh-en/0001.webp"),
        alt: "Cover of Issue No. 2, Migration, Fluidity, Resilience.",
        width: 2000,
        height: 2806,
      },
    },
    {
      number: "No. 3",
      title: "The Future is Behind Us",
      place: "Abu Dhabi",
      date: "December 2026",
      cover: null,
    },
  ] satisfies Issue[],
};

export const RESIDENCY = {
  index: "02",
  label: "Residency",
  sublabel: "Fellowship",
  href: "/residency",
  cta: "Explore the Residency",
  lead: "The ARTIFACT Futures Fellowship is a research residency in Hanoi for people working across art, culture, science, and technology.",
  term: "Each term brings together two Fellows.",
  fellows: [mock("06", 1067, 1600), mock("07", 1200, 1600)],
  artifact: "At the conclusion of the Fellowship, each Fellow contributes an Artifact:",
  forms: [
    "a research note",
    "a dataset",
    "an image",
    "an interview",
    "a piece of code",
    "a prototype",
    "a recording",
    "an experiment",
    "an object",
    "a methodology",
  ],
};

export const STAY = {
  heading: "A space for sustained inquiry",
  headingMuted: "and independent practice.",
  rows: [
    {
      title: "Independent practice",
      copy: "No milestones or predetermined outcomes. Time and conditions for making, building, researching, reading, writing and reflection.",
    },
    {
      title: "A wider conversation",
      copy: "Residents set their own rhythm while meeting artists, researchers, builders, curators, technologists and institutional leaders across the ARTIFACT Futures community.",
    },
    {
      title: "Place as research",
      copy: "Beyond the studio, the local environment, its rhythms and unexpected encounters become part of the research itself.",
    },
    {
      title: "Ongoing dialogue",
      copy: "Regular conversations with the ARTIFACT Futures team on the ideas, assumptions and responsibilities behind each practice.",
    },
    {
      title: "Editorial contribution",
      copy: "Essays, conversations, research notes and visual projects that articulate the questions and processes behind the work, not only its outcomes.",
    },
  ],
};

export type Occasion = {
  date: string;
  city: string;
  kind: string;
  title: string;
  media: Media;
};

export const PROGRAMME = {
  label: "Programme",
  occasions: [
    {
      date: "December 2026",
      city: "Abu Dhabi",
      kind: "Journal No. 3 — Launch",
      title: "The Future is Behind Us",
      media: mock("12", 1600, 1067),
    },
    {
      date: "August 2026",
      city: "Hanoi",
      kind: "Fellowship",
      title: "Inaugural Builder-in-Residence: Timothy Shen",
      media: mock("07", 1600, 1067),
    },
    {
      date: "June 2026",
      city: "London",
      kind: "Programme — Forum",
      title: "London Forum: The Future is Behind Us",
      media: mock("08", 1600, 1067),
    },
    {
      date: "June 2026",
      city: "London",
      kind: "Programme — Gathering",
      title: "An Evening at Leighton House",
      media: mock("09", 1600, 1067),
    },
    {
      date: "November 2025",
      city: "Shanghai",
      kind: "Journal No. 2 — Release",
      title: "Migration, Fluidity, Resilience",
      media: mock("10", 1600, 1067),
    },
    {
      date: "May 2025",
      city: "Venice",
      kind: "Journal No. 1 — Release",
      title: "Collectivity and Alternative Forms of Knowledge",
      media: mock("11", 1600, 1200),
    },
  ] satisfies Occasion[],
};

export const FELLOWSHIP = {
  label: "Fellowship",
  lead: "A research residency in Hanoi for people working across art, culture, science, and technology.",
  cols: [
    "Each term brings together two Fellows, situated within the Annual Inquiry shared by the Fellowship, Journal, and Programme.",
    "Open to researchers, artists, curators, writers, scientists, technologists, designers, builders, and independent practitioners.",
    "Inaugural Builder-in-Residence: Timothy Shen, founder of Creader.io, for one month in Hanoi.",
  ],
  artifact: "At the conclusion of the Fellowship, each Fellow contributes an",
  forms: [
    "a research note",
    "a dataset",
    "an image",
    "an interview",
    "a piece of code",
    "a prototype",
    "a recording",
    "an experiment",
    "an object",
    "a methodology",
  ],
  corpus: "Together, these contributions form an evolving institutional research corpus.",
};

export const WITH = {
  label: "With",
  columns: [
    [
      { title: "Venice, 2025", people: [["Carlo Ratti", "Curator"], ["Trung Mai", "Architect"]] },
      {
        title: "Shanghai, 2025",
        people: [
          ["Yang Zi", "Co-curator"],
          ["Mai Tạ", "Co-curator"],
          ["Sophie Huang", "Co-curator"],
          ["Florian Sông Nguyễn", "Panellist"],
          ["Qiu Anxiong", "Panellist"],
          ["Hedvig Liestøl", "Moderator"],
          ["Emma Feng", "Translation"],
        ],
      },
    ],
    [
      {
        title: "London, 2026 — Reimagine Renaissance",
        people: [
          ["Linn Zhang", "Durham University"],
          ["Anna J. Secor", "Durham University"],
          ["Ben Anderson", "Durham University"],
          ["Elise Guillaume", "Artist"],
          ["Mete Kutlu", "Artist, creative technologist"],
        ],
      },
      {
        title: "Builders’ Chit-Chat",
        people: [
          ["Muchun Niu", "ARTIFACT Futures, chair"],
          ["Kolento Hou", "Emergences Labs / NYU"],
          ["Xiaoben Liu", "Everlasting AI"],
          ["Jacob S. Walker", "Ballistic Architecture Machine"],
          ["Henry Yuan", "Typework AI"],
        ],
      },
    ],
    [
      {
        title: "Art in Motion",
        people: [
          ["Annette Mees", "ARTIFACT Futures, chair"],
          ["Tao-Tao Chang", "British Council"],
          ["Anastasia Mavrogianni", "Onassis Foundation"],
          ["Tateo Nakajima", "Therme Group"],
          ["Qiu Anxiong", "East China Normal University"],
          ["Kay Watson", "Serpentine"],
        ],
      },
      { title: "Keynote", people: [["Daniel Glaser", "In a personal capacity"]] },
    ],
  ],
  partners: [
    "British Library",
    "London Tech Week",
    "West Bund Art & Design",
    "Venice Biennale of Architecture",
    "ElevenLabs",
    "Leighton House Museum",
    "Creative AI Foundation",
    "Typework",
  ],
};
