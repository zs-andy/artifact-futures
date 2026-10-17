export type IssueImage = { src: string; width: number; height: number };

export type IssueBlock =
  | { t: "p"; html: string; who?: string; ask?: boolean }
  | { t: "h" | "q"; html: string }
  | { t: "ul" | "ol"; items: string[]; start?: number }
  | { t: "fig"; images: number[]; caption?: string };

export type IssueArticle = {
  slug: string;
  order: number;
  section: string;
  page: number | null;
  title: string;
  author: string;
  images: IssueImage[];
  blocks: IssueBlock[];
};

export type IssueText = {
  slug: string;
  number: number;
  editorial: IssueArticle;
  articles: IssueArticle[];
};

export type IssueMeta = {
  theme: string;
  heading: string[];
  lede: string[];
  edition: string;
  accent: string;
};

export const ISSUE_META: Record<string, IssueMeta> = {
  "issue-01": {
    theme: "Collectivity and Alternative Forms of Knowledge",
    heading: ["Collectivity", "and Alternative", "Forms of", "Knowledge."],
    lede: ["A different kind", "of archive."],
    edition: "Venice · 2025",
    accent: "#1546b0",
  },
  "issue-02": {
    theme: "Migration, Fluidity, Resilience",
    heading: ["Migration,", "Fluidity,", "Resilience."],
    lede: ["A map that is constantly", "being redrawn."],
    edition: "West Bund Edition · 2025",
    accent: "#727343",
  },
};

// Editorial introductions for the preview, based on the original Westbund texts.
export const PROJECT_INTROS: Record<
  string,
  { title: string; subtitle?: string; summary: string; place: string }
> = {
  "from-hanoi-train-factory-to-venice-grid": {
    title: "From Hanoi\nTrain Factory\nto Venice Grid",
    subtitle: "In conversation with Trung Mai",
    summary:
      "Starting from the Gia Lam train factory, Emma Feng and architect Trung Mai trace Hanoi's industrial past and the Grid Project. A conversation about buildings that are brief in matter but lasting in shared memory.",
    place: "Hanoi / Venice",
  },
  "the-archive-too-bears-witness": {
    title: "The Archive,\nToo, Bears\nWitness",
    subtitle: "In dialogue with Salon Natasha's co-founder",
    summary:
      "Invitations, calendars, and works made from newspaper and vinyl. Vi Bui talks with Natalia Kraevskaia about how records become evidence, and how an archive can hold a history of Vietnamese art that was rarely written down.",
    place: "Hanoi, Vietnam",
  },
  "seeing-beyond-systems": {
    title: "Seeing Beyond\nSystems",
    subtitle: "In conversation with Diane Severin Nguyen",
    summary:
      "Representation, language, purity, and power. Emma Feng follows Diane Severin Nguyen's photographs and films as they resist fixed meanings, and treat what is lost in translation as a material of its own.",
    place: "Image, language, power",
  },
  "haegue-yang-tearoom": {
    title: "Haegue Yang\n& TEAROOM",
    summary:
      "A classroom turned into a tea room. Since 2021, Haegue Yang and students of the Städelschule have hosted readings, performances, screenings, and talks. Sophie Huang follows a platform that changes with every place it lands.",
    place: "Venice / Frankfurt / London / Hanoi",
  },
  "3nam-temporary-shelter-lasting-imprint": {
    title: "3năm",
    subtitle: "Temporary Shelter, Lasting Imprint",
    summary:
      "Three years of a self-organised art space in Saigon: shared studios, lantern workshops, a garden villa, a library. Hong Vu looks back on DIY labour, mutual support, and what a short-lived collective leaves behind.",
    place: "Saigon, Vietnam",
  },
  "a-ngach-of-hanois-art-scene": {
    title: "A \u201cngách\u201d\nof Hanoi\u2019s\nArt Scene",
    subtitle: "Part 1",
    summary:
      "Silk, watercolour, frame workshops, and the last days before an opening. Through two anonymous artists, Phi Trang walks the markets, cafés, and side alleys where art in Hanoi actually gets made.",
    place: "Hanoi, Vietnam",
  },
  "tra-da-with-thuy-tien-nguyen": {
    title: "Trà đá",
    subtitle: "With Thuy-Tien Nguyen",
    summary:
      "The loose talk of a Hanoi iced-tea stall, turned into a free-association interview: one sentence, two dreams, three words, four SWOT angles, and five premises for making work.",
    place: "Hanoi, Vietnam",
  },
  "empire-of-light": {
    title: "Empire\nof Light",
    summary:
      "Starting from Magritte's night-time house under a daylight sky, Mai Ta moves through surrealism, Sartre and Camus, disappointment and redemption, and arrives at dreams as a fragile shelter.",
    place: "After René Magritte",
  },
  "dynastie-tran": {
    title: "Dynastie\nTran",
    subtitle: "Cartography of Memory, Queering the Archive",
    summary:
      "War, migration, and silence broke the family record. Kianuë Tran Kiêu restages it with analogue photography and posed group portraits, answering erasure with tenderness and a queer lineage.",
    place: "A family archive",
  },
  "lake-side-hotel": {
    title: "Lake Side\nHotel",
    subtitle: "NPCs",
    summary:
      "Shot from a distance with a telezoom lens, Song Nguyen's photographs watch people who never notice the camera. After Typhoon Yagi tore off a neighbouring roof, the series follows its rebuilding like a play performed together.",
    place: "Hanoi, Vietnam",
  },
  "country-x": {
    title: "Country X",
    subtitle: "Metaphysical Cartography for the Future",
    summary:
      "An imagined nation drawn in digital maps, posters, paintings, and fables. Hà Ninh Pham asks how belonging, identity, and territory are mapped, narrated, and turned into institutions.",
    place: "An imagined country",
  },
  "nha-san-collective": {
    title: "Nhà Sàn\nCollective",
    summary:
      "An artist collective in Hanoi since 2013, rooted in the artist-run Nhà Sàn Studio of 1998. From a migratory garden at documenta fifteen to queer gatherings and exhibitions, a portrait of a community that keeps its doors open.",
    place: "Hanoi / Kassel",
  },
  "whispers-of-mothers-and-absences-of-fathers": {
    title: "Whispers\nof Mothers",
    subtitle: "Absences of Fathers",
    summary:
      "Two novels and two films. Evelyn Pan reads how mothers carry history in food, bodies, and silence, and how absent fathers mark the breaks left by war, exile, and modernisation.",
    place: "Diasporic narratives",
  },
  "ctrl-hanoi": {
    title: "Ctrl +\nHanoi",
    summary:
      "A city where even Google Maps needs a second opinion. Thảo Linh Trần gathers the art spaces, creative hubs, museums, and cafés worth finding, with addresses to walk by.",
    place: "Hanoi, Vietnam",
  },
  "a-wet-wet-market": {
    title: "A Wet\nWet-Market",
    summary:
      "A town, a market, and a field that keeps growing and changing. In Hội An, Ryan Nguyen proposes an architecture that moves with the water, the people, and the everyday life it holds.",
    place: "Hội An, Vietnam",
  },
  "art-is-to-live-and-explore": {
    title: "Art is to Live\nand Explore",
    subtitle: "In conversation with KV Duong",
    summary:
      "Born in Vietnam, raised in Canada, and now based in the UK, KV Duong returns to Hanoi. A conversation about migration, queer identity, and finding a language through painting, performance, and the body.",
    place: "Hanoi, Vietnam",
  },
  "is-it-her-or-is-it-me": {
    title: "Is it her,\nor is it me?",
    summary:
      "Between languages, generations, and places, Yasmine Anlan Huang traces the intimate work of translation. A story of mothers and daughters, inherited memories, and the selves we recognise in one another.",
    place: "A family across borders",
  },
  "rehoming-dundun": {
    title: "Rehoming\nDundun",
    subtitle: "From Dameng to New York",
    summary:
      "Stump, pier, mound, pedestal. Following the many lives of the dūn, Siyang Dai and Zijun Zhao explore how an everyday object carries its meanings from one place into another.",
    place: "Dameng / New York",
  },
  "in-silence-things-speak": {
    title: "In Silence,\nThings Speak",
    subtitle: "Truong Minh Quy, from Saigon to New York",
    summary:
      "An index of films, places, and unexpected encounters. Nguyen Dinh Ton Nu follows the work of Truong Minh Quy across Vietnam and the United States, tracing the conversations that happen around a screen.",
    place: "Saigon / New York",
  },
};
