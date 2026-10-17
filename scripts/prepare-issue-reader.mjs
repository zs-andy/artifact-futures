// Adapted from resource/scripts/import-issue-text.mjs for the Issue 02 design preview.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import sharp from "sharp";

const ROOT = join(import.meta.dirname, "..");
const SOURCE = process.env.ISSUE_SOURCE ?? join(ROOT, "resource", "Westbund Edition");
const PUBLIC_DIR = join(ROOT, "public/journal/issues");
const DATA_DIR = join(ROOT, "app/[locale]/journal/_lib/issues");
const JOURNAL_DATA = join(ROOT, "resource/Archive/journal/_lib/journal-data.ts");
const MAX_EDGE = 1600;
const QUALITY = 82;
const CAPTION_LIMIT = 420;
const HEAD_LIMIT = 90;
const SKIP_IMAGES = process.argv.includes("--text-only");

const ISSUES = [
  { folder: "Issue no.1", slug: "issue-01", number: 1, constant: "ISSUE_01", orders: null },
  { folder: "Issue no.2", slug: "issue-02", number: 2, constant: "ISSUE_02", orders: new Set([1, 2, 5, 11, 18, 26, 28]) },
];

const SHARP_EXT = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"]);
const SIPS_EXT = new Set([".heic", ".psd", ".pdf", ".bmp", ".cr2"]);
const ESCAPABLE = /\\([\\`*_{}\[\]()#+\-.!&|<>~"'=:;,?%$@^/])/g;
const PLACEHOLDER_BASE = 0xe000;

const report = [];

function nfc(text) {
  return text.normalize("NFC");
}

function slugify(text) {
  return nfc(text)
    .replace(/\([^)]*\)/g, " ")
    .replace(/[’'"“”]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 7)
    .join("-");
}

function tokens(text) {
  return new Set(
    nfc(text)
      .replace(/đ/gi, "d")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((word) => word.length > 2 && !["the", "and", "with", "about", "from"].includes(word)),
  );
}

function overlap(a, b) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / Math.min(left.size, right.size);
}

function protect(text) {
  const kept = [];
  const body = text.replace(ESCAPABLE, (_, char) => {
    kept.push(char);
    return String.fromCharCode(PLACEHOLDER_BASE + kept.length - 1);
  });
  return { body, kept };
}

function restore(text, kept) {
  return text.replace(/[-]/g, (char) => kept[char.charCodeAt(0) - PLACEHOLDER_BASE] ?? "");
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(raw) {
  const { body, kept } = protect(raw.trim());
  const links = [];
  let text = body.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_, label, url) => {
    links.push({ label, url });
    return `\u0001${links.length - 1}\u0001`;
  });
  text = escapeHtml(text);
  let html = "";
  let bold = false;
  let italic = false;
  let index = 0;
  while (index < text.length) {
    if (text[index] === "*") {
      let run = 0;
      while (text[index + run] === "*") run += 1;
      index += run;
      while (run > 0) {
        if (run >= 3) {
          if (bold && italic) html += "</em></strong>";
          else if (!bold && !italic) html += "<strong><em>";
          else if (bold) html += "<em>";
          else html += "</em><strong>";
          if (bold && italic) {
            bold = false;
            italic = false;
          } else if (!bold && !italic) {
            bold = true;
            italic = true;
          } else if (bold) {
            italic = true;
          } else {
            bold = true;
            italic = false;
          }
          run -= 3;
        } else if (run === 2) {
          if (bold) {
            html += italic ? "</em></strong><em>" : "</strong>";
            bold = false;
          } else {
            html += italic ? "</em><strong><em>" : "<strong>";
            bold = true;
          }
          run -= 2;
        } else {
          html += italic ? "</em>" : "<em>";
          italic = !italic;
          run -= 1;
        }
      }
      continue;
    }
    html += text[index];
    index += 1;
  }
  if (italic) html += "</em>";
  if (bold) html += "</strong>";
  html = html
    .replace(/<em>(\s*)<\/em>/g, "$1")
    .replace(/<strong>(\s*)<\/strong>/g, "$1")
    .replace(/\u0001(\d+)\u0001/g, (_, at) => {
      const { label, url } = links[Number(at)];
      return `<a href="${escapeHtml(restore(url, kept))}" target="_blank" rel="noopener noreferrer">${escapeHtml(restore(label, kept))}</a>`;
    });
  html = restore(html, kept).replace(/&(?!amp;|lt;|gt;)/g, "&amp;");
  return html
    .replace(/\[(\d{1,2})\]/g, "<sup>$1</sup>")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function plain(raw) {
  const { body, kept } = protect(raw.trim());
  return restore(body.replace(/\*+/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"), kept)
    .replace(/\s{2,}/g, " ")
    .trim();
}

function wholeBold(line) {
  const { body } = protect(line.trim());
  return /^\*\*[^*].*\*\*$/.test(body) && !body.slice(2, -2).includes("**");
}

function parseContents(file) {
  const lines = readFileSync(file, "utf8").split("\n").map((line) => plain(line)).filter(Boolean);
  const entries = [];
  let section = "";
  let current = null;
  for (const line of lines.slice(1)) {
    if (/^[A-Z][A-Z &]+$/.test(line) && line.length > 3) {
      section = line;
      current = null;
      continue;
    }
    if (/^\d{1,3}$/.test(line)) {
      current = { section, page: Number(line), author: "", title: "" };
      entries.push(current);
      continue;
    }
    if (!current) continue;
    if (!current.author) current.author = line;
    else current.title = current.title ? `${current.title} ${line}` : line;
  }
  return entries;
}

function projectSlugs() {
  const source = readFileSync(JOURNAL_DATA, "utf8");
  const found = [];
  const pattern = /slug: "([^"]+)",\s*title: (['"])(.*?)\2,[\s\S]*?issueSlug: "([^"]+)"/g;
  let match;
  while ((match = pattern.exec(source))) found.push({ slug: match[1], title: match[3], issue: match[4] });
  return found;
}

function localImages(folder) {
  const dir = join(folder, "Images");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => !name.startsWith(".") && !name.endsWith(".md"));
}

function leadingNumber(name) {
  const match = nfc(name).match(/^\(?(\d+)/);
  return match ? match[1] : null;
}

function resolveImage(ref, files, used) {
  const name = nfc(decodeURIComponent(ref.replace(/^<|>$/g, "").replace(/^Images\//, "")));
  const exact = files.find((file) => nfc(file) === name);
  if (exact) return exact;
  const prefix = files.find((file) => !used.has(file) && name.length > 8 && nfc(file).startsWith(name));
  if (prefix) return prefix;
  const tail = files.find((file) => !used.has(file) && name.length > 8 && nfc(file).endsWith(name));
  if (tail) return tail;
  const number = leadingNumber(name);
  if (number) {
    const byNumber = files.find((file) => !used.has(file) && leadingNumber(file) === number);
    if (byNumber) return byNumber;
  }
  const near = files
    .filter((file) => !used.has(file))
    .map((file) => ({ file, score: overlap(file.replace(/\.[a-z0-9]+$/i, ""), name.replace(/\.[a-z0-9]+$/i, "")) }))
    .sort((a, b) => b.score - a.score)[0];
  return near && near.score >= 0.6 ? near.file : null;
}

function described(alt) {
  const label = plain(alt)
    .replace(/\.(jpe?g|png|tiff?|heic|pdf|webp|bmp)$/i, "")
    .replace(/\(\d\)$/, "")
    .replace(/^\d+[.,]?\s*/, "")
    .replace(/\s*\.\s*$/, ".")
    .trim();
  return label.split(/\s+/).length >= 4 ? label : "";
}

function parseArticle(file, folder) {
  const lines = readFileSync(file, "utf8").split("\n").map((line) => line.replace(/\s+$/, ""));
  const files = localImages(folder);
  const used = new Set();
  const refs = [];
  const missing = [];
  const blocks = [];
  let title = "";
  let author = "";
  let speaker = null;
  let lastFigure = null;
  let gap = 0;
  let list = null;

  const pushImage = (ref, alt) => {
    const resolved = resolveImage(ref, files, used) ?? resolveImage(alt, files, used);
    if (!resolved) {
      missing.push(alt || ref);
      return;
    }
    if (!used.has(resolved)) refs.push(resolved);
    used.add(resolved);
    const index = refs.indexOf(resolved);
    const label = described(alt);
    if (lastFigure && lastFigure.open) {
      lastFigure.images.push(index);
      if (label) lastFigure.labels.push(label);
    } else {
      lastFigure = { t: "fig", images: [index], open: true, labels: label ? [label] : [] };
      blocks.push(lastFigure);
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      gap += 1;
      continue;
    }
    const trimmed = line.trim();
    if (!title && trimmed.startsWith("# ")) {
      title = plain(trimmed.slice(2)).replace(/^\d+\.\s*/, "");
      gap = 0;
      continue;
    }
    const authorMatch = trimmed.match(/^Authors?:\s*(.+)$/);
    if (!author && authorMatch) {
      author = plain(authorMatch[1]);
      gap = 0;
      continue;
    }
    const image = trimmed.match(/^!\[([^\]]*)\]\((.+?)\)(?:\s*\\\[Pg\\\.[^\]]*\\\])?$/);
    if (image) {
      list = null;
      pushImage(image[2], image[1]);
      gap = 0;
      continue;
    }
    const fileLink = trimmed.match(/^\[([^\]]+\.(?:pdf|heic|jpe?g|png|tiff?))\]\(([^)]+)\)$/i);
    if (fileLink) {
      list = null;
      pushImage(plain(fileLink[1]), plain(fileLink[1]));
      gap = 0;
      continue;
    }
    const figure = lastFigure && lastFigure.open ? lastFigure : null;
    if (figure) figure.open = false;
    if (figure && gap <= 1 && !wholeBold(trimmed) && !trimmed.startsWith(">") && plain(trimmed).length <= CAPTION_LIMIT) {
      figure.caption = inline(trimmed);
      gap = 0;
      continue;
    }
    const who = plain(trimmed).match(/^(Q|A|[A-Z]{2,3}):?$/);
    if (who) {
      speaker = who[1];
      list = null;
      gap = 0;
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (bullet && !/^\*\*/.test(trimmed)) {
      if (!list || list.t !== "ul") {
        list = { t: "ul", items: [] };
        blocks.push(list);
      }
      list.items.push(inline(bullet[1]));
      gap = 0;
      continue;
    }
    if (ordered) {
      if (!list || list.t !== "ol") {
        list = { t: "ol", start: Number(ordered[1]), items: [] };
        blocks.push(list);
      }
      list.items.push(inline(ordered[2]));
      gap = 0;
      continue;
    }
    list = null;
    if (trimmed.startsWith(">")) {
      blocks.push({ t: "q", html: inline(trimmed.replace(/^>\s?/, "")) });
      gap = 0;
      continue;
    }
    if (wholeBold(trimmed) && plain(trimmed).length <= HEAD_LIMIT) {
      blocks.push({ t: "h", html: inline(trimmed.replace(/^\*\*|\*\*$/g, "")) });
      speaker = null;
      gap = 0;
      continue;
    }
    const block = { t: "p", html: inline(trimmed) };
    if (wholeBold(trimmed)) {
      block.html = inline(trimmed.replace(/^\*\*|\*\*$/g, ""));
      block.ask = true;
    }
    if (speaker) {
      block.who = speaker;
      speaker = null;
    }
    if (block.html) blocks.push(block);
    gap = 0;
  }

  for (const block of blocks) {
    if (block.t === "fig" && !block.caption && block.labels.length) block.caption = inline(block.labels.join(" / "));
    delete block.open;
    delete block.labels;
  }
  const unused = files.filter((name) => !used.has(name) && !/\.(psd|cr2)$/i.test(name));
  return { title, author, blocks, refs, missing, unused };
}

function sipsToPng(input) {
  const out = join(tmpdir(), `issue-${process.pid}-${Math.random().toString(36).slice(2)}.png`);
  execFileSync("sips", ["-s", "format", "png", input, "--out", out], { stdio: "ignore" });
  return out;
}

async function convert(input, output) {
  if (!existsSync(output) && !SKIP_IMAGES) {
    const ext = extname(input).toLowerCase();
    let source = input;
    let temp = null;
    if (SIPS_EXT.has(ext) || !SHARP_EXT.has(ext)) {
      temp = sipsToPng(input);
      source = temp;
    }
    try {
      await sharp(source, { limitInputPixels: false, failOn: "none" })
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .webp({ quality: QUALITY })
        .toFile(output);
    } catch (error) {
      if (temp) throw error;
      temp = sipsToPng(input);
      await sharp(temp, { limitInputPixels: false })
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .webp({ quality: QUALITY })
        .toFile(output);
    } finally {
      if (temp) rmSync(temp, { force: true });
    }
  }
  if (!existsSync(output)) return null;
  const meta = await sharp(output).metadata();
  return { width: meta.width, height: meta.height };
}

async function buildIssue(issue, projects) {
  const base = join(SOURCE, issue.folder);
  const folders = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+\./.test(entry.name))
    .map((entry) => ({ name: entry.name, order: Number(entry.name.split(".")[0]) }))
    .filter((entry) => !issue.orders || issue.orders.has(entry.order))
    .sort((a, b) => a.order - b.order);

  const contentsFolder = folders.find((entry) => entry.order === 2);
  const contents = parseContents(join(base, contentsFolder.name, readdirSync(join(base, contentsFolder.name)).find((name) => /^\d+\./.test(name) && name.endsWith(".md"))));
  const taken = new Set();
  const slugs = new Set();
  const articles = [];

  for (const entry of folders) {
    if (entry.order === 2) continue;
    const folder = join(base, entry.name);
    const md = readdirSync(folder).find((name) => /^\d+\./.test(name) && name.endsWith(".md"));
    if (!md) continue;
    const parsed = parseArticle(join(folder, md), folder);
    const editorial = entry.order === 1;
    if (editorial && !parsed.author && parsed.blocks[0]?.t === "h") {
      parsed.author = plain(parsed.blocks.shift().html);
      if (parsed.blocks[0]?.t === "h" && /Editor In Chief/i.test(parsed.blocks[0].html)) {
        parsed.blocks.shift();
      }
    }
    if (editorial && parsed.blocks[0]?.t === "p" && plain(parsed.blocks[0].html) === "Editorial Note") {
      parsed.blocks.shift();
      const lead = parsed.blocks[0];
      if (lead?.t === "p" && lead.html.length <= HEAD_LIMIT && !/[.,:;!?]$/.test(lead.html)) lead.t = "h";
    }
    if (editorial && !parsed.author) {
      const [name, role] = parsed.blocks.slice(-2);
      if (name?.t === "p" && role?.t === "p" && name.html.length <= 40 && role.html.length <= 80) {
        parsed.author = `${plain(name.html)}, ${plain(role.html)}`;
        parsed.blocks.splice(-2);
      }
    }

    let match = null;
    if (!editorial) {
      let best = 0;
      contents.forEach((candidate, index) => {
        if (taken.has(index)) return;
        const score =
          overlap(`${candidate.title}`, parsed.title) +
          (overlap(candidate.author, parsed.author || parsed.title) >= 0.5 ? 1 : 0);
        if (score > best) {
          best = score;
          match = index;
        }
      });
      if (best < 0.5) match = null;
      if (match !== null) taken.add(match);
    }
    const listing = match !== null ? contents[match] : null;

    const project = projects
      .filter((candidate) => candidate.issue === issue.slug)
      .map((candidate) => ({ candidate, score: overlap(candidate.title, parsed.title) }))
      .sort((a, b) => b.score - a.score)[0];
    const head = parsed.title.split(/:|\s[-–]\s/)[0];
    let slug = editorial
      ? "editorial-note"
      : project && project.score >= 0.6
        ? project.candidate.slug
        : slugify(head.trim().split(/\s+/).length >= 2 ? head : parsed.title);
    while (slugs.has(slug)) slug = `${slug}-${entry.order}`;
    slugs.add(slug);

    const outDir = join(PUBLIC_DIR, issue.slug, slug);
    mkdirSync(outDir, { recursive: true });
    const images = [];
    const failed = [];
    for (const [index, name] of parsed.refs.entries()) {
      const file = `${String(index + 1).padStart(2, "0")}.webp`;
      try {
        const size = await convert(join(folder, "Images", name), join(outDir, file));
        images.push(size ? { src: `/journal/issues/${issue.slug}/${slug}/${file}`, ...size } : null);
      } catch {
        failed.push(name);
        images.push(null);
      }
    }

    const remap = new Map();
    const kept = [];
    images.forEach((image, index) => {
      if (!image) return;
      remap.set(index, kept.length);
      kept.push(image);
    });
    const blocks = parsed.blocks
      .map((block) => {
        if (block.t !== "fig") return block;
        const indices = block.images.filter((index) => remap.has(index)).map((index) => remap.get(index));
        if (!indices.length) return null;
        return { ...block, images: indices };
      })
      .filter(Boolean);

    articles.push({
      slug,
      order: entry.order,
      section: editorial ? "Editorial" : listing ? listing.section.charAt(0) + listing.section.slice(1).toLowerCase() : "",
      page: listing ? listing.page : null,
      title: editorial ? "Editorial Note" : parsed.title,
      author: parsed.author || (listing ? listing.author : ""),
      images: kept,
      blocks,
    });

    report.push({
      issue: issue.slug,
      slug,
      title: parsed.title.slice(0, 60),
      section: listing?.section ?? (editorial ? "EDITORIAL" : "?"),
      page: listing?.page ?? null,
      images: kept.length,
      missing: parsed.missing,
      unused: parsed.unused,
      failed,
    });
  }

  const editorialIndex = articles.findIndex((article) => article.slug === "editorial-note");
  const editorial = articles.splice(editorialIndex, 1)[0];
  const data = {
    slug: issue.slug,
    number: issue.number,
    editorial,
    articles,
    unmatched: contents.filter((_, index) => !taken.has(index)).map((entry) => `${entry.page} ${entry.author} ${entry.title}`),
  };

  mkdirSync(DATA_DIR, { recursive: true });
  const { unmatched, ...payload } = data;
  if (unmatched.length) report.push({ issue: issue.slug, unmatched });
  writeFileSync(
    join(DATA_DIR, `${issue.slug}.ts`),
    `import type { IssueText } from "../issue-text";\n\nexport const ${issue.constant}: IssueText = ${JSON.stringify(payload, null, 2)};\n`,
  );
}

const target = ISSUES.find((issue) => process.argv.slice(2).includes(issue.slug));
if (!target) {
  console.log(`Usage: bun scripts/prepare-issue-reader.mjs <${ISSUES.map((issue) => issue.slug).join("|")}> [--text-only]`);
  process.exit(1);
}
await buildIssue(target, projectSlugs());

for (const row of report) {
  if (row.unmatched) {
    console.log(`UNMATCHED ${row.issue}:`, row.unmatched);
    continue;
  }
  const notes = [
    row.missing.length ? `missing ${row.missing.length}` : "",
    row.unused.length ? `unused ${row.unused.length}` : "",
    row.failed.length ? `failed ${row.failed.join(", ")}` : "",
  ].filter(Boolean);
  console.log(`${row.issue} | ${String(row.page ?? "-").padStart(3)} | ${row.section.padEnd(12)} | ${row.slug.padEnd(48)} | img ${row.images} ${notes.join("; ")}`);
}
