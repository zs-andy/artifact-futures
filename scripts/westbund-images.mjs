import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const OUTPUT = join(ROOT, "resource/publish");
const DATA = join(ROOT, "app/[locale]/journal/_lib");
const URL_MAP = join(DATA, "reader-image-urls.json");
const USAGE = `Usage: bun scripts/westbund-images.mjs <prepare|upload|apply> [issue]

  prepare  Validate and copy reader images into resource/publish/Westbund/.
  upload   Upload prepared images, recording each success; safe to rerun.
  apply    Verify every remote image, then switch the reader's URL map.

Issue defaults to issue-02. Upload requires BLOB_READ_WRITE_TOKEN, or
BLOB_STORE_ID plus VERCEL_OIDC_TOKEN. No token is needed for prepare/apply.
For manual uploads: apply issue-02 --base-url https://<store>.public.blob.vercel-storage.com
No command uploads unless you explicitly choose upload.`;

export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, file);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw error;
  }
}

export async function manifestFor(issue, publicDir = PUBLIC) {
  const entries = new Map();
  for (const article of [issue.editorial, ...issue.articles]) {
    for (const image of article.images) {
      const prefix = `/journal/issues/${issue.slug}/`;
      if (!image.src.startsWith(prefix) || !/^[a-z0-9/-]+\.webp$/.test(image.src)) {
        throw new Error(`Unexpected local reader image: ${image.src}`);
      }
      const bytes = await readFile(join(publicDir, image.src.slice(1)));
      const metadata = await sharp(bytes).metadata();
      if (
        metadata.format !== "webp" ||
        metadata.width !== image.width ||
        metadata.height !== image.height
      ) {
        throw new Error(`Image dimensions/format differ from reader data: ${image.src}`);
      }
      await sharp(bytes).stats(); // Decode the full image, not just its header.
      const sha256 = digest(bytes);
      const relative = image.src.slice("/journal/issues/".length);
      entries.set(image.src, {
        src: image.src,
        pathname: `Westbund/${relative.replace(/\.webp$/, `-${sha256.slice(0, 12)}.webp`)}`,
        width: image.width,
        height: image.height,
        bytes: bytes.length,
        sha256,
      });
    }
  }
  if (!entries.size) throw new Error(`No reader images found for ${issue.slug}`);
  return { version: 1, issue: issue.slug, images: [...entries.values()] };
}

export function checkedBlobUrl(value, pathname) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".public.blob.vercel-storage.com") ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    url.pathname !== `/${pathname}`
  )
    throw new Error(`Unexpected Blob URL for ${pathname}`);
  return url.href;
}

export async function verifyBlob(entry, value, request = fetch) {
  const url = checkedBlobUrl(value, entry.pathname);
  const response = await request(url, {
    signal: AbortSignal.timeout(30000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${entry.pathname}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== entry.bytes || digest(bytes) !== entry.sha256) {
    throw new Error(`Remote contents do not match: ${entry.pathname}`);
  }
  return url;
}

async function remoteHead(pathname, options) {
  try {
    return await head(pathname, options);
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

export async function prepare(manifest, publicDir = PUBLIC, outputDir = OUTPUT) {
  const file = join(outputDir, `${manifest.issue}.manifest.json`);
  const previous = await readJson(file, { images: [] });
  const currentPaths = new Set(manifest.images.map((entry) => entry.pathname));
  const obsolete = [];
  for (const entry of previous.images) {
    if (currentPaths.has(entry.pathname)) continue;
    if (
      !entry.pathname.startsWith(`Westbund/${manifest.issue}/`) ||
      !/^Westbund\/[a-z0-9/-]+-[a-f0-9]{12}\.webp$/.test(entry.pathname)
    )
      throw new Error("Unexpected path in the previous preparation manifest.");
    const target = join(outputDir, entry.pathname);
    try {
      const bytes = await readFile(target);
      if (digest(bytes) !== entry.sha256) throw new Error(`Prepared file was modified: ${target}`);
      obsolete.push(target);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  for (const entry of manifest.images) {
    const target = join(outputDir, entry.pathname);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(publicDir, entry.src.slice(1)), target);
  }
  // Remove only unchanged generated copies from our previous manifest, never originals or remote blobs.
  for (const target of obsolete) await unlink(target);
  await writeJson(file, manifest);
  const bytes = manifest.images.reduce((sum, entry) => sum + entry.bytes, 0);
  console.log(`Prepared ${manifest.images.length} images (${(bytes / 1048576).toFixed(1)} MB).`);
  console.log(`Folder: ${join(outputDir, "Westbund", manifest.issue)}`);
  console.log(`Manifest: ${file}`);
  console.log("Nothing uploaded; reader URLs unchanged.");
}

async function checkPrepared(manifest) {
  const saved = await readJson(join(OUTPUT, `${manifest.issue}.manifest.json`));
  if (JSON.stringify(saved) !== JSON.stringify(manifest)) {
    throw new Error("Reader images changed since preparation. Run prepare again.");
  }
  for (const entry of manifest.images) {
    const bytes = await readFile(join(OUTPUT, entry.pathname));
    if (digest(bytes) !== entry.sha256) throw new Error(`Prepared file changed: ${entry.pathname}`);
  }
}

async function upload(manifest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token && !(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)) {
    throw new Error("Set BLOB_READ_WRITE_TOKEN in your local environment before uploading.");
  }
  const options = token ? { token } : {};
  const recordFile = join(OUTPUT, `${manifest.issue}.uploaded.json`);
  const record = await readJson(recordFile, { issue: manifest.issue, images: {} });
  if (record.issue !== manifest.issue)
    throw new Error("Upload record belongs to a different issue.");

  // Serial writes keep the checkpoint durable after every successful image.
  for (const [index, entry] of manifest.images.entries()) {
    let blob = await remoteHead(entry.pathname, options);
    const existed = Boolean(blob);
    if (blob) {
      await verifyBlob(entry, blob.url);
    } else {
      try {
        blob = await put(entry.pathname, await readFile(join(OUTPUT, entry.pathname)), {
          ...options,
          access: "public",
          addRandomSuffix: false,
          allowOverwrite: false,
          contentType: "image/webp",
          cacheControlMaxAge: 31536000,
        });
      } catch (error) {
        // A timed-out request may already have succeeded at the server.
        blob = await remoteHead(entry.pathname, options);
        if (!blob) throw error;
        await verifyBlob(entry, blob.url);
      }
    }
    record.images[entry.src] = {
      pathname: entry.pathname,
      url: checkedBlobUrl(blob.url, entry.pathname),
      sha256: entry.sha256,
    };
    await writeJson(recordFile, record);
    console.log(
      `[${index + 1}/${manifest.images.length}] ${existed ? "verified" : "uploaded"} ${entry.pathname}`,
    );
  }
  console.log(
    `Upload complete. Reader URLs unchanged. Next: bun run westbund:apply ${manifest.issue}`,
  );
}

export async function verifiedMapping(manifest, records, request = fetch) {
  const mapping = {};
  // Resolve all required entries before making requests; a partial upload cannot be applied.
  const urls = manifest.images.map((entry) => {
    const record = records[entry.src];
    if (!record || record.sha256 !== entry.sha256 || record.pathname !== entry.pathname) {
      throw new Error(`Missing or stale upload record: ${entry.src}`);
    }
    return checkedBlobUrl(record.url, entry.pathname);
  });
  for (const [index, entry] of manifest.images.entries()) {
    mapping[entry.src] = await verifyBlob(entry, urls[index], request);
  }
  return mapping;
}

async function apply(manifest, baseUrl) {
  let records;
  if (baseUrl) {
    const base = new URL(baseUrl);
    if (base.href !== `${base.origin}/`)
      throw new Error("--base-url must be the Blob origin, without a folder.");
    records = Object.fromEntries(
      manifest.images.map((entry) => [
        entry.src,
        {
          ...entry,
          url: new URL(entry.pathname, base).href,
        },
      ]),
    );
  } else {
    records = (await readJson(join(OUTPUT, `${manifest.issue}.uploaded.json`))).images;
  }
  const mapping = await verifiedMapping(manifest, records);
  const existing = await readJson(URL_MAP, {});
  const otherIssues = Object.fromEntries(
    Object.entries(existing).filter(
      ([src]) => !src.startsWith(`/journal/issues/${manifest.issue}/`),
    ),
  );
  await writeJson(URL_MAP, { ...otherIssues, ...mapping });
  console.log(`Verified and applied all ${manifest.images.length} Blob URLs: ${URL_MAP}`);
  console.log("Include this URL map in your next deployment. Local originals have been retained.");
}

async function main(argv) {
  if (!argv.length || argv.includes("--help")) return console.log(USAGE);
  const [command, ...rest] = argv;
  if (!["prepare", "upload", "apply"].includes(command)) throw new Error(USAGE);
  const slug = rest[0] && !rest[0].startsWith("--") ? rest.shift() : "issue-02";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid issue slug.");
  let baseUrl;
  if (rest.length) {
    if (command !== "apply" || rest.length !== 2 || rest[0] !== "--base-url")
      throw new Error(USAGE);
    baseUrl = rest[1];
  }
  const issueModule = await import(pathToFileURL(join(DATA, "issues", `${slug}.ts`)).href);
  const issue = Object.values(issueModule).find((value) => value?.slug === slug);
  if (!issue) throw new Error(`Issue data not found: ${slug}`);
  const manifest = await manifestFor(issue);
  if (command === "prepare") return prepare(manifest);
  await checkPrepared(manifest);
  if (command === "upload") return upload(manifest);
  return apply(manifest, baseUrl);
}

if (import.meta.main) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
