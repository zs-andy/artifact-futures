import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, it } from "node:test";
import sharp from "sharp";
import { resolveIssueAssets } from "../app/[locale]/journal/_lib/issue-assets";
import type { IssueImage, IssueText } from "../app/[locale]/journal/_lib/issue-text";
import { checkedBlobUrl, digest, manifestFor, prepare, verifiedMapping } from "./westbund-images.mjs";

const ORIGIN = "https://offline-test.public.blob.vercel-storage.com";
const folders: string[] = [];

type Entry = {
  src: string;
  pathname: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
};

function issueWith(images: IssueImage[]): IssueText {
  return {
    slug: "test-issue",
    number: 2,
    editorial: { slug: "editorial", order: 0, section: "Editorial", page: null, title: "Editorial", author: "", images: [], blocks: [] },
    articles: [{ slug: "project", order: 1, section: "Projects", page: 1, title: "Project", author: "", images, blocks: [] }],
  };
}

async function webp(background = "#123456") {
  return sharp({ create: { width: 3, height: 2, channels: 3, background } }).webp({ lossless: true }).toBuffer();
}

async function fixture(count = 1) {
  const publicDir = await mkdtemp(join(tmpdir(), "westbund-images-test-"));
  folders.push(publicDir);
  const body = await webp();
  const images = Array.from({ length: count }, (_, index) => ({
    src: `/journal/issues/test-issue/project/${String(index + 1).padStart(2, "0")}.webp`,
    width: 3,
    height: 2,
  }));
  for (const image of images) {
    const file = join(publicDir, image.src.slice(1));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
  }
  return { publicDir, body, issue: issueWith(images) };
}

function recordsFor(images: Entry[]) {
  return Object.fromEntries(images.map((entry) => [entry.src, {
    pathname: entry.pathname,
    sha256: entry.sha256,
    url: `${ORIGIN}/${entry.pathname}`,
  }]));
}

afterEach(async () => {
  await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })));
});

describe("manifestFor", () => {
  it("decodes local WebP files, includes editorial images, and deduplicates references", async () => {
    const { issue, publicDir, body } = await fixture(2);
    issue.editorial.images = [issue.articles[0].images[0]];
    const manifest = await manifestFor(issue, publicDir);
    assert.equal(manifest.issue, issue.slug);
    assert.equal(manifest.images.length, 2);
    assert.deepEqual(manifest.images[0], {
      src: issue.editorial.images[0].src,
      pathname: `Westbund/test-issue/project/01-${digest(body).slice(0, 12)}.webp`,
      width: 3,
      height: 2,
      bytes: body.length,
      sha256: digest(body),
    });
  });

  it("rejects a missing source file", async () => {
    const { issue, publicDir } = await fixture();
    await rm(join(publicDir, issue.articles[0].images[0].src.slice(1)));
    await assert.rejects(manifestFor(issue, publicDir), /ENOENT/);
  });

  it("rejects dimensions that differ from the decoded image", async () => {
    const { issue, publicDir } = await fixture();
    issue.articles[0].images[0].width = 4;
    await assert.rejects(manifestFor(issue, publicDir), /dimensions\/format differ/);
  });

  it("rejects PNG bytes disguised with a WebP extension", async () => {
    const { issue, publicDir, body } = await fixture();
    await writeFile(join(publicDir, issue.articles[0].images[0].src.slice(1)), await sharp(body).png().toBuffer());
    await assert.rejects(manifestFor(issue, publicDir), /dimensions\/format differ/);
  });

  it("rejects corrupt image bytes", async () => {
    const { issue, publicDir } = await fixture();
    await writeFile(join(publicDir, issue.articles[0].images[0].src.slice(1)), "not an image");
    await assert.rejects(manifestFor(issue, publicDir));
  });

  it("changes the Blob pathname when bytes change at the same local path", async () => {
    const { issue, publicDir } = await fixture();
    const before = await manifestFor(issue, publicDir);
    const replacement = await webp("#fedcba");
    await writeFile(join(publicDir, issue.articles[0].images[0].src.slice(1)), replacement);
    const after = await manifestFor(issue, publicDir);
    assert.equal(before.images[0].src, after.images[0].src);
    assert.notEqual(before.images[0].pathname, after.images[0].pathname);
    assert.equal(after.images[0].pathname, `Westbund/test-issue/project/01-${digest(replacement).slice(0, 12)}.webp`);
  });

  for (const src of ["https://example.com/01.webp", "/journal/issues/other/project/01.webp", "/journal/issues/test-issue/../01.webp"]) {
    it(`rejects a source outside this issue: ${src}`, async () => {
      const { issue, publicDir } = await fixture();
      issue.articles[0].images[0].src = src;
      await assert.rejects(manifestFor(issue, publicDir), /Unexpected local reader image/);
    });
  }
});

describe("checkedBlobUrl", () => {
  const pathname = "Westbund/test-issue/project/01-012345abcdef.webp";

  it("accepts the exact public Blob URL and preserves Westbund casing", () => {
    assert.equal(checkedBlobUrl(`${ORIGIN}/${pathname}`, pathname), `${ORIGIN}/${pathname}`);
  });

  for (const url of [
    `http://offline-test.public.blob.vercel-storage.com/${pathname}`,
    `https://example.com/${pathname}`,
    `https://offline-test.public.blob.vercel-storage.com.evil.test/${pathname}`,
    `https://user:password@offline-test.public.blob.vercel-storage.com/${pathname}`,
    `https://offline-test.public.blob.vercel-storage.com:8443/${pathname}`,
    `${ORIGIN}/${pathname}?download=1`,
    `${ORIGIN}/${pathname}#fragment`,
    `${ORIGIN}/${pathname.replace("Westbund", "westbund")}`,
    `${ORIGIN}/${pathname.replace(".webp", "-random.webp")}`,
    "not-a-url",
  ]) {
    it(`rejects an unexpected URL: ${url}`, () => {
      assert.throws(() => checkedBlobUrl(url, pathname));
    });
  }
});

describe("verifiedMapping", () => {
  it("rejects a partial upload record before making any requests", async () => {
    const { issue, publicDir } = await fixture(2);
    const manifest = await manifestFor(issue, publicDir);
    const records = recordsFor(manifest.images.slice(0, 1));
    let requests = 0;
    await assert.rejects(verifiedMapping(manifest, records, async () => {
      requests++;
      throw new Error("A partial record must not make requests");
    }), /Missing or stale upload record/);
    assert.equal(requests, 0);
  });

  it("rejects a stale content hash before making any requests", async () => {
    const { issue, publicDir } = await fixture();
    const manifest = await manifestFor(issue, publicDir);
    const records = recordsFor(manifest.images);
    records[manifest.images[0].src].sha256 = "0".repeat(64);
    await assert.rejects(verifiedMapping(manifest, records, async () => {
      assert.fail("A stale record must not make requests");
    }), /Missing or stale upload record/);
  });

  it("returns no mapping when a later remote image has different bytes of the same length", async () => {
    const { issue, publicDir, body } = await fixture(2);
    const manifest = await manifestFor(issue, publicDir);
    const records = recordsFor(manifest.images);
    const changed = Buffer.from(body);
    changed[changed.length - 1] ^= 1;
    let requests = 0;
    let mapping: unknown;
    await assert.rejects(async () => {
      mapping = await verifiedMapping(manifest, records, async () => {
        const bytes = requests++ === 0 ? body : changed;
        return new Response(new Uint8Array(bytes));
      });
    }, /Remote contents do not match/);
    assert.equal(requests, 2);
    assert.equal(mapping, undefined);
  });

  it("rejects a truncated remote response", async () => {
    const { issue, publicDir, body } = await fixture();
    const manifest = await manifestFor(issue, publicDir);
    await assert.rejects(verifiedMapping(manifest, recordsFor(manifest.images), async () => {
      return new Response(new Uint8Array(body.subarray(0, body.length - 1)));
    }), /Remote contents do not match/);
  });

  it("rejects remote HTTP failures", async () => {
    const { issue, publicDir } = await fixture();
    const manifest = await manifestFor(issue, publicDir);
    await assert.rejects(verifiedMapping(manifest, recordsFor(manifest.images), async () => {
      return new Response("Not found", { status: 404 });
    }), /HTTP 404/);
  });

  it("returns every verified URL using only injected offline requests", async () => {
    const { issue, publicDir, body } = await fixture(2);
    const manifest = await manifestFor(issue, publicDir);
    const records = recordsFor(manifest.images);
    const requested: string[] = [];
    const mapping = await verifiedMapping(manifest, records, async (input: RequestInfo | URL, init?: RequestInit) => {
      requested.push(String(input));
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      assert.ok(init?.signal instanceof AbortSignal);
      return new Response(new Uint8Array(body), { headers: { "content-type": "image/webp" } });
    });
    assert.deepEqual(mapping, Object.fromEntries(Object.entries(records).map(([src, record]) => [src, record.url])));
    assert.deepEqual(requested, Object.values(records).map((record) => record.url));
    assert.deepEqual(await readFile(join(publicDir, issue.articles[0].images[0].src.slice(1))), body);
  });
});

it("keeps the reader on local images while the published mapping is empty", () => {
  const issue = issueWith([{ src: "/journal/issues/test-issue/project/01.webp", width: 3, height: 2 }]);
  const before = structuredClone(issue);
  const resolved = resolveIssueAssets(issue);
  assert.deepEqual(resolved, before);
  assert.deepEqual(issue, before);
  assert.notEqual(resolved.articles[0].images, issue.articles[0].images);
});

describe("prepare reruns", () => {
  it("replaces an obsolete generated copy after source bytes change, preserving the source", async () => {
    const { issue, publicDir, body } = await fixture();
    const outputDir = join(publicDir, "prepared");
    const before = await manifestFor(issue, publicDir);
    await prepare(before, publicDir, outputDir);
    const oldCopy = join(outputDir, before.images[0].pathname);
    assert.deepEqual(await readFile(oldCopy), body);

    const source = join(publicDir, issue.articles[0].images[0].src.slice(1));
    const replacement = await webp("#fedcba");
    await writeFile(source, replacement);
    const after = await manifestFor(issue, publicDir);
    await prepare(after, publicDir, outputDir);

    await assert.rejects(readFile(oldCopy), /ENOENT/);
    assert.deepEqual(await readFile(join(outputDir, after.images[0].pathname)), replacement);
    assert.deepEqual(await readFile(source), replacement);
    assert.deepEqual(JSON.parse(await readFile(join(outputDir, `${issue.slug}.manifest.json`), "utf8")), after);
  });

  it("refuses a manually changed obsolete copy before deleting or replacing any generated files", async () => {
    const { issue, publicDir, body } = await fixture(2);
    const outputDir = join(publicDir, "prepared");
    const before = await manifestFor(issue, publicDir);
    await prepare(before, publicDir, outputDir);
    const untouchedCopy = join(outputDir, before.images[0].pathname);
    const editedCopy = join(outputDir, before.images[1].pathname);
    const manualBytes = Buffer.from("Keep this manual edit");
    await writeFile(editedCopy, manualBytes);

    const replacement = await webp("#fedcba");
    for (const image of issue.articles[0].images) {
      await writeFile(join(publicDir, image.src.slice(1)), replacement);
    }
    const after = await manifestFor(issue, publicDir);
    await assert.rejects(prepare(after, publicDir, outputDir), /Prepared file was modified/);

    assert.deepEqual(await readFile(untouchedCopy), body);
    assert.deepEqual(await readFile(editedCopy), manualBytes);
    await assert.rejects(readFile(join(outputDir, after.images[0].pathname)), /ENOENT/);
    assert.deepEqual(JSON.parse(await readFile(join(outputDir, `${issue.slug}.manifest.json`), "utf8")), before);
    for (const image of issue.articles[0].images) {
      assert.deepEqual(await readFile(join(publicDir, image.src.slice(1))), replacement);
    }
  });

  it("preserves unrelated manual files even when their names look generated", async () => {
    const { issue, publicDir, body } = await fixture();
    const outputDir = join(publicDir, "prepared");
    const before = await manifestFor(issue, publicDir);
    await prepare(before, publicDir, outputDir);
    const projectDir = dirname(join(outputDir, before.images[0].pathname));
    const manualImage = join(projectDir, "manual-aaaaaaaaaaaa.webp");
    const manualNote = join(projectDir, "notes.txt");
    await writeFile(manualImage, body);
    await writeFile(manualNote, "Keep this note");

    await writeFile(join(publicDir, issue.articles[0].images[0].src.slice(1)), await webp("#fedcba"));
    const after = await manifestFor(issue, publicDir);
    await prepare(after, publicDir, outputDir);

    assert.deepEqual(await readFile(manualImage), body);
    assert.equal(await readFile(manualNote, "utf8"), "Keep this note");
    await assert.rejects(readFile(join(outputDir, before.images[0].pathname)), /ENOENT/);
  });
});
