export const BASES = ["New York", "Hanoi", "Shanghai", "Abu Dhabi"] as const;

export const INQUIRY = "The Future is Behind Us";

export const COVER_FOOT = [
  "Curriculum Vitae",
  "A research-driven cultural institution",
  "Journal, Fellowship, Programme",
  "Annual Inquiry: The Future is Behind Us",
] as const;

export const FINALE_FOOT = [
  "Curriculum Vitae",
  "Next: Journal No. 3",
  "Abu Dhabi, December 2026",
  "The Future is Behind Us",
] as const;

export const PROFILE = {
  lead: "ARTIFACT Futures is a research-driven cultural institution with bases in New York, Hanoi, Shanghai, and Abu Dhabi.",
  body: [
    "Rooted in the long-term research and cultural work of Vietnam Art Collection (VAC), the founding initiative of ARTIFACT Futures.",
    "Bringing together art and collecting, interdisciplinary research, cultural production, public and institutional engagement, and the cultivation of emerging artists, builders, and researchers.",
    "Rather than organizing our work around disciplines, we are guided by questions that require depth, experimentation, and sustained attention.",
  ],
  roles: [
    { word: "Artists,", from: "left" },
    { word: "builders,", from: "up" },
    { word: "researchers,", from: "down" },
    { word: "and institutional leaders", from: "right" },
  ],
  rest: "increasingly confront the same questions from different directions.",
  close:
    "Our role is to create the conditions for these perspectives to meet—not to dissolve their differences, but to deepen the conversation between them.",
} as const;

export const PRACTICE = {
  intro: "Our work unfolds through three interconnected practices.",
  items: [
    {
      name: "Journal",
      kind: "Annual publication",
      text: "Voices across art, technology, science and public life examine questions that shape our shared future.",
      meta: "Open-access · Issues No. 1–3",
    },
    {
      name: "Fellowship",
      kind: "Research residency, Hanoi",
      text: "Time and space to pursue a question, test a method in a new context, or develop work already underway.",
      meta: "Two Fellows each term",
    },
    {
      name: "Programme",
      kind: "Public programme",
      text: "Forums, panels and gatherings that bring different disciplines, perspectives and communities into dialogue.",
      meta: "Venice · Shanghai · London",
    },
  ],
  inquiry: "Each year an Annual Inquiry connects all three. 2026: The Future is Behind Us.",
} as const;

export type Entry = {
  year: number;
  month: number;
  date: string;
  city: string;
  kind: string;
  title: string;
  text: string;
  code: string;
};

export const NOW = { year: 2026, month: 9, date: "Sep 2026" } as const;

export const EXPERIENCE: readonly Entry[] = [
  {
    year: 2026,
    month: 12,
    date: "Dec 2026",
    city: "Abu Dhabi",
    kind: "Journal No. 3 — Launch",
    title: "The Future is Behind Us",
    text: "Memory, knowledge, creativity, responsibility, and what it means to remain human in an age of increasingly intelligent systems.",
    code: "AF 2026.12",
  },
  {
    year: 2026,
    month: 8,
    date: "Aug 2026",
    city: "Hanoi",
    kind: "Fellowship",
    title: "Inaugural Builder-in-Residence: Timothy Shen",
    text: "One month in Hanoi exploring artificial intelligence, writing as a form of knowledge production, and the digital infrastructures behind creative work.",
    code: "AF 2026.08",
  },
  {
    year: 2026,
    month: 6,
    date: "Jun 2026",
    city: "London",
    kind: "Programme — Forum",
    title: "London Forum: The Future is Behind Us",
    text: "Knowledge Centre, British Library, 10 June. An official Fringe Programme of London Tech Week 2026: three panels, a keynote and a Reading Room.",
    code: "AF 2026.06.10",
  },
  {
    year: 2026,
    month: 6,
    date: "Jun 2026",
    city: "London",
    kind: "Programme — Gathering",
    title: "An Evening at Leighton House",
    text: "With ElevenLabs, at the former home and studio of Frederic, Lord Leighton, whose voice was reconstructed and given back to the house he built.",
    code: "AF 2026.06.11",
  },
  {
    year: 2025,
    month: 11,
    date: "Nov 2025",
    city: "Shanghai",
    kind: "Journal No. 2 — Release",
    title: "Migration, Fluidity, Resilience",
    text: "West Bund Art & Design 2025, with the panel Shaping the Future: The Rise of Vietnamese Contemporary Art, part of Murmurs.",
    code: "AF 2025.11",
  },
  {
    year: 2025,
    month: 5,
    date: "May 2025",
    city: "Venice",
    kind: "Journal No. 1 — Release",
    title: "Collectivity and Alternative Forms of Knowledge",
    text: "19th Venice Biennale of Architecture, 7 May, alongside Trung Mai’s The Reincarnated Grid in Intelligens. Natural. Artificial. Collective., curated by Carlo Ratti.",
    code: "AF 2025.05.07",
  },
];

export const FELLOWSHIP = {
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
} as const;

export const WITH = [
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
] as const;

export const PARTNERS = [
  "British Library",
  "London Tech Week",
  "West Bund Art & Design",
  "Venice Biennale of Architecture",
  "ElevenLabs",
  "Leighton House Museum",
  "Creative AI Foundation",
  "Typework",
] as const;
