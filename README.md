# FootballSG — youth football clubs & academies in Singapore

**[footballsg.cc](https://footballsg.cc)** · An interactive **knowledge graph** that helps parents find,
compare and enrol their child into a football club or academy in Singapore — grassroots to elite,
**U6 through U17**, island-wide.

Everything is scored from *your* home base against the things parents actually weigh: **weekend vs
weekday sessions**, **travel time**, **monthly fees by age band**, **age-group fit**, and **pathway**
(open enrolment → Centre-of-Excellence → Singapore Youth League).

👉 Open [`pitch-scout.html`](pitch-scout.html) in any browser — a single, self-contained page
(no build step, no dependencies, no tracking).

## What it shows

21 clubs island-wide across two pathways — **elite** (Singapore Youth League / Centre-of-Excellence)
and **open enrolment** (brand & community academies) — with six ways to read the same data:

| View | What it answers |
|------|-----------------|
| **Knowledge graph** | Force-directed node-link map: your home town at the centre, attribute hubs orbiting it, clubs hanging off the hubs they belong to. |
| **Sankey flow** | Region → Club → the current lens's attribute, as weighted ribbons. |
| **Treemap** | Clubs nested inside their region; tile area scales with the lens metric. |
| **Charts** | Monthly fees, travel time, age-band coverage (U6→U17), and a cost-vs-distance map. |
| **Table** | Every field, sortable; click a row for the full scouting card with sources. |
| **Register & pathway** | The open→elite ladder, real sourced Singapore examples (Ben Davis, Zikos Chua, Sarrvin Raj, Joel Chew), the Oct–Dec trial-season calendar, and tappable **register / call / email** for every club. |

Every scouting card includes a **"How to join"** block and a **fee breakdown by programme tier** —
because a club's cost depends on the programme and age band (an open grassroots squad and a
selection-only Centre-of-Excellence are priced very differently).

### Focus lenses

A single control recolours **every** view by the dimension you care about:
**Overview · Distance · Training days · Fees · Age groups · Games (local/international) · Coaching.**

### Filters (hard constraints)

Weekend sessions · No weekday-daytime clash · Near home ≤12 km · pathway type · **age band
(U6–U9 · U10–U13 · U14–U15 · U16–U17)** · max travel time. **Travel-by toggle** switches all
timings between **car and public transit**.

### Home base

A **home-base picker** (25 Singapore towns across all regions) recomputes every distance, travel
time, the "nearest"/"near-home" KPIs and the ≤12 km filter from wherever you live — the graph
re-centres on your town. A **⌖ Locate** button uses your device location (with permission) to
auto-select the nearest listed town. Deep-link: `#home=tampines`.

## Fees model

Each club carries one or more **programme tiers** (`feeTiers`), each with its own **age range**,
**monthly fee**, **one-time registration**, **confidence**, and an **open vs selection** flag. The
fee shown everywhere resolves to the **cheapest openly-enrollable tier for the age band you've
selected** — so a Centre-of-Excellence that is "free by selection" no longer masks the S$100/mo
grassroots programme a typical family would actually join.

## Data

Compiled July 2026 from club sites, the Football Association of Singapore / Singapore Youth
League, and local press. Each club carries a **confidence** rating and its **sources**. Age bands
(U6–U17) are drawn from each club's **stated age range**; fees and exact training days/times are
**indicative** — confirm directly with each club before enrolling. Notable notes: Albirex Niigata's
youth setup **rebranded to FC Jurong** from Jan 2026; the "Borussia" academy is
**Mönchengladbach**, not Dortmund; there is **no standing Man Utd academy** in Singapore.

## Deep links

Share a specific view/lens via the URL hash, e.g.
`pitch-scout.html#view=sankey&lens=fees` or `#home=tampines&club=bar`.

---

*A decision aid for families. Figures are indicative — confirm with each club. Not affiliated with any club.*
