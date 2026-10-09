---
name: vp-talent-search-part2
description: Daily VP Talent job search, Part 2 of 3 — Tiers 4-6.10 → adds roles with employer links to jobs.json in the talent-board repo.
---
**THIS IS PART 2 OF 3.** Tiers 4, 4A, 4B, 5, 6, 6.5, 6.7, 6.8, 6.10 daily plus 6.6/6.9 on Mon/Thu.

**NEW DATA FLOW (rewritten 2026-10-08, overrides anything below that says otherwise):** Tim has moved off Airtable. The GitHub repo `tkhoojones-cmd/talent-board` is the database for the public board at jobs.soundherald.com. **Never write to or read Airtable.** Wherever the search text below mentions Airtable, the "2026" table, "Next Step", writing records, the Google Sheet, Step 2/2B verification subagents, volatility rules, or a final QA pass, ignore it.

**HOW THE BOARD WORKS NOW:** a GitHub Action runs twice a day. It (1) reads the job feeds of every company listed in `boards.json` and adds any matching VP/Head of People/Talent role itself, then (2) opens every role in a real browser and publishes only the ones that are open. Web search finds roles slowly and misses many, so **YOUR MAIN JOB IS TO FIND COMPANIES THE CRAWL DOESN'T KNOW YET**, plus any role you can link directly.

**YOUR JOB:** (1) run every query below every run, no sampling, using the parallel subagents described in Step 1; (2) from every result that is a VP/Head-of-Talent-or-People-equivalent role (incl. Chief People Officer; Director/Senior Director at large companies per Step 3), do BOTH: (a) record the company so the crawl covers it (Step 4a) and (b) if the result is the employer's OWN posting (greenhouse.io, lever.co, ashbyhq.com, myworkdayjobs.com, smartrecruiters.com, company domain), add the role too (Step 4b). Aggregator/job-board links (Built In and all builtin* sites, The Muse, Remotive, Jobright, LinkedIn, The Ladders, Himalayas, Wellfound, YC, Indeed, Lensa, Jobgether, RemoteRocketship, Hollylist, Zapply, ResumeGeni, RefreshMiami, Communitech, a16z/Quiet, recruiter sites like bhsg/topechelon/jrgpartners/loxo) are never a final link, but the COMPANY they name still goes to Step 4a. Never invent or guess URLs. You do NOT need to prove a role is open; the robot does that. Do not skip any company (there is no skip list).

**COMPLETION GATE:** run all queries via parallel subagents; this is an unattended scheduled run, so do not ask questions. If push fails, say so loudly in the final summary with the exact error.

## STEP 1: MARKET SWEEP — TIER 4 THROUGH TIER 6.10 (70 QUERIES DAILY, +9 MORE ON MON/THU)

### DAY-OF-WEEK CHECK — DO THIS FIRST

Determine today's day of the week (use `mcp__workspace__bash` with `date` or equivalent, in Tim's local timezone if easily available, otherwise UTC is an acceptable approximation for this purpose). **Tier 6.6 and Tier 6.9 run ONLY if today is Monday or Thursday.** On all other days, skip both tiers entirely — do not run their queries, do not write a placeholder, just omit them from Step 1 and from the completion-log count. State clearly in your one-line completion log whether today included Tier 6.6/6.9 or not, e.g. "Part 2 sweep complete: 70/70 active queries run (Tue — Tier 6.6/6.9 skipped, Mon/Thu only)" or "Part 2 sweep complete: 79/79 active queries run (Mon — includes Tier 6.6/6.9)".

### STEP 1 ORCHESTRATION — USE PARALLEL SUBAGENTS, NOT ONE SEQUENTIAL PASS

Dispatch the work to concurrent subagents using the Agent tool, in a **single message containing multiple Agent tool calls**. Use `subagent_type: "general-purpose"` so each has full tool access (WebSearch, web_fetch, in-app Browser).

Split the tiers into these buckets and give each subagent its own Agent call:

- **Bucket C** — Tier 4 + Tier 4A + Tier 4B (queries 57–88, 32 queries) — every day
- **Bucket E** — Tier 5 + Tier 6 (queries 165–184, 20 queries) — every day
- **Bucket F** — Tier 6.5 + Tier 6.7 + Tier 6.8 + Tier 6.10 (queries 185–189, 195–203, 208–216, 18 queries) — every day
- **Bucket F2** — Tier 6.6 + Tier 6.9 (queries 190–194, 204–207, 9 queries) — **Monday and Thursday only**, per the day check above; do not dispatch this bucket on other days

Note the query *numbers* have intentional gaps (89–164 belong to Part 3's Tiers 4C–4R, not this file) — the bucket ranges above are correct as-is.

For each subagent's prompt, include: the exact numbered queries in its bucket (copy them verbatim from the tier definitions below), the skip list (see Step 3), the Browser Tab Hygiene rule above (if it will use the Browser), and this instruction: "Run every query in this list via WebSearch. For each query, report back: the query number, and for any result that looks like a VP/Head-of-Talent-or-People-equivalent role (including Chief People Officer / Chief Talent Officer), report company, job title, URL, location if visible, and comp if visible. Do NOT verify links or write anywhere — just report candidates. End your report with 'Queries run: N/N' confirming you executed every query in the list."

After all subagents return, aggregate every reported candidate, then skip verification (the robot does it) and go straight to Step 3 (filter) and Step 4 (write) yourself, centrally — never let a subagent write to Airtable directly.

Run every active query across all applicable buckets for today. Do not skip any tier or query that's in scope for today's day of week.

### Tier 4 — Big Tech, AI Labs & High-Growth (12 queries)
NOTE: At FAANG-scale companies, Director and Senior Director of Talent/People are VP-equivalent in scope and comp. Include them.

57. `site:careers.google.com "Director" OR "Senior Director" "Talent" OR "People" OR "Recruiting" -"Manager" -"Product Manager"`
58. `site:metacareers.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People" OR "Recruiting"`
59. `site:amazon.jobs "Director" OR "Senior Director" OR "VP" "Talent" OR "People" OR "HR"`
60. `site:jobs.apple.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People" OR "Recruiting"`
61. `site:careers.microsoft.com "Director" OR "Senior Director" OR "Corporate Vice President" "Talent" OR "People" OR "HR"`
62. `site:jobs.netflix.com "VP" OR "Director" OR "Senior Director" "Talent" OR "People" OR "Recruiting"`
63. `OpenAI "VP Talent" OR "VP People" OR "Head of Talent" OR "Head of Recruiting" OR "Director of People" job 2026`
64. `Anthropic OR xAI OR Mistral OR Cohere OR "Scale AI" "VP People" OR "Head of Talent" OR "Director of People" OR "VP Recruiting" job 2026`
65. `"Hugging Face" OR Perplexity OR "Character AI" OR Harvey OR Glean OR Cursor OR Replit "VP People" OR "Head of Talent" OR "Director of People" job 2026`
66. `Notion OR Linear OR Figma OR Miro OR Loom "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
67. `Rippling OR Lattice OR Leapsome OR "15Five" OR Workleap "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
68. `Brex OR Ramp OR Deel OR Remote OR Oyster "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`

### Tier 4A — Top AI & Frontier AI company career pages (10 queries)

69. `site:waymo.com/joinus OR site:aurora.tech/careers OR site:nuro.ai/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
70. `site:inflection.ai/jobs OR site:adept.ai/careers OR site:magic.dev/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
71. `site:writer.com/careers OR site:jasper.ai/careers OR site:moveworks.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
72. `site:groq.com/careers OR site:coreweave.com/careers OR site:lambdalabs.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
73. `site:sambanova.ai/careers OR site:together.ai/jobs OR site:modal.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
74. `site:wandb.ai/company/careers OR site:arize.com/careers OR site:comet.ml/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
75. `site:uipath.com/company/jobs OR site:automationanywhere.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
76. `site:c3.ai/company/careers OR site:datarobot.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
77. `site:gong.io/company/careers OR site:outreach.io/company/careers OR site:salesloft.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
78. `site:figurerobotics.com/careers OR site:1x.tech/careers OR site:covariant.ai/careers OR site:physicalintelligence.company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4B — Consumer, Ecommerce & Search company career pages (10 queries)

79. `site:jobs.spotify.com OR site:careers.tiktok.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People" OR "Recruiting"`
80. `site:snap.com/en-US/jobs OR site:pinterest.com/careers OR site:redditinc.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
81. `site:careers.x.com OR site:jobs.x.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
82. `site:jobs.ebayinc.com OR site:careers.etsy.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
83. `site:careers.wayfair.com OR site:chewy.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
84. `site:uber.com/global/en/careers OR site:lyft.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
85. `site:careers.airbnb.com OR site:careers.booking.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
86. `site:careers.expedia.com OR site:tripadvisor.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
87. `site:careers.doordash.com OR site:grubhub.com/about/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
88. `site:careers.block.xyz OR site:paypal.com/us/webapps/mpp/jobs OR site:klarna.com/careers OR site:affirm.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 5 — VC portfolio job boards (14 queries)

165. `site:jobs.a16z.com OR site:portfoliojobs.a16z.com "VP Talent" OR "VP People" OR "Head of Talent"`
166. `site:jobs.sequoiacap.com OR site:jobs.accel.com "VP Talent" OR "VP People" OR "Head of Talent"`
167. `site:jobs.greylock.com OR site:jobs.benchmark.com "VP Talent" OR "VP People" OR "Head of Talent"`
168. `site:jobs.firstround.com OR site:jobs.indexventures.com "VP Talent" OR "VP People"`
169. `site:jobs.lsvp.com OR site:jobs.bvp.com "VP Talent" OR "VP People" OR "Head of Talent"`
170. `site:jobs.generalcatalyst.com OR site:jobs.ivp.com "VP Talent" OR "VP People" OR "Head of Talent"`
171. `site:jobs.insightpartners.com OR site:jobs.khoslaventures.com "VP Talent" OR "VP People" OR "Head of Talent"`
172. `site:jobs.nea.com OR site:jobs.sparkcapital.com "VP Talent" OR "VP People" OR "Head of Talent"`
173. `site:jobs.felicis.com OR site:jobs.battery.com "VP Talent" OR "VP People" OR "Head of Talent"`
174. `site:jobs.redpoint.com OR site:jobs.emergence.com "VP Talent" OR "VP People" OR "Head of Talent"`
175. `site:jobs.iconiqcapital.com OR site:jobs.ribbitcap.com "VP Talent" OR "VP People" OR "Head of Talent"`
176. `site:jobs.foundersfund.com OR site:jobs.crv.com "VP Talent" OR "VP People" OR "Head of Talent"`
177. `site:jobs.coatue.com OR site:jobs.tigerglobal.com "VP Talent" OR "VP People" OR "Head of Talent"`
178. `site:jobs.softbank.com OR site:ventures.softbank.com "VP Talent" OR "VP People" OR "Head of Talent"`

### Tier 6 — Executive & HR-specific boards (6 queries)

179. `"VP Talent" OR "Head of Talent" OR "VP People" site:ycombinator.com/jobs`
180. `"VP Talent" OR "VP People" OR "Head of Talent" site:jobs.shrm.org`
181. `"VP Talent" OR "Head of Talent" OR "VP People" site:simplyhired.com 2026`
182. `"VP Talent" OR "Head of Talent" OR "VP People" site:lensa.com 2026`
183. `"Director of People" OR "Director of Talent" "venture-backed" OR "Series B" OR "Series C" OR "Series D" 2026`
184. `"VP Talent" OR "Head of Talent" OR "VP People" "remote" OR "distributed" 2026 -site:linkedin.com -site:indeed.com -site:glassdoor.com`

### Tier 6.5 — Executive Search Firm "Current Searches" Boards (5 queries)

185. `"VP Talent" OR "VP People" OR "Head of Talent" OR "Head of People" site:heidrick.com`
186. `"VP Talent" OR "VP People" OR "Head of Talent" OR "Head of People" site:kornferry.com`
187. `"VP Talent" OR "VP People" OR "Head of Talent" OR "Head of People" site:spencerstuart.com`
188. `"VP Talent" OR "VP People" OR "Head of Talent" OR "Head of People" site:russellreynolds.com`
189. `"VP Talent" OR "VP People" OR "Head of Talent" OR "Head of People" site:dhrglobal.com OR site:egonzehnder.com`

### Tier 6.6 — PE-Backed Portfolio Companies (5 queries) — **MONDAY AND THURSDAY ONLY**
NOTE: Blackstone and its portfolio companies remain on the permanent skip list per Step 3.

190. `"Vista Equity Partners" portfolio "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
191. `"Thoma Bravo" portfolio "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
192. `"Silver Lake" portfolio "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
193. `"Francisco Partners" OR "Insight Partners" OR "General Atlantic" portfolio "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
194. `"portfolio company" "VP Talent Acquisition" OR "VP People" OR "Head of Talent" private equity 2026 -site:linkedin.com`

### Tier 6.7 — FastCompany Gap-Fill & Expanded Canadian Tech (4 queries)

195. `Dell OR "Schneider Electric" OR QuickFi "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
196. `Cosm OR Xreal OR Immotion OR XRHealth "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
197. `Cadillac OR Honda OR Toyota OR Baidu "VP People" OR "Head of Talent" OR "Director of Talent" OR "Senior Director" "People" OR "Talent" job 2026`
198. `Faire OR Later OR Thinkific OR Trulioo "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`

### Tier 6.8 — Chief People Officer / Chief Talent Officer Title Variant Sweep (5 queries)

199. `"Chief People Officer" OR "CPO" site:jobs.ashbyhq.com OR site:job-boards.greenhouse.io`
200. `"Chief People Officer" OR "Chief Talent Officer" site:lever.co OR site:jobs.workable.com`
201. `"Chief People Officer" OR "Chief Talent Officer" site:myworkdayjobs.com`
202. `"Chief People Officer" OR "CPO" job 2026 -site:linkedin.com -site:indeed.com startup OR scaleup`
203. `"Chief People Officer" OR "Chief Talent Officer" "Canada" OR "British Columbia" OR "Vancouver" OR "Toronto" 2026`

### Tier 6.9 — Fractional / Interim VP People & Talent (4 queries) — **MONDAY AND THURSDAY ONLY**
NOTE: Flag these distinctly in Notes ("FRACTIONAL/INTERIM") so Tim can evaluate them differently from a permanent VP search.

204. `"Fractional VP People" OR "Fractional Head of Talent" OR "Fractional CPO" OR "Fractional Chief People Officer" job 2026`
205. `"Interim VP People" OR "Interim Head of Talent" OR "Interim CPO" OR "Interim Head of People" job 2026`
206. `"Chief Outsiders" OR "Trusted Talent Advisors" fractional OR interim "VP People" OR "Head of Talent" OR "CPO" 2026`
207. `"fractional executive" OR "interim executive" "People" OR "Talent" OR "HR" leadership startup 2026 -site:linkedin.com`

### Tier 6.10 — Mid-Cap & Late-Stage Pre-IPO Companies (9 queries)
NOTE: Companies large enough to not surface via Ashby/Lever aggregator searches (which skew smaller/earlier) but not famous enough to get caught incidentally by Tier 2's generic Workday search.

208. `Toast OR Confluent OR Gitlab OR HashiCorp OR Instructure "VP People" OR "Head of Talent" OR "Director of Talent" OR "Senior Director" "People" job 2026`
209. `Squarespace OR Weave OR "ZoomInfo" OR "Smartsheet" OR nCino "VP People" OR "Head of Talent" OR "Director of Talent" job 2026`
210. `Klaviyo OR "ServiceTitan" OR Chime OR Fanatics OR Turo "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
211. `Grammarly OR Vercel OR Canva OR Miro OR "Justworks" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
212. `"Procore Technologies" OR "Bill.com" OR Asana OR Box OR "Smartsheet" "Director" OR "Senior Director" OR "VP" "Talent" OR "People" job 2026`
213. `site:toasttab.com/careers OR site:confluent.io/careers OR site:about.gitlab.com/jobs "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
214. `site:squarespace.com/careers OR site:asana.com/jobs OR site:box.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
215. `"mid-cap" OR "Russell 2000" technology company "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
216. `"pre-IPO" OR "IPO-track" "VP People" OR "Head of Talent" OR "VP Talent" OR "Chief People Officer" 2026 -site:linkedin.com`

**Before moving to Step 2, write a one-line completion log** stating the day-of-week, whether Tier 6.6/6.9 ran, and the total: e.g. "Part 2 sweep complete: 70/70 active queries run (Wednesday — Tier 6.6/6.9 skipped per Mon/Thu-only schedule)" or "Part 2 sweep complete: 79/79 active queries run (Monday — includes Tier 6.6/6.9)." If the number falls short of today's actual target, re-dispatch the shortfall bucket(s) to a fresh subagent before proceeding.

---

## STEP 3: FILTER AND EVALUATE

- **Seniority**: VP-level or equivalent Head-of, including Chief People Officer / Chief Talent Officer titles. For **large public companies and Big Tech** (Google, Meta, Amazon, Apple, Microsoft, Netflix, Salesforce, Adobe, Workday, ServiceNow, Shopify, Snowflake, Databricks, Stripe, Okta, Datadog, Cloudflare, HubSpot, Spotify, TikTok, Snap, Airbnb, Uber, eBay, NVIDIA, Qualcomm, CrowdStrike, Palo Alto, Intuit, Oracle, SAP, EA, Palantir, Scale AI, Anduril, Applied Intuition, Cohere, Qualtrics, Medallia, Live Nation, Universal Music Group, Sony Music Entertainment, Warner Music Group, SiriusXM, iHeartMedia, Tesla, General Motors, Ford Motor, Stellantis, Walt Disney, Warner Bros Discovery, Paramount, NBCUniversal, Sony Pictures, Otis Worldwide, CRH, etc.), also include **Director and Senior Director** of Talent/People/Recruiting. **Mid-cap/late-stage pre-IPO companies (Tier 6.10 — Toast, Confluent, Gitlab, HashiCorp, Instructure, Squarespace, Weave, ZoomInfo, Smartsheet, nCino, Klaviyo, ServiceTitan, Chime, Fanatics, Turo, Grammarly, Vercel, Canva, Miro, Justworks, Procore, Bill.com, Asana, Box, etc.) also get the Director/Senior-Director exception** — these companies are large enough that a Director of Talent/People role carries genuine VP-equivalent scope. Smaller private/early-stage companies do NOT get this exception.
- **Comp signal**: Note if listed, in the Comp Range field. Do NOT drop a role solely for lacking a disclosed comp figure.
- **Location filter (hard):** Drop any role explicitly located on-site or hybrid outside the US and Canada. Remote-first/global roles are fine.
- **Vancouver compatibility** flag in the Location field: `Remote-first (global ✓)` / `Remote (US + Canada ✓)` / `Remote (US only ⚠️)` / `Hybrid ([City] ⚠️)` / `On-site ([City] ⚠️)`
- **Fractional/Interim roles (Tier 6.9):** flag clearly in Notes with "FRACTIONAL/INTERIM" as the first word.

**Skip list: none.** Do not skip companies. De-dup only against jobs.json (Step 4). If a company seems unwanted, add it anyway; Tim will say so.

**Note:** being on this skip list does NOT mean every existing record for that company is dead.

---

## STEP 4: RECORD RESULTS IN THE REPO

1. Clone: `git clone --depth 1 https://github.com/tkhoojones-cmd/talent-board` (the repo is public; if `add_repo` exists in this session call it first with access push; if it does not exist, continue anyway). Work inside the clone.
2. **4a. Companies for the crawl.** In `boards.json`: if a result URL is on `job-boards.greenhouse.io/<token>/...` or `boards.greenhouse.io/<token>/...` add `<token>` to `greenhouse`; `jobs.lever.co/<token>/...` to `lever`; `jobs.ashbyhq.com/<token>/...` to `ashby` (skip if already present). For any other company (Workday, company career sites, or only seen on an aggregator), append the plain company name to `candidates` (skip if already in candidates, dead, or any list). The crawl will work out the right job-feed address itself. For Workday links like `https://<tenant>.<wdN>.myworkdayjobs.com/<site>/...` add `{"tenant":"<tenant>","wd":"<wdN>","site":"<site>","company":"<Company>"}` to `workday`. **Also employer-hosted systems:** if a result URL is on `<host>.fa.<region>.oraclecloud.com/hcmUI/CandidateExperience/<lang>/sites/<SITE>/...` add `{"host":"<host>.fa.<region>.oraclecloud.com","site":"<SITE>","company":"<Company>"}` to `boards.json` `oracle`; `<tenant>.taleo.net/careersection/<section>/...` add `{"tenant":"<tenant>","section":"<section>","company":"<Company>"}` to `taleo`; a SuccessFactors career site (`career<N>.successfactors.com/...`, `career<N>.successfactors.eu/...`, or a company jobs site that serves `/job/<Title-Slug>/<id>/` pages and a `/sitemap.xml`) add `{"host":"<that host>","company":"<Company>"}` to `successfactors`. The robot reads these for new roles.
3. **4b. Roles with employer links.** `jobs.json` = {"updated":..., "jobs":[{id, kind, company, title, location, url, comp, added, status, lastChecked, reason}]}. De-dup: canonical key from the URL (Greenhouse job id or `gh_jid`, Lever/Ashby uuid, otherwise the URL without query string); a candidate is a duplicate only if that key matches an existing job that is not closed. Never use company+title alone. Append new ones: {"id": first 10 hex of sha1(url), "kind":"role", "company", "title" (exactly as shown on the employer's page, never guessed), "location" (plain text), "url", "comp": or "", "added": today YYYY-MM-DD, "status":"new", "lastChecked":null, "reason":null}. Never change existing jobs.
4. Commit ('Part N intake YYYY-MM-DD'), `git pull --rebase origin main`, `git push origin main` (retry up to 3 times; on a rebase conflict in a JSON file, re-apply your additions on the latest copy). The push starts the robot.
5. Final summary: queries run, companies added to boards.json/candidates, roles added, roles dropped and why, and whether the push succeeded (exact error if not). Do not create email drafts.

## CHANGE LOG
- 2026-10-08: moved off Airtable; the repo is the database; verification is done by the GitHub Action robot with a real browser (WebFetch/page-render checks proved unreliable: Greenhouse keeps closed job pages up). Search tiers and filters unchanged.
- 2026-10-08 (later): searches now mainly discover companies for the feed crawl (boards.json); roles are added by the crawl and also directly when an employer link is found. Skip list removed.
