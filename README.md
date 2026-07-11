# The Pitch — U14 Scouting Board (Singapore, west-side)

An interactive **knowledge graph** of Singapore youth football pathways, built to help a
family based in **Tengah** (west) choose a club/academy for a 14-year-old (U14 and up).
Everything is scored from the home base against two hard constraints: **weekend sessions**
(no weekday-school clash) and **short travel from Tengah**.

👉 Open [`pitch-scout.html`](pitch-scout.html) in any browser — it is a single, fully
self-contained file (no build step, no dependencies, no network calls).

## What it shows

22 clubs island-wide across two pathways — **elite** (Singapore Youth League / Centre-of-Excellence)
and **open enrolment** (brand & community academies) — with five ways to read the same data:

| View | What it answers |
|------|-----------------|
| **Knowledge graph** | Force-directed node-link map: Tengah at the centre, attribute hubs orbiting it, clubs hanging off the hubs they belong to. |
| **Sankey flow** | Region → Club → the current lens's attribute, as weighted ribbons. |
| **Treemap** | Clubs nested inside their region; tile area scales with the lens metric. |
| **Charts** | Monthly fees, travel time, age-band coverage, and a cost-vs-distance map. |
| **Table** | Every field, sortable; click a row for the full scouting card with sources. |
| **Pathway** | The open→elite ladder, real sourced Singapore examples (Ben Davis, Zikos Chua, Sarrvin Raj, Joel Chew), and the Oct–Dec trial-season enrolment calendar. |

Every scouting card includes a **"How to join"** block — requirements, trial process, and tappable **contact buttons** (register/website/email/phone).

### Focus lenses

A single control recolours **every** view by the dimension you care about:
**Overview · Distance · Training days · Fees · Age groups · Games (local/international) · Coaching.**

### Filters (hard constraints)

Weekend sessions · No weekday-daytime clash · Near home ≤12 km · pathway type · age band offered · max travel time. **Travel-by toggle** switches all timings between **car and public transit**.

### Home base

A **home-base picker** (25 Singapore towns across all regions) recomputes every distance, travel time, the "nearest"/"near-home" KPIs and the ≤12 km filter from wherever you live — the graph re-centres on your town. Tengah keeps its researched figures; other towns use a straight-line (coordinate) estimate. Deep-link: `#home=tampines`.

## Data

Compiled July 2026 from club sites, the Football Association of Singapore / Singapore Youth
League, and local press. Each club carries a **confidence** rating and its **sources**.
Figures (fees, exact training days/times) are **indicative** — confirm directly with each
club before enrolling. Notable notes captured in the data: Albirex Niigata's youth setup
**rebranded to FC Jurong** from Jan 2026; the "Borussia" academy is **Mönchengladbach**, not
Dortmund; there is **no standing Man Utd academy** in Singapore.

## Deep links

Share a specific view/lens via the URL hash, e.g.
`pitch-scout.html#view=sankey&lens=distance`.

---

*A personal decision aid. Not affiliated with any club.*
