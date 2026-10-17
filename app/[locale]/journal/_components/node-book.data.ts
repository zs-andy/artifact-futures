type Run = { text: string; italic?: boolean; lang?: string };

type CoverLine = { y: number; x?: number; runs: Run[] };

export type CoverBlock = { x: number; size: number; weight: number; lines: CoverLine[] };

export type Barcode = { x: number; y: number; height: number; bars: [number, number][] };

export type BookCover = {
  spine: string[];
  board: string;
  ink: string;
  blocks: CoverBlock[];
  barcode: Barcode;
  read: string;
};

export const BOOK_COVERS: Record<string, BookCover> = {
  "issue-01-flood": {
    read: "/journal/issues/issue-01",
    spine: ["Artifact — Journal", "01"],
    board: "#1546B0",
    ink: "#FFFFFF",
    blocks: [
      {
        x: 497,
        size: 27,
        weight: 700,
        lines: [{ y: 305.5, runs: [{ text: "ISSUE" }, { text: " No. 1", italic: true }] }],
      },
      {
        x: 500,
        size: 25.3,
        weight: 700,
        lines: [
          { y: 1241.7, runs: [{ text: "COLLECTIVITY" }, { text: " and", italic: true }] },
          {
            y: 1270.6,
            runs: [
              { text: "ALTERNATIVE FORMS" },
              { text: " of ", italic: true },
              { text: "KNOWLEDGE" },
            ],
          },
        ],
      },
    ],
    barcode: {
      x: 915,
      y: 1198.6,
      height: 159,
      bars: [
        [1198.6, 3],
        [1202.6, 1.5],
        [1206.6, 1.5],
        [1213.1, 1.5],
        [1217.1, 3.5],
        [1223.6, 2.5],
        [1227.6, 2],
        [1232.1, 4],
        [1238.6, 1.5],
        [1241.6, 2],
        [1246.6, 1],
        [1249.1, 3.5],
        [1255.6, 2.5],
        [1260.1, 1.5],
        [1264.1, 4],
        [1269.6, 2.5],
        [1273.6, 3.5],
        [1279.6, 1],
        [1283.6, 2.5],
        [1288.6, 4],
        [1293.6, 1],
        [1297.6, 4],
        [1303.1, 2.5],
        [1306.6, 4],
        [1311.6, 2.5],
        [1316.6, 3],
        [1321.1, 2.5],
        [1326.1, 1],
        [1329.6, 1],
        [1333.6, 5],
        [1340.1, 2.5],
        [1346.1, 4],
        [1351.6, 1],
        [1354.1, 3.5],
      ],
    },
  },
  "issue-02-barcode": {
    read: "/journal/issues/issue-02",
    spine: ["Artifact — Journal", "02"],
    board: "#727343",
    ink: "#000000",
    blocks: [
      {
        x: 494,
        size: 28.2,
        weight: 400,
        lines: [
          { y: 266.2, runs: [{ text: "第二期", lang: "zh-Hans" }] },
          { y: 305.7, runs: [{ text: "ISSUE No. 2" }] },
          { y: 344, runs: [{ text: "Số 2", lang: "vi" }] },
        ],
      },
      {
        x: 500,
        size: 28.2,
        weight: 400,
        lines: [
          { y: 1226.3, x: 499, runs: [{ text: "迁徙 流动 韧性", lang: "zh-Hans" }] },
          { y: 1267.3, x: 500.6, runs: [{ text: "MIGRATION, FLUIDITY, RESILIENCE" }] },
          { y: 1304.1, x: 511.4, runs: [{ text: "Di Cư, Uyển Chuyển, Vững Bền", lang: "vi" }] },
        ],
      },
    ],
    barcode: {
      x: 917.6,
      y: 1198.4,
      height: 152.1,
      bars: [
        [1198.9, 0.5],
        [1202.5, 1.5],
        [1206.6, 1],
        [1210.2, 1.5],
        [1213.7, 4.6],
        [1221.4, 1.5],
        [1225, 1.5],
        [1228.5, 1.5],
        [1233.1, 3.6],
        [1238.2, 1],
        [1241.8, 1.5],
        [1245.9, 4.1],
        [1257.1, 0.5],
        [1260.7, 0.5],
        [1264.8, 0.5],
        [1267.3, 2],
        [1271.4, 5.1],
        [1278.6, 2],
        [1283.2, 1],
        [1286.2, 2.6],
        [1290.8, 1.5],
        [1295.4, 0.5],
        [1296.9, 0.5],
        [1299.5, 3.1],
        [1304.6, 1.5],
        [1310.2, 1],
        [1313.3, 2.6],
        [1317.9, 1],
        [1320.4, 3.6],
        [1325, 1.5],
        [1330.6, 1.5],
        [1334.2, 1.5],
        [1337.3, 3.6],
        [1342.4, 0.5],
        [1344.9, 0.5],
        [1348, 0.5],
      ],
    },
  },
};
