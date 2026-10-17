import { asset } from "@/lib/assets";

const BASE = asset("home/pointer-covers/");

const ENTRIES = [
  { id: "01", width: 453, height: 640 },
  { id: "02", width: 640, height: 426 },
  { id: "03", width: 453, height: 640 },
  { id: "04", width: 418, height: 640 },
  { id: "05", width: 640, height: 426 },
  { id: "06", width: 640, height: 360 },
  { id: "07", width: 427, height: 640 },
  { id: "08", width: 640, height: 480 },
  { id: "09", width: 466, height: 640 },
  { id: "10", width: 424, height: 640 },
  { id: "11", width: 442, height: 640 },
  { id: "12", width: 512, height: 640 },
  { id: "13", width: 640, height: 609 },
  { id: "14", width: 640, height: 426 },
  { id: "15", width: 640, height: 328 },
  { id: "16", width: 640, height: 360 },
  { id: "17", width: 640, height: 360 },
  { id: "18", width: 640, height: 328 },
  { id: "19", width: 640, height: 427 },
  { id: "20", width: 640, height: 344 },
  { id: "21", width: 640, height: 427 },
  { id: "22", width: 427, height: 640 },
  { id: "23", width: 640, height: 427 },
  { id: "24", width: 640, height: 427 },
  { id: "25", width: 640, height: 426 },
  { id: "26", width: 427, height: 640 },
  { id: "27", width: 640, height: 427 },
  { id: "28", width: 427, height: 640 },
  { id: "29", width: 640, height: 422 },
  { id: "30", width: 480, height: 640 },
  { id: "31", width: 422, height: 640 },
  { id: "32", width: 640, height: 427 },
  { id: "33", width: 640, height: 413 },
] as const;

export const COVERS = ENTRIES.map((entry) => ({
  src: `${BASE}${entry.id}.webp`,
  width: entry.width,
  height: entry.height,
}));
