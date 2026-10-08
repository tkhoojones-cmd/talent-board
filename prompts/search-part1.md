---
name: vp-talent-search-part1
description: Daily VP Talent job search, Part 1 of 3 — Tiers 1-3.6 + Alert Inbox Sweep → adds roles with employer links to jobs.json in the talent-board repo.
---
**THIS IS PART 1 OF 3.** Tiers 1-3.6 + Alert Inbox Sweep.

**NEW DATA FLOW (rewritten 2026-10-08 — overrides anything below that says otherwise):** Tim has moved off Airtable. The GitHub repo `tkhoojones-cmd/talent-board` is now the database for the public board at jobs.soundherald.com. Airtable is Tim's read-only reference: **never write to Airtable, and do not read it for de-dup** (the repo is the source of truth). Wherever the search text below mentions Airtable, the "2026" table, "Next Step", writing records, the Google Sheet, Step 2/2B verification subagents, Built In re-verification volatility rules, or a final QA pass, ignore it: those jobs are now done by a GitHub Action robot that opens every role in a real headless browser twice a day and publishes only roles that load normally with an Apply button.

**YOUR JOB:** (1) run every search query below every run (no sampling; use the parallel subagents described in Step 1); (2) for each candidate role make sure it links to the **employer's own careers page or its ATS** (greenhouse.io, lever.co, ashbyhq.com, myworkdayjobs.com, smartrecruiters.com, company domain). Aggregator and job-board links (Built In and all builtin* sites, The Muse, Remotive, Jobright, LinkedIn, The Ladders, Himalayas, Wellfound, YC, Indeed, Lensa, Jobgether, RemoteRocketship, Hollylist, Zapply, ResumeGeni, RefreshMiami, Communitech, a16z/Quiet job boards, recruiter sites like bhsg/topechelon/jrgpartners/loxo) are NOT acceptable as the final link: web-search for the employer's own posting of that exact role; if you can't find it, drop the candidate. (3) Apply Step 3's filters. (4) Add the survivors to the repo (Step 4 below). You do NOT need to prove a role is live: WebFetch/WebSearch can be stale, and proving it is the robot's job. But never invent or guess URLs.

**NO FALSE HOPE still applies:** a missing role is better than a dead link. Only add roles whose employer link you actually found in search results or fetched pages.

**COMPLETION GATE — NON-NEGOTIABLE:** run all the queries in Step 1 every run via parallel subagents; do not self-abort or ask Tim questions (this is an unattended scheduled run).

## STEP 1: MARKET SWEEP — TIER 1 THROUGH TIER 3.6 (56 ACTIVE QUERIES)

### STEP 1 ORCHESTRATION — USE PARALLEL SUBAGENTS, NOT ONE SEQUENTIAL PASS

Dispatch the work to concurrent subagents using the Agent tool, in a **single message containing multiple Agent tool calls**. Use `subagent_type: "general-purpose"` so each has full tool access (WebSearch, web_fetch, in-app Browser).

Split the tiers into these buckets and give each subagent its own Agent call:

- **Bucket A** — Tier 1 + Tier 2 + Tier 2.5 (queries 1–38, 38 queries)
- **Bucket B** — Tier 3 + Tier 3.5 + Tier 3.6 (queries 39–56, 18 queries)

For each subagent's prompt, include: the exact numbered queries in its bucket (copy them verbatim from the tier definitions below), the skip list (see Step 3), the Browser Tab Hygiene rule above (if it will use the Browser), and this instruction: "Run every query in this list via WebSearch. For each query, report back: the query number, and for any result that looks like a VP/Head-of-Talent-or-People-equivalent role (including Chief People Officer / Chief Talent Officer), report company, job title, URL, location if visible, and comp if visible. Do NOT verify links or write anywhere — just report candidates. End your report with 'Queries run: N/N' confirming you executed every query in the list."

After all subagents return, aggregate every reported candidate, then skip verification (the robot does it) and go straight to Step 3 (filter) and Step 4 (write) yourself, centrally — never let a subagent write to Airtable directly.

Run every single active query across both buckets. Do not skip any tier or query.

### Tier 1 — Startup / Scaleup ATS (20 queries)

1. `"VP of Talent" OR "VP Talent" OR "Head of Talent" site:jobs.ashbyhq.com`
2. `"VP of People" OR "Head of People" OR "VP People" site:jobs.ashbyhq.com`
3. `"VP Recruiting" OR "Head of Recruiting" OR "VP Talent Acquisition" site:jobs.ashbyhq.com`
4. `"VP of Talent" OR "VP Talent" OR "Head of Talent" site:job-boards.greenhouse.io`
5. `"VP of People" OR "Head of People" OR "VP People" site:job-boards.greenhouse.io`
6. `"VP Recruiting" OR "VP Talent Acquisition" site:job-boards.greenhouse.io`
7. `"VP of Talent" OR "VP Talent" OR "Head of Talent" site:lever.co`
8. `"VP of People" OR "Head of People" OR "VP People" site:lever.co`
9. `"VP of Talent" OR "Head of Talent" OR "VP People" site:jobs.workable.com`
10. `"VP of Talent" OR "Head of Talent" OR "VP People" site:apply.workable.com`
11. `"VP of Talent" OR "Head of Talent" OR "VP People" site:jobs.smartrecruiters.com`
12. `"VP of Talent" OR "Head of Talent" OR "VP People" site:jobs.jobvite.com`
13. `"VP of Talent" OR "Head of Talent" OR "VP People" site:app.bamboohr.com/jobs`
14. `"VP of Talent" OR "Head of Talent" OR "VP People" site:boards.eu.greenhouse.io`
15. `"VP Recruitment" OR "Head of Recruitment" OR "Director of Recruitment" site:jobs.ashbyhq.com`
16. `"VP Recruitment" OR "Head of Recruitment" OR "Director of Recruitment" site:job-boards.greenhouse.io`
17. `"VP Recruitment" OR "Head of Recruitment" OR "VP Recruiting" site:lever.co`
18. `"VP of Talent" OR "Head of Talent" OR "VP People" OR "VP Recruitment" site:careers.teamtailor.com`
19. `"VP of Talent" OR "Head of Talent" OR "VP People" OR "VP Recruitment" site:recruitee.com`
20. `"VP of Talent" OR "Head of Talent" OR "VP People" site:pinpointhq.com OR site:breezy.hr`

### Tier 2 — Enterprise ATS (10 queries)
NOTE: At large public companies, Director and Senior Director of Talent/People carry VP-equivalent scope and comp. Include them in all Tier 2 queries.

21. `"VP Talent" OR "VP of People" OR "Head of Talent" OR "Director of Talent" OR "Senior Director Talent" site:myworkdayjobs.com`
22. `"VP Talent" OR "VP of People" OR "Director of People" OR "Senior Director People" OR "Head of Recruiting" site:wd1.myworkdayjobs.com`
23. `"VP Talent" OR "Director Talent" OR "VP People" OR "Senior Director People" site:wd3.myworkdayjobs.com`
24. `"VP Talent" OR "Director Talent" OR "VP People" OR "Senior Director People" site:wd2.myworkdayjobs.com`
25. `"VP Talent" OR "Director Talent" OR "VP People" OR "Senior Director People" site:wd4.myworkdayjobs.com OR site:wd5.myworkdayjobs.com`
26. `"VP Talent" OR "VP of People" OR "Head of Talent" OR "Director of Talent" OR "Senior Director" "Talent" site:careers.icims.com`
27. `"VP Talent" OR "VP of People" OR "Head of Talent" OR "Director Talent" OR "Senior Director" "People" site:taleo.net`
28. `"VP Talent" OR "VP of People" OR "Head of Talent" OR "Director Talent" site:successfactors.com`
29. `"VP Talent" OR "VP of People" OR "Head of Talent" OR "Director Talent" site:ultipro.com OR site:ukg.com`
30. `"VP Talent" OR "VP of People" OR "Head of Talent" OR "Director Talent" site:jobs.rippling.com`

### Tier 2.5 — Direct large public tech company career pages (8 queries)

31. `site:salesforce.com OR site:adobe.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People" OR "Recruiting"`
32. `site:servicenow.com OR site:workday.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
33. `site:shopify.com OR site:shopify.ca "Director" OR "Senior Director" OR "VP" "Talent" OR "People" OR "Recruiting"`
34. `site:snowflake.com OR site:databricks.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
35. `site:stripe.com OR site:okta.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
36. `site:datadog.com OR site:cloudflare.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
37. `site:twilio.com OR site:zendesk.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
38. `site:hubspot.com OR site:docusign.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 3 — Aggregators & General Job Boards (12 queries)

39. `"VP of Talent" OR "Head of Talent" OR "VP People" site:indeed.com 2026`
40. `"VP Recruitment" OR "Head of Recruitment" site:wellfound.com 2026`
41. `"VP Talent" OR "Head of Talent" OR "VP People" OR "Head of People" site:wellfound.com`
42. `"VP Talent" OR "Head of Talent" OR "VP People" site:builtin.com 2026`
43. `"VP Talent" OR "Head of Talent" OR "VP People" OR "Head of People" site:glassdoor.com 2026`
44. `"VP Talent" OR "Head of Talent" OR "VP People" OR "Head of People" site:theladders.com`
45. `"VP Talent" OR "Head of Talent" OR "VP People" site:ziprecruiter.com 2026`
46. `"VP Talent" OR "Head of Talent" OR "VP People" OR "Head of People" site:execthread.com`
47. `"VP Talent" OR "Head of Talent" OR "VP People" site:otta.com`
48. `"VP Talent" OR "Head of Talent" OR "VP People" site:dice.com 2026`
49. `"VP of Talent" OR "VP People" OR "Head of People" job posting 2026 -inurl:linkedin -inurl:indeed`
50. `"VP Talent" OR "Head of Talent" OR "Vice President Talent" "apply now" 2026 tech startup remote`

### Tier 3.5 — Canada-specific boards (3 queries)

51. `"VP Talent" OR "Head of Talent" OR "VP People" OR "Head of People" site:eluta.ca`
52. `"VP Talent" OR "Head of Talent" OR "VP People" site:workopolis.com`
53. `"VP Talent" OR "Head of Talent" OR "VP People" OR "Head of People" "Canada" OR "British Columbia" OR "Vancouver" OR "Toronto" 2026`

### Tier 3.6 — Remote-first job boards (3 queries)

54. `"VP Talent" OR "Head of Talent" OR "VP People" site:weworkremotely.com`
55. `"VP Talent" OR "Head of Talent" OR "VP People" OR "Head of People" site:himalayas.app`
56. `"VP Talent" OR "Head of Talent" OR "VP People" site:remotive.com`

**Before moving to Step 2, write a one-line completion log**, e.g.: "Part 1 sweep complete: 56/56 active queries run (Tiers 1-3.6, via 2 parallel subagents), plus Tier 12 Alert Inbox Sweep below." If the number is not 56, re-dispatch the shortfall bucket(s) to a fresh subagent before proceeding.

---

## TIER 12 — ALERT INBOX SWEEP (push-based backstop) — MANDATORY, RUN EVERY DAY

Tim has (or will have) standing Google Alerts and/or LinkedIn saved-search job alerts configured to email him whenever new VP Talent/People postings are indexed. This tier turns those emails into candidates. This tier uses Gmail search, not WebSearch, so it does not compete with the Step 1 query budget above.

Steps:
1. Use the Gmail MCP (`search_threads`) to search for alert emails received since this task's last run — try queries like `from:googlealerts-noreply@google.com newer_than:2d`, `from:jobalerts-noreply@linkedin.com newer_than:2d`, and `subject:"VP Talent" OR subject:"Head of Talent" OR subject:"VP People" OR subject:"Head of People" newer_than:2d`.
2. For each matching email, open it (`get_message`) and extract every job posting mentioned: company, title, URL, location if visible. If `get_message` errors because the content is too large, read the saved result file with Grep/Read instead of giving up on that email. If a URL is a LinkedIn job link and lacks a company/title in the alert text itself, it's fine to open it via the in-app Browser (`mcp__Claude_Browser__navigate` + `mcp__Claude_Browser__get_page_text`) to read the real details directly off the posting — this is just reading a link from Tim's own inbox, not LinkedIn automation.
3. Treat each as a Step 1 candidate — run it through the same Step 2 verification gate, Step 3 filter, and Step 4 write as every other tier.
4. If no alert emails are found, that's a valid, honest empty result — say so plainly.

---

## STEP 3: FILTER AND EVALUATE

- **Seniority**: VP-level or equivalent Head-of, including Chief People Officer / Chief Talent Officer titles. For **large public companies and Big Tech** (Google, Meta, Amazon, Apple, Microsoft, Netflix, Salesforce, Adobe, Workday, ServiceNow, Shopify, Snowflake, Databricks, Stripe, Okta, Datadog, Cloudflare, HubSpot, Spotify, TikTok, Snap, Airbnb, Uber, eBay, NVIDIA, Qualcomm, CrowdStrike, Palo Alto, Intuit, Oracle, SAP, EA, Palantir, Scale AI, Anduril, Applied Intuition, Cohere, Qualtrics, Medallia, Live Nation, Universal Music Group, Sony Music Entertainment, Warner Music Group, SiriusXM, iHeartMedia, Tesla, General Motors, Ford Motor, Stellantis, Walt Disney, Warner Bros Discovery, Paramount, NBCUniversal, Sony Pictures, Otis Worldwide, CRH, etc.), also include **Director and Senior Director** of Talent/People/Recruiting. Mid-cap/late-stage pre-IPO companies (defined in Part 2's Tier 6.10) also get this exception, per Part 2's Step 3. Smaller private/early-stage companies do NOT get this exception — only true VP+/CPO-equivalent titles qualify there.
- **Comp signal**: Note if listed, in the Comp Range field. Flag high-value roles. Do NOT drop a role from the "2026" table solely for lacking a disclosed comp figure — VP/CPO-level roles routinely omit salary bands, and comp discovery normally only happens during the interview process. (The strict $300K-or-drop comp rule applies only to Tier 8 Senior IC roles in Part 3, not to this table.)
- **Location filter (hard):** Drop any role explicitly located on-site or hybrid outside the US and Canada. Remote-first/global roles are fine.
- **Vancouver compatibility** flag in the Location field: `Remote-first (global ✓)` / `Remote (US + Canada ✓)` / `Remote (US only ⚠️)` / `Hybrid ([City] ⚠️)` / `On-site ([City] ⚠️)`

**Skip list — do not add these companies again (applies to ALL tables):**
Cocreate Talent, Daversa, Adverb Ventures, Founder Collective, Casa, Tofu, Ascent Sports Group, Instacart, Microsoft, Cerebras, Artisanal Talent, True, One North Talent, RevenueCat, Babylist, LTV, Move Concierge, Nitra, Lumos, Orbital, RADAR, Armada, CSC Generation, Mecka AI, Luminai, Turn/River, Inspiren, NABIS, Hermeus, Machinify, Runpod, Casper Studios, CharterUP, Corgi Insurance, GoGlobal, Salient, F2, Clio, OpenFX, Dexory, Blackstone (and its portfolio companies, e.g. LivCor/Revantage), Vestiaire Collective, Perry Ellis International, Okta, Shift4, Greenhouse, Engine, Mochi Health, Kontakt.io, Toptal, Transcarent, Kensington Tours, Empower, Pave America, Mintlify, Lightfield, Solstice, Conduct, Vancity, FAR.AI, Affirm, Marqeta, Tigera.

**Note:** being on this skip list does NOT mean every existing record for that company is dead — verify existing records on their own merits per Step 2B.

---

## STEP 4: ADD RESULTS TO THE REPO

1. Call add_repo (owner tkhoojones-cmd, repo talent-board, access push), then clone once: `git clone --depth 1 https://github.com/tkhoojones-cmd/talent-board` (long timeout, one clone only).
2. `jobs.json` = {"updated":..., "jobs":[{id, kind, company, title, location, url, comp, added, status, lastChecked, reason}]}. De-dup: normalize URLs (lowercase scheme+host, strip query params and trailing slash); a candidate is a duplicate if its normalized URL matches any existing job (any status, including closed), or if normalized company+title (lowercase, strip punctuation, collapse whitespace, drop Inc/LLC/Ltd/Corp) matches an existing job that is not closed.
3. New roles that passed Step 3: append {"id": first 10 hex of sha1(url), "kind":"role", "company", "title", "location" (plain text, no symbols), "url": employer link, "comp": or "", "added": today YYYY-MM-DD, "status":"new", "lastChecked":null, "reason":null}. Never change existing jobs.
Commit ('Part 1 intake YYYY-MM-DD'), `git pull --rebase origin main`, `git push origin main`. If the push is rejected, pull --rebase again and retry up to 3 times. The push starts the robot automatically.
Final summary: queries run, candidates found, dropped (and why: aggregator-only, duplicate, filter), added, and whether the push succeeded. Do not create email drafts.

## CHANGE LOG
- 2026-10-08: moved off Airtable; the repo is the database; verification is done by the GitHub Action robot with a real browser (WebFetch/page-render checks proved unreliable: Greenhouse keeps closed job pages up). Search tiers and filters unchanged.
