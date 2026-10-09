---
name: vp-talent-search-part1
description: Daily VP Talent job search, Part 1 of 3 — Tiers 1-3.6 + Alert Inbox Sweep → adds roles with employer links to jobs.json in the talent-board repo.
---
**THIS IS PART 1 OF 3.** Tiers 1-3.6 + Alert Inbox Sweep.

**NEW DATA FLOW (rewritten 2026-10-08, overrides anything below that says otherwise):** Tim has moved off Airtable. The GitHub repo `tkhoojones-cmd/talent-board` is the database for the public board at jobs.soundherald.com. **Never write to or read Airtable.** Wherever the search text below mentions Airtable, the "2026" table, "Next Step", writing records, the Google Sheet, Step 2/2B verification subagents, volatility rules, or a final QA pass, ignore it.

**HOW THE BOARD WORKS NOW:** a GitHub Action runs twice a day. It (1) reads the job feeds of every company listed in `boards.json` and adds any matching VP/Head of People/Talent role itself, then (2) opens every role in a real browser and publishes only the ones that are open. Web search finds roles slowly and misses many, so **YOUR MAIN JOB IS TO FIND COMPANIES THE CRAWL DOESN'T KNOW YET**, plus any role you can link directly.

**YOUR JOB:** (1) run every query below every run, no sampling, using the parallel subagents described in Step 1; (2) from every result that is a VP/Head-of-Talent-or-People-equivalent role (incl. Chief People Officer; Director/Senior Director at large companies per Step 3), do BOTH: (a) record the company so the crawl covers it (Step 4a) and (b) if the result is the employer's OWN posting (greenhouse.io, lever.co, ashbyhq.com, myworkdayjobs.com, smartrecruiters.com, company domain), add the role too (Step 4b). Aggregator/job-board links (Built In and all builtin* sites, The Muse, Remotive, Jobright, LinkedIn, The Ladders, Himalayas, Wellfound, YC, Indeed, Lensa, Jobgether, RemoteRocketship, Hollylist, Zapply, ResumeGeni, RefreshMiami, Communitech, a16z/Quiet, recruiter sites like bhsg/topechelon/jrgpartners/loxo) are never a final link, but the COMPANY they name still goes to Step 4a. Never invent or guess URLs. You do NOT need to prove a role is open; the robot does that. Do not skip any company (there is no skip list).

**COMPLETION GATE:** run all queries via parallel subagents; this is an unattended scheduled run, so do not ask questions. If push fails, say so loudly in the final summary with the exact error.

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

**Skip list: none.** Do not skip companies. De-dup only against jobs.json (Step 4). If a company seems unwanted, add it anyway; Tim will say so.

**Note:** being on this skip list does NOT mean every existing record for that company is dead — verify existing records on their own merits per Step 2B.

---

## STEP 4: RECORD RESULTS IN THE REPO

1. Clone: `git clone --depth 1 https://github.com/tkhoojones-cmd/talent-board` (the repo is public; if `add_repo` exists in this session call it first with access push; if it does not exist, continue anyway). Work inside the clone.
2. **4a. Companies for the crawl.** In `boards.json`: if a result URL is on `job-boards.greenhouse.io/<token>/...` or `boards.greenhouse.io/<token>/...` add `<token>` to `greenhouse`; `jobs.lever.co/<token>/...` to `lever`; `jobs.ashbyhq.com/<token>/...` to `ashby` (skip if already present). For any other company (Workday, company career sites, or only seen on an aggregator), append the plain company name to `candidates` (skip if already in candidates, dead, or any list). The crawl will work out the right job-feed address itself. For Workday links like `https://<tenant>.<wdN>.myworkdayjobs.com/<site>/...` add `{"tenant":"<tenant>","wd":"<wdN>","site":"<site>","company":"<Company>"}` to `workday`.
3. **4b. Roles with employer links.** `jobs.json` = {"updated":..., "jobs":[{id, kind, company, title, location, url, comp, added, status, lastChecked, reason}]}. De-dup: canonical key from the URL (Greenhouse job id or `gh_jid`, Lever/Ashby uuid, otherwise the URL without query string); a candidate is a duplicate only if that key matches an existing job that is not closed. Never use company+title alone. Append new ones: {"id": first 10 hex of sha1(url), "kind":"role", "company", "title" (exactly as shown on the employer's page, never guessed), "location" (plain text), "url", "comp": or "", "added": today YYYY-MM-DD, "status":"new", "lastChecked":null, "reason":null}. Never change existing jobs.
4. Commit ('Part N intake YYYY-MM-DD'), `git pull --rebase origin main`, `git push origin main` (retry up to 3 times; on a rebase conflict in a JSON file, re-apply your additions on the latest copy). The push starts the robot.
5. Final summary: queries run, companies added to boards.json/candidates, roles added, roles dropped and why, and whether the push succeeded (exact error if not). Do not create email drafts.

## CHANGE LOG
- 2026-10-08: moved off Airtable; the repo is the database; verification is done by the GitHub Action robot with a real browser (WebFetch/page-render checks proved unreliable: Greenhouse keeps closed job pages up). Search tiers and filters unchanged.
- 2026-10-08 (later): searches now mainly discover companies for the feed crawl (boards.json); roles are added by the crawl and also directly when an employer link is found. Skip list removed.
