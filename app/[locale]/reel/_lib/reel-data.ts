import { asset } from "@/lib/assets";

const SCAN_BASE = asset("journal/issue-01/en/");

export const SCAN_SIZE = { width: 2000, height: 2806 } as const;

export const scan = (page: number) => `${SCAN_BASE}${String(page).padStart(4, "0")}.webp`;

export const WORDMARK = "ARTIFACT";

export const INSTITUTION = "A research-driven cultural institution";

export const SLOGAN = ["We support", "ideas that matter", "beyond the", "moment."];

export const BASES = [
  { city: "New York", zone: "America/New_York" },
  { city: "Hanoi", zone: "Asia/Ho_Chi_Minh" },
  { city: "Shanghai", zone: "Asia/Shanghai" },
  { city: "Abu Dhabi", zone: "Asia/Dubai" },
] as const;

export const BARCODE = "The Future is Behind Us";

export const JOURNAL = {
  word: "Journal",
  line: "An annual publication that brings together voices across art, technology, science and public life.",
  issues: [
    { number: "No. 1", title: "Collectivity and Alternative Forms of Knowledge", place: "Venice", date: "05.2025" },
    { number: "No. 2", title: "Migration, Fluidity, Resilience", place: "Shanghai", date: "11.2025" },
    { number: "No. 3", title: "The Future is Behind Us", place: "Abu Dhabi", date: "12.2026" },
  ],
  spreads: [
    [14, 15],
    [30, 31],
    [50, 51],
    [66, 67],
    [120, 121],
    [136, 137],
    [150, 151],
    [170, 171],
    [184, 185],
  ] as [number, number][],
  count: 204,
};

export const FELLOWSHIP = {
  word: ["Fellow-", "ship"],
  line: "A research residency in Hanoi. Each term brings together two Fellows.",
  lead: "Each Fellow contributes an Artifact:",
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
  photo: { src: "/residency/hanoi-open-studio/work.jpg", width: 1364, height: 908, alt: "Work on the wall of the VAC open studio in Hanoi." },
};

export const PROGRAMME = {
  word: ["Pro-", "gramme"],
  events: [
    { place: "Venice", date: "05.2025", title: "Inaugural launch at the Venice Biennale of Architecture" },
    { place: "Shanghai", date: "11.2025", title: "Shaping the Future: The Rise of Vietnamese Contemporary Art" },
    { place: "London", date: "06.2026", title: "London Forum: The Future is Behind Us" },
    { place: "Abu Dhabi", date: "12.2026", title: "Issue No. 3" },
  ],
  label: "Annual Inquiry, 2026",
  inquiry: ["The Future", "is Behind Us"],
};

export const CONTENTS = [
  { number: "01", title: "Journal", note: "An annual publication", href: "/reel/journal" },
  { number: "02", title: "Residency", note: "A research residency in Hanoi", href: "/reel/residency" },
  { number: "03", title: "Programme", note: "Venice, Shanghai, London, Abu Dhabi", href: "/reel/programme" },
  { number: "04", title: "About", note: "New York, Hanoi, Shanghai, Abu Dhabi", href: "/reel/about" },
] as const;
