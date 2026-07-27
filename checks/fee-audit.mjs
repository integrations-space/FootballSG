#!/usr/bin/env node
/* Automated cost-accuracy audit for the CLUBS dataset embedded in index.html.
   The site's whole value is that its figures can be trusted; until now every fee
   audit was a hand pass (see git history). This script makes the invariants we
   kept re-checking by hand permanent and machine-enforced:

     ERRORS (exit 1 — the data is internally inconsistent):
       · duplicate/malformed club ids, missing required fields
       · invalid age bands, unsorted/duplicated ages
       · invalid confidence values, malformed feeHold/feeSrc
       · a club's legacy feeMo scalar disagreeing with its feeTiers[] —
         the scalar must equal the cheapest openly-enrollable published tier,
         because every view resolves fees through that rule (fmo())
       · fees outside sanity bounds, a high-confidence fee with no source,
         missing CLUB_XY map coordinates, malformed contact fields

     WARNINGS (printed, exit 0 — likely wrong, needs a human):
       · term/annual arithmetic that doesn't reproduce the stated monthly
         (a 12-weekly-session term ≈ 3 months → mo = term/3; yr/12)
       · an "S$X/mo" figure quoted in feeText that matches no modelled tier
       · compiled date older than 6 months (fees drift — re-verify)

   Zero dependencies; run:  node checks/fee-audit.mjs   (add --strict to make
   warnings fail too, e.g. for a scheduled freshness check). */

import { readFileSync } from "node:fs";
import vm from "node:vm";

const STRICT = process.argv.includes("--strict");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

/* ---- extract the pure-data slice of the inline script ----
   The script is laid out DATA → ENGINE; everything before the ENGINE marker is
   DOM-free (AGES, R, CLUBS, META). CLUB_XY lives in ENGINE, so lift that one
   declaration separately. */
const dataStart = html.indexOf("/* ===================== DATA");
const dataEnd = html.indexOf("/* ===================== ENGINE");
if (dataStart < 0 || dataEnd < 0 || dataEnd <= dataStart) {
  console.error("fee-audit: could not locate the DATA/ENGINE markers in index.html");
  process.exit(1);
}
const xyDecl = html.match(/const CLUB_XY=\{[\s\S]*?\};/);
if (!xyDecl) {
  console.error("fee-audit: could not locate the CLUB_XY declaration in index.html");
  process.exit(1);
}
let data;
try {
  data = vm.runInNewContext(
    html.slice(dataStart, dataEnd) + "\n" + xyDecl[0] + "\n;({CLUBS,AGES,META,CLUB_XY})",
    {},
    { timeout: 5000 }
  );
} catch (e) {
  console.error("fee-audit: the DATA block failed to evaluate:", e.message);
  process.exit(1);
}
const { CLUBS, AGES, META, CLUB_XY } = data;

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

const CONF = new Set(["high", "med", "low"]);
const CATS = new Set(["elite", "open"]);
const REGIONS = new Set(["west", "central", "north", "ne", "east"]);
const SRC_KINDS = new Set(["club", "withheld", "assoc", "community", "partial", "estimate"]);
const FEE_MAX = 1500; // S$/mo — nothing on the island is dearer; beyond this it's a typo
const held = (c) => !!(c.feeHold && c.feeHold.on);

/* Same resolution rule as fmo() in index.html with no age filter: cheapest
   openly-enrollable published tier, falling back to cheapest published. */
function tierScalar(tiers) {
  const pub = tiers.filter((t) => t.mo !== null && t.mo !== undefined);
  if (!pub.length) return null;
  const open = pub.filter((t) => t.open);
  return Math.min(...(open.length ? open : pub).map((t) => t.mo));
}

const seenIds = new Set();
for (const c of CLUBS) {
  const id = c.id || "(no id)";
  if (!c.id || !/^[a-z][a-z0-9]*$/.test(c.id)) err(id, "id must be lowercase alphanumeric");
  if (seenIds.has(c.id)) err(id, "duplicate club id");
  seenIds.add(c.id);

  for (const k of ["name", "loc", "sched", "selText", "coach", "tier"])
    if (!c[k] || typeof c[k] !== "string") err(id, `missing/empty required field "${k}"`);
  if (!CATS.has(c.cat)) err(id, `cat "${c.cat}" not one of elite|open`);
  if (!REGIONS.has(c.region)) err(id, `region "${c.region}" invalid`);
  for (const k of ["km", "car", "transit"])
    if (!(typeof c[k] === "number" && c[k] > 0 && c[k] < 200)) err(id, `${k} out of range: ${c[k]}`);

  /* ages: valid bands, ascending, no duplicates */
  if (!Array.isArray(c.ages) || !c.ages.length) err(id, "ages missing/empty");
  else {
    const idx = c.ages.map((a) => AGES.indexOf(a));
    if (idx.some((i) => i < 0)) err(id, `unknown age band in ${JSON.stringify(c.ages)}`);
    else if (idx.some((v, i) => i > 0 && v <= idx[i - 1]))
      err(id, `ages not strictly ascending: ${c.ages.join(",")}`);
  }

  if (!CONF.has(c.conf)) err(id, `conf "${c.conf}" invalid`);
  if (!CONF.has(c.feeConf)) err(id, `feeConf "${c.feeConf}" invalid`);
  if (!Array.isArray(c.src) || !c.src.length) err(id, "src[] missing — every club must be auditable");
  else for (const s of c.src) if (/\s/.test(s)) err(id, `src entry contains whitespace: "${s}"`);

  /* fee scalar */
  if (!held(c)) {
    if (c.feeMo === undefined) err(id, "feeMo missing (use null for not-published)");
    else if (c.feeMo !== null && !(typeof c.feeMo === "number" && c.feeMo >= 0 && c.feeMo <= FEE_MAX))
      err(id, `feeMo out of sanity range: ${c.feeMo}`);
    if (c.feeConf === "high" && (!c.src || !c.src.length))
      err(id, "high-confidence fee with no source");
    if (!c.feeText) err(id, "feeText missing — every fee needs its explanation");
  }

  /* fee withhold contract */
  if (c.feeHold) {
    if (c.feeHold.on !== true) err(id, "feeHold present but not on:true — remove it or set it");
    if (c.feeHold.since && !/^\d{4}-(0[1-9]|1[0-2])$/.test(c.feeHold.since))
      err(id, `feeHold.since must be YYYY-MM, got "${c.feeHold.since}"`);
  }

  /* provenance override */
  if (c.feeSrc && !SRC_KINDS.has(c.feeSrc.kind))
    err(id, `feeSrc.kind "${c.feeSrc && c.feeSrc.kind}" invalid`);

  /* tiers: shape + the scalar/tier agreement every view depends on */
  if (c.feeTiers) {
    if (!Array.isArray(c.feeTiers) || !c.feeTiers.length) err(id, "feeTiers must be a non-empty array");
    else {
      for (const t of c.feeTiers) {
        const tl = `tier "${t.label || "?"}"`;
        if (!t.label) err(id, "a fee tier is missing its label");
        if (!Array.isArray(t.ages) || !t.ages.length || t.ages.some((a) => !AGES.includes(a)))
          err(id, `${tl} has invalid ages`);
        else if (!t.ages.some((a) => c.ages.includes(a)))
          warn(id, `${tl} ages ${t.ages.join(",")} don't overlap the club's stated ages`);
        if (t.mo !== null && !(typeof t.mo === "number" && t.mo >= 0 && t.mo <= FEE_MAX))
          err(id, `${tl} mo out of range: ${t.mo}`);
        if (t.regFee !== undefined && t.regFee !== null && !(typeof t.regFee === "number" && t.regFee >= 0 && t.regFee <= FEE_MAX))
          err(id, `${tl} regFee out of range: ${t.regFee}`);
        if (!CONF.has(t.conf)) err(id, `${tl} conf invalid`);
        if (typeof t.open !== "boolean") err(id, `${tl} needs an explicit open:true/false`);
      }
      if (!c.feeTiers.some((t) => t.open)) warn(id, "no open tier — families see only selection routes");
      if (!held(c)) {
        const derived = tierScalar(c.feeTiers);
        if (derived !== c.feeMo)
          err(id, `feeMo (${c.feeMo}) disagrees with feeTiers (cheapest open published = ${derived}) — every view resolves through the tier rule, so these must match`);
      }
    }
  }

  /* contact hygiene */
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) err(id, `malformed email "${c.email}"`);
  if (c.phone && !/^\+65 \d{4} \d{4}$/.test(c.phone)) warn(id, `phone "${c.phone}" not in +65 XXXX XXXX form`);
  if (c.reg && !/^https:\/\//.test(c.reg)) err(id, `reg link must be absolute https, got "${c.reg}"`);

  /* map coordinates: a club with no CLUB_XY silently falls back to Tengah-relative travel */
  if (!CLUB_XY[c.id]) err(id, "no CLUB_XY entry — travel from non-Tengah homes will be wrong");

  /* ---- arithmetic cross-checks (warnings): the stated period fees must
     reproduce the modelled monthly. Candidates = feeMo + every tier mo. ---- */
  if (!held(c)) {
    const candidates = new Set();
    if (typeof c.feeMo === "number") candidates.add(c.feeMo);
    for (const t of c.feeTiers || []) if (typeof t.mo === "number") candidates.add(t.mo);
    const texts = [c.feeText || "", ...(c.feeTiers || []).map((t) => t.note || "")];
    const num = (s) => Number(String(s).replace(/,/g, ""));
    const termMonths = c.termMonths || 3; // a term = 12 weekly sessions ≈ 3 months unless the club says otherwise
    for (const text of texts) {
      for (const m of text.matchAll(/S\$([\d,]+(?:\.\d+)?)(?:[–-][\d,]+(?:\.\d+)?)?\s*(?:\/|\s*per\s+)(?:12-session\s+)?term/gi)) {
        const exp = Math.round(num(m[1]) / termMonths);
        if (![...candidates].some((v) => v === exp))
          warn(id, `term fee ${m[0]} implies ~S$${exp}/mo (term≈${termMonths} months) but modelled monthlies are {${[...candidates].join(", ")}}`);
      }
      for (const m of text.matchAll(/S\$([\d,]+(?:\.\d+)?)\s*\/\s*yr/gi)) {
        const exp = Math.round(num(m[1]) / 12);
        if (![...candidates].some((v) => v === exp))
          warn(id, `annual fee ${m[0]} implies ~S$${exp}/mo but modelled monthlies are {${[...candidates].join(", ")}}`);
      }
      /* a one-time registration fee stated in prose must be modelled in regFee —
         otherwise the "true cost of joining" is understated everywhere the tier renders.
         Matches "S$120 reg", "one-time S$30</b> registration"; not "S$90 deposit"/"S$25 name jersey". */
      const regFees = new Set([c.regFee, ...(c.feeTiers || []).map((t) => t.regFee)].filter((v) => typeof v === "number"));
      for (const m of text.matchAll(/S\$([\d,]+)(?:<\/b>)?\s+reg(?:istration)?\b/gi)) {
        const v = num(m[1]);
        if (![...regFees].some((r) => r === v))
          warn(id, `prose states a one-time ${m[0].replace(/<\/b>/, "")} fee but modelled regFees are {${[...regFees].join(", ") || "none"}}`);
      }
      /* "~S$183/mo" or "~S$185–210/mo" quoted in prose must contain a modelled monthly.
         A leading "+" marks an add-on on top of the fee (e.g. "+~S$80/mo lunch") — skip those. */
      for (const m of text.matchAll(/(\+\s*~?)?S\$([\d,]+(?:\.\d+)?)(?:[–-]([\d,]+(?:\.\d+)?))?\/mo/gi)) {
        if (m[1]) continue;
        const lo = num(m[2]), hi = m[3] ? num(m[3]) : lo;
        if (![...candidates].some((v) => v >= lo - 1 && v <= hi + 1))
          warn(id, `feeText quotes ${m[0]} but no modelled monthly falls in [${lo}, ${hi}]`);
      }
    }
  }
}

/* every CLUB_XY entry must belong to a listed club (stale entries hide removals) */
for (const k of Object.keys(CLUB_XY))
  if (!seenIds.has(k)) err(k, "CLUB_XY entry for a club that no longer exists");

/* freshness: fees drift — nudge for a re-verification pass twice a year */
{
  const m = /^(\d{4})-(\d{2})$/.exec(META.compiled || "");
  if (!m) err("META", `compiled must be YYYY-MM, got "${META.compiled}"`);
  else {
    const ageMonths =
      (new Date().getFullYear() - +m[1]) * 12 + (new Date().getMonth() + 1 - +m[2]);
    if (ageMonths > 6)
      warn("META", `data compiled ${META.compiled} — ${ageMonths} months old; fees need a re-verification pass`);
  }
}

/* ---- report ---- */
console.log(`fee-audit: ${CLUBS.length} clubs checked`);
for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (!warnings.length && !errors.length) console.log("  all cost-accuracy invariants hold ✓");
if (errors.length || (STRICT && warnings.length)) {
  console.log(`fee-audit: FAILED — ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`fee-audit: passed with ${warnings.length} warning(s)`);
