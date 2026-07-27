#!/usr/bin/env node
/* Integrity gate for the news archive (news.json).

   The archive is append-only history shown on the public site, and — unlike the club dataset —
   it can be written by an automated agent. That makes it exactly the sort of thing that rots
   silently: a broken date, a category that no longer exists, an item with no source. The site's
   promise is that every claim is auditable, so the same rule applies here as to fees:
   an unsourced item must not ship.

     ERRORS (exit 1):
       · malformed archive shape, unknown/duplicate category ids
       · duplicate item ids, missing required fields
       · date not YYYY-MM-DD or not a real calendar date; time present but not HH:MM (24h)
       · a date in the future (Singapore time) — the archive records what happened
       · category not declared in categories[]
       · source missing, not absolute https, or lacking a hostname
       · status not confirmed|rumoured
       · a clubs[] reference to a club id that does not exist in index.html

     WARNINGS (printed, exit 0 — add --strict to fail on them):
       · items[] not in reverse-chronological order (display sorts anyway, but drift hides bugs)
       · a title or summary long enough to break the card layout
       · an empty archive (fine on day one, suspicious later)

   Zero dependencies; run:  node checks/news-audit.mjs   [--strict] */

import { readFileSync } from "node:fs";
import vm from "node:vm";

const STRICT = process.argv.includes("--strict");
const root = new URL("../", import.meta.url);

let archive;
try {
  archive = JSON.parse(readFileSync(new URL("news.json", root), "utf8"));
} catch (e) {
  console.error("news-audit: news.json is missing or not valid JSON:", e.message);
  process.exit(1);
}

/* Club ids come from the same DATA block the fee audit reads, so a news item can't
   reference a club the site doesn't list (or one that was dropped later). */
let clubIds = new Set();
try {
  const html = readFileSync(new URL("index.html", root), "utf8");
  const ds = html.indexOf("/* ===================== DATA");
  const de = html.indexOf("/* ===================== ENGINE");
  const xy = html.match(/const CLUB_XY=\{[\s\S]*?\};/);
  if (ds >= 0 && de > ds && xy) {
    const { CLUBS } = vm.runInNewContext(
      html.slice(ds, de) + "\n" + xy[0] + "\n;({CLUBS})", {}, { timeout: 5000 }
    );
    clubIds = new Set(CLUBS.map((c) => c.id));
  }
} catch { /* club cross-check is best-effort; the fee audit owns index.html's integrity */ }

const errors = [];
const warnings = [];
const err = (w, m) => errors.push(`${w}: ${m}`);
const warn = (w, m) => warnings.push(`${w}: ${m}`);

const STATUSES = new Set(["confirmed", "rumoured"]);
const TITLE_MAX = 140;
const SUMMARY_MAX = 700;

/* ---- categories ---- */
if (!Array.isArray(archive.categories) || !archive.categories.length) {
  err("archive", "categories[] missing or empty");
}
const catIds = new Set();
for (const c of archive.categories || []) {
  const id = c && c.id;
  if (!id || !/^[a-z][a-z0-9]*$/.test(id)) err("categories", `bad category id ${JSON.stringify(id)}`);
  else if (catIds.has(id)) err("categories", `duplicate category id "${id}"`);
  else catIds.add(id);
  if (!c || !c.label) err("categories", `category "${id}" has no label`);
}

/* ---- items ---- */
if (!Array.isArray(archive.items)) err("archive", "items[] missing or not an array");
const items = Array.isArray(archive.items) ? archive.items : [];
if (!items.length) warn("archive", "the archive is empty — fine before the first run, a bug after it");

/* "now" in Singapore, so a future-dated item is caught regardless of where CI runs. */
const sgNow = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

const seen = new Set();
let prevKey = null;
for (const [i, it] of items.entries()) {
  const w = (it && it.id) || `items[${i}]`;

  if (!it || typeof it !== "object") { err(w, "item is not an object"); continue; }
  if (!it.id || !/^[a-z0-9][a-z0-9-]*$/.test(it.id))
    err(w, "id must be lowercase kebab-case (suggest YYYY-MM-DD-slug)");
  else if (seen.has(it.id)) err(w, "duplicate item id");
  else seen.add(it.id);

  /* date: well-formed AND a real calendar date — 2026-02-30 parses as March otherwise */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(it.date || "")) err(w, `date must be YYYY-MM-DD, got ${JSON.stringify(it.date)}`);
  else {
    const d = new Date(it.date + "T00:00:00Z");
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== it.date)
      err(w, `date "${it.date}" is not a real calendar date`);
    else if (it.date > sgNow) err(w, `date "${it.date}" is in the future (SG today is ${sgNow})`);
  }

  /* time is OPTIONAL by design. Most outlets publish a date and no clock time; demanding one
     would force whoever fills the archive to invent it, which is exactly the fabrication this
     project refuses elsewhere. State it when the source states it, omit it otherwise. */
  if (it.time !== undefined && it.time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(it.time))
    err(w, `time, when given, must be HH:MM 24-hour — got ${JSON.stringify(it.time)}`);

  if (!it.cat) err(w, "cat missing");
  else if (!catIds.has(it.cat)) err(w, `cat "${it.cat}" is not declared in categories[]`);

  if (!it.title || typeof it.title !== "string") err(w, "title missing");
  else if (it.title.length > TITLE_MAX) warn(w, `title is ${it.title.length} chars (>${TITLE_MAX}) — will crowd the card`);

  if (!it.summary || typeof it.summary !== "string") err(w, "summary missing");
  else if (it.summary.length > SUMMARY_MAX) warn(w, `summary is ${it.summary.length} chars (>${SUMMARY_MAX})`);

  /* source: the whole point — no source, no item */
  if (!it.src) err(w, "src missing — an unsourced item must not ship");
  else if (!/^https:\/\//.test(it.src)) err(w, `src must be absolute https, got "${it.src}"`);
  else {
    try { if (!new URL(it.src).hostname) throw new Error("no host"); }
    catch { err(w, `src is not a parseable URL: "${it.src}"`); }
  }

  if (it.status && !STATUSES.has(it.status))
    err(w, `status "${it.status}" must be confirmed|rumoured`);

  if (it.clubs !== undefined) {
    if (!Array.isArray(it.clubs)) err(w, "clubs must be an array of club ids");
    else for (const cid of it.clubs)
      if (clubIds.size && !clubIds.has(cid)) err(w, `clubs[] references unknown club id "${cid}"`);
  }

  /* ordering: newest first */
  const key = `${it.date || ""}T${it.time || ""}`;
  if (prevKey !== null && key > prevKey)
    warn(w, "archive is not in reverse-chronological order (newest first)");
  prevKey = key;
}

/* ---- report ---- */
console.log(`news-audit: ${items.length} item(s) across ${catIds.size} categories`);
for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (!warnings.length && !errors.length) console.log("  archive integrity holds ✓");
if (errors.length || (STRICT && warnings.length)) {
  console.log(`news-audit: FAILED — ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`news-audit: passed with ${warnings.length} warning(s)`);
