export type Person = { id: string; x: number; facing: boolean; confidence: number };
export type Visitor = Person & {
  slot: number;
  shownX: number;
  shownY: number;
  anchor: number;
  since: number;
  seen: number;
  dwell: number;
  fired: number | null;
};

export const HOLD = 3;
export const FLIGHT = 1.35;
export const SIGNAL_TTL = 0.5;
const EXIT_GRACE = 0.8;
const STILL_RADIUS = 0.008;
export const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, n));

// Reject malformed whole frames, including duplicate IDs; never merge different people.
export function parsePeople(value: unknown): Person[] | null {
  if (!Array.isArray(value) || value.length > 8) return null;
  const ids = new Set<string>();
  const result: Person[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const { id, x, facing, confidence = 1 } = entry;
    if (
      typeof id !== "string" ||
      !id ||
      id.length > 64 ||
      ids.has(id) ||
      typeof x !== "number" ||
      !Number.isFinite(x) ||
      x < 0 ||
      x > 1 ||
      typeof facing !== "boolean" ||
      typeof confidence !== "number" ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1
    )
      return null;
    ids.add(id);
    result.push({ id, x, facing, confidence });
  }
  return result;
}

export function updateVisitors(
  visitors: Map<string, Visitor>,
  people: Person[],
  now: number,
  dt: number,
) {
  const present = new Set<string>();
  for (const person of people) {
    if (person.confidence < 0.65) continue;
    present.add(person.id);
    let visitor = visitors.get(person.id);
    if (!visitor) {
      const slots = new Set([...visitors.values()].map((v) => v.slot));
      let slot = 0;
      while (slots.has(slot)) slot++;
      visitor = {
        ...person,
        slot,
        shownX: person.x,
        shownY: 0.5,
        anchor: person.x,
        since: now,
        seen: now,
        dwell: 0,
        fired: null,
      };
      visitors.set(person.id, visitor);
    }
    if (
      !person.facing ||
      now - visitor.seen > SIGNAL_TTL ||
      Math.abs(person.x - visitor.anchor) > STILL_RADIUS
    ) {
      visitor.anchor = person.x;
      visitor.since = now;
      visitor.dwell = 0;
    }
    Object.assign(visitor, person, { seen: now });
    if (visitor.fired === null) {
      visitor.shownX += (person.x - visitor.shownX) * (1 - Math.exp(-dt * 9));
      visitor.dwell = person.facing ? clamp((now - visitor.since) / HOLD) : 0;
      if (visitor.dwell >= 1) visitor.fired = now;
    }
  }
  for (const [id, visitor] of visitors) {
    if (!present.has(id)) {
      visitor.since = now;
      visitor.dwell = 0;
      if (now - visitor.seen > EXIT_GRACE) {
        visitors.delete(id);
        continue;
      }
    }
    // Nearby covers occupy different heights; identities and countdowns stay independent.
    const near = [...visitors.values()].filter((v) => Math.abs(v.shownX - visitor.shownX) < 0.055);
    near.sort((a, b) => a.slot - b.slot);
    const lane = near.findIndex((v) => v.id === id);
    const y = near.length > 1 ? 0.25 + (lane % 3) * 0.25 : 0.5;
    if (visitor.fired === null) visitor.shownY += (y - visitor.shownY) * (1 - Math.exp(-dt * 5));
  }
  return present.size;
}

export function demoPeople(time: number): Person[] {
  const t = time % 15;
  if (t >= 11) return [];
  return [
    { id: "demo-1", x: t < 4 ? 0.08 + t * 0.08 : 0.4, facing: t >= 4, confidence: 1 },
    { id: "demo-2", x: t < 5 ? 0.92 - t * 0.035 : 0.745, facing: t >= 5, confidence: 1 },
  ];
}
