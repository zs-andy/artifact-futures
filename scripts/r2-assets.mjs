import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = join(ROOT, "resource/publish/r2");
const MANIFEST = join(SOURCE, "manifest.json");
const RECORD = join(SOURCE, "uploaded.json");
const DEFAULT_BUCKET = "artifact-futures-assets";
const CONCURRENCY = 4;
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const TYPES = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".avif": "image/avif" };
const USAGE = `Usage: bun scripts/r2-assets.mjs <upload|verify> [options]

  upload [bucket]      Upload resource/publish/r2/ to R2 (default bucket: ${DEFAULT_BUCKET}); safe to rerun.
  verify <origin>      Check every object is served at <origin>, e.g. https://assets.example.com

Upload needs \`bunx wrangler login\` first.`;

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw error;
  }
};

const run = (args) =>
  new Promise((done, fail) => {
    const child = spawn("bunx", ["wrangler", ...args], { cwd: ROOT, stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    child.stderr.on("data", (chunk) => (error += chunk));
    child.on("close", (code) => (code === 0 ? done() : fail(new Error(error.trim().split("\n").pop()))));
  });

async function pool(items, task) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) await task(queue.shift());
    }),
  );
}

async function upload(bucket) {
  const items = await readJson(MANIFEST);
  const record = await readJson(RECORD, { bucket, objects: {} });
  if (record.bucket !== bucket) throw new Error(`Upload record belongs to bucket ${record.bucket}.`);
  const pending = items.filter((item) => record.objects[item.pathname] !== item.size);
  let count = items.length - pending.length;
  const failed = [];
  await pool(pending, async (item) => {
    const type = TYPES[extname(item.pathname).toLowerCase()] ?? "application/octet-stream";
    try {
      await run([
        "r2", "object", "put", `${bucket}/${item.pathname}`,
        "--file", join(SOURCE, item.pathname),
        "--content-type", type,
        "--cache-control", CACHE_CONTROL,
        "--remote",
      ]);
      record.objects[item.pathname] = item.size;
      count += 1;
      await writeFile(RECORD, `${JSON.stringify(record, null, 1)}\n`);
      console.log(`[${count}/${items.length}] ${item.pathname}`);
    } catch (error) {
      failed.push(`${item.pathname}: ${error.message}`);
    }
  });
  if (failed.length) {
    failed.forEach((line) => console.error(line));
    throw new Error(`${failed.length} uploads failed; rerun to retry.`);
  }
  console.log(`All ${items.length} objects are in ${bucket}. Next: bun scripts/r2-assets.mjs verify <origin>`);
}

async function verify(origin) {
  const base = new URL(origin);
  if (base.href !== `${base.origin}/`) throw new Error("Origin must not include a path.");
  const items = await readJson(MANIFEST);
  const failed = [];
  let count = 0;
  await pool(items, async (item) => {
    const response = await fetch(new URL(item.pathname, base), { method: "HEAD", signal: AbortSignal.timeout(30000) }).catch(
      (error) => ({ ok: false, status: error.message }),
    );
    const size = Number(response.headers?.get("content-length"));
    if (!response.ok || size !== item.size) failed.push(`${item.pathname}: ${response.status} ${size || ""}`);
    count += 1;
    if (count % 100 === 0) console.log(`checked ${count}/${items.length}`);
  });
  if (failed.length) {
    failed.slice(0, 20).forEach((line) => console.error(line));
    throw new Error(`${failed.length} of ${items.length} objects missing or different.`);
  }
  console.log(`All ${items.length} objects verified at ${base.origin}. Set ASSET_ORIGIN in lib/assets.ts to it.`);
}

const [command, value] = process.argv.slice(2);
const job =
  command === "upload" ? upload(value ?? DEFAULT_BUCKET) : command === "verify" && value ? verify(value) : null;
if (!job) console.log(USAGE);
else
  job.catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
