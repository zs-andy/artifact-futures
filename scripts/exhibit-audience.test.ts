import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parsePeople,
  updateVisitors,
  type Person,
  type Visitor,
} from "../app/[locale]/exhibit/audience";

const person = (id = "a", x = 0.2, facing = true): Person => ({ id, x, facing, confidence: 1 });
function run(visitors: Map<string, Visitor>, people: Person[], from: number, to: number) {
  for (let t = from; t <= to + 0.00001; t += 0.05)
    updateVisitors(visitors, people, Number(t.toFixed(3)), 0.05);
}

describe("exhibition audience intent", () => {
  it("requires three continuous seconds, then fires only once per stay", () => {
    const visitors = new Map<string, Visitor>();
    run(visitors, [person()], 0, 2.95);
    assert.equal(visitors.get("a")!.fired, null);
    run(visitors, [person()], 3, 8);
    assert.equal(visitors.get("a")!.fired, 3);
    run(visitors, [person("a", 0.8, false)], 8.05, 9);
    run(visitors, [person()], 9.05, 13);
    assert.equal(visitors.get("a")!.fired, 3);
  });

  it("turning away or walking resets the dwell, but not another person's timer", () => {
    const visitors = new Map<string, Visitor>();
    run(visitors, [person(), person("b", 0.8)], 0, 2);
    run(visitors, [person("a", 0.21, false), person("b", 0.8)], 2.05, 3.1);
    assert.equal(visitors.get("a")!.fired, null);
    assert.equal(visitors.get("b")!.fired, 3);
    run(visitors, [person("a", 0.21)], 3.15, 5.95);
    assert.equal(visitors.get("a")!.fired, null);
    run(visitors, [person("a", 0.21)], 6, 6.2);
    assert.ok(visitors.get("a")!.fired !== null);
  });

  it("slow cumulative movement does not count as stationary", () => {
    const visitors = new Map<string, Visitor>();
    for (let i = 0; i <= 100; i++)
      updateVisitors(visitors, [person("a", 0.2 + i * 0.001)], i * 0.05, 0.05);
    assert.equal(visitors.get("a")!.fired, null);
  });

  it("crossing the screen seams does not swap IDs or restart another person's state", () => {
    const visitors = new Map<string, Visitor>();
    run(visitors, [person("a", 0.32, false), person("b", 0.68)], 0, 1);
    const slots = [visitors.get("a")!.slot, visitors.get("b")!.slot];
    run(visitors, [person("b", 0.68), person("a", 0.7, false)], 1.05, 3.1);
    assert.deepEqual([visitors.get("a")!.slot, visitors.get("b")!.slot], slots);
    assert.equal(visitors.get("b")!.fired, 3);
    assert.equal(visitors.get("a")!.fired, null);
  });

  it("missing or low-confidence signals cannot finish a countdown", () => {
    const visitors = new Map<string, Visitor>();
    run(visitors, [person()], 0, 2.9);
    run(visitors, [{ ...person(), confidence: 0.2 }], 2.95, 3.2);
    assert.equal(visitors.get("a")!.fired, null);
    run(visitors, [person()], 3.25, 5);
    assert.equal(visitors.get("a")!.fired, null);
  });

  it("re-arms after departure, and clears all prior state on replay", () => {
    const visitors = new Map<string, Visitor>();
    run(visitors, [person()], 0, 4);
    run(visitors, [], 4.05, 5);
    assert.equal(visitors.size, 0);
    run(visitors, [person()], 5.05, 8.1);
    assert.ok(visitors.get("a")!.fired! >= 8);
    visitors.clear();
    run(visitors, [person()], 0, 1);
    assert.equal(visitors.get("a")!.fired, null);
  });

  it("does not add a stale gap to stationary time", () => {
    const visitors = new Map<string, Visitor>();
    run(visitors, [person()], 0, 2);
    updateVisitors(visitors, [person()], 6, 0.05);
    assert.equal(visitors.get("a")!.dwell, 0);
  });
});

describe("audience input", () => {
  it("rejects invalid positions, IDs, duplicates, and excessive participants", () => {
    assert.equal(parsePeople([person("a", NaN)]), null);
    assert.equal(parsePeople([person("a", 1.1)]), null);
    assert.equal(parsePeople([person(), person()]), null);
    assert.equal(parsePeople(Array.from({ length: 9 }, (_, i) => person(String(i)))), null);
    assert.deepEqual(parsePeople([]), []);
  });
});
