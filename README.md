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

20 clubs island-wide across two pathways — **elite** (Singapore Youth League / Centre-of-Excellence)
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

### Member sign-in (device-local)

**☺ Sign in** creates an optional member profile — parent name, son/daughter + birth month,
phone, home town — that lives **only in your browser's localStorage**. There is no server, no
account database and nothing to transmit, so this stays compatible with the site's no-tracking
promise. Being signed in makes your **home base, travel mode and age band persist between
visits**, unlocks a **★ shortlist** (star clubs from the scouting card or the Register tab, then
filter to "★ My shortlist only"), and **prefills the enquiry-email builder** with your details.
Sign out keeps the profile on the device without applying it; **Delete profile** erases every
trace. Shared deep links always win over saved preferences, so a link you send a friend looks
the same for them. Members also get a **★ column in the Table view**, a live count on the
shortlist filter, and **Export / Import**: since no server holds your profile, moving devices
is a JSON file you carry yourself — export here, import there (imports are whitelist-validated,
and a malformed file is rejected without touching the existing profile).

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
**Mönchengladbach**, not Dortmund; there is **no standing Man Utd academy** in Singapore; and the
**Chelsea FC Soccer School was removed** in Jul 2026 — it no longer operates here (its site has been
dead since ~2018 and Chelsea's own Singapore pages 404 or redirect away). We only list clubs that
actually run in Singapore.

### Automated cost-accuracy checks

`node checks/fee-audit.mjs` extracts the club dataset straight out of `index.html` and enforces
the invariants we used to re-check by hand: the headline fee must equal the **cheapest
openly-enrollable published tier**, term/annual arithmetic must reproduce the stated monthly
(a 12-session term ≈ 3 months; clubs with odd season lengths carry `termMonths`), every
high-confidence fee must carry a source, and provenance/withhold records must be well-formed.
It also cross-checks one-time registration fees stated in prose against the modelled `regFee`,
so the true cost of joining can't be understated. It runs in CI on every push
(`.github/workflows/data-checks.yml`) — a fee that doesn't add up can't deploy — and a monthly
scheduled run (`data-freshness.yml`) executes it with `--strict`, which starts failing once the
compiled date is more than 6 months old: the repo itself nags for a re-verification pass. The
app does the same for readers — once the data is >6 months old by the viewer's clock, every
view carries a banner saying how stale the figures are. In Jul 2026 the audit's first run caught four real errors: JSSL's monthly was
S$195 against its own S$588/3-month term (= S$196), F17's headline was a S$180 midpoint
instead of its cheapest venue (S$140), FC Jurong's S$200/mo unlimited package was unmodelled,
and ActiveSG's ~S$65/mo derivation double-counted the season length (corrected to ~S$30/mo,
matching the S$6–7/session parents report).

## Deep links

Share a specific view/lens via the URL hash, e.g.
`pitch-scout.html#view=sankey&lens=fees` or `#home=tampines&club=bar`.

---

*A decision aid for families. Figures are indicative — confirm with each club. Not affiliated with any club.*
