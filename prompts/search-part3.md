---
name: vp-talent-search-part3
description: Daily VP Talent job search, Part 3 of 3 — Tiers 4C-4R + Senior IC + Recent Hires + Departures + Funding Radar + VC Blog Scan + BetaKit Scan → adds roles and signals to the talent-board repo (jobs.json, signals.json).
---
**THIS IS PART 3 OF 3.** Tiers 4C-4R + Senior IC + Recent Hires + Departures + Funding Radar + VC Blog Scan + BetaKit Scan.

**NEW DATA FLOW (rewritten 2026-10-08, overrides anything below that says otherwise):** Tim has moved off Airtable. The GitHub repo `tkhoojones-cmd/talent-board` is the database for the public board at jobs.soundherald.com. **Never write to or read Airtable.** Wherever the search text below mentions Airtable, the "2026" table, "Next Step", writing records, the Google Sheet, Step 2/2B verification subagents, volatility rules, or a final QA pass, ignore it.

**HOW THE BOARD WORKS NOW:** a GitHub Action runs twice a day. It (1) reads the job feeds of every company listed in `boards.json` and adds any matching VP/Head of People/Talent role itself, then (2) opens every role in a real browser and publishes only the ones that are open. Web search finds roles slowly and misses many, so **YOUR MAIN JOB IS TO FIND COMPANIES THE CRAWL DOESN'T KNOW YET**, plus any role you can link directly.

**YOUR JOB:** (1) run every query below every run, no sampling, using the parallel subagents described in Step 1; (2) from every result that is a VP/Head-of-Talent-or-People-equivalent role (incl. Chief People Officer; Director/Senior Director at large companies per Step 3), do BOTH: (a) record the company so the crawl covers it (Step 4a) and (b) if the result is the employer's OWN posting (greenhouse.io, lever.co, ashbyhq.com, myworkdayjobs.com, smartrecruiters.com, company domain), add the role too (Step 4b). Aggregator/job-board links (Built In and all builtin* sites, The Muse, Remotive, Jobright, LinkedIn, The Ladders, Himalayas, Wellfound, YC, Indeed, Lensa, Jobgether, RemoteRocketship, Hollylist, Zapply, ResumeGeni, RefreshMiami, Communitech, a16z/Quiet, recruiter sites like bhsg/topechelon/jrgpartners/loxo) are never a final link, but the COMPANY they name still goes to Step 4a. Never invent or guess URLs. You do NOT need to prove a role is open; the robot does that. Do not skip any company (there is no skip list).

**COMPLETION GATE:** run all queries via parallel subagents; this is an unattended scheduled run, so do not ask questions. If push fails, say so loudly in the final summary with the exact error.

## STEP 1: MARKET SWEEP — TIER 4C THROUGH TIER 4R (76 ACTIVE QUERIES)

### STEP 1 ORCHESTRATION — USE PARALLEL SUBAGENTS, NOT ONE SEQUENTIAL PASS

Dispatch the work to concurrent subagents using the Agent tool, in a **single message containing multiple Agent tool calls**. Use `subagent_type: "general-purpose"` so each has full tool access (WebSearch, web_fetch, in-app Browser).

Split into these buckets, each its own Agent call:

- **Bucket D1** — Tier 4C through Tier 4M (queries 89–126, 38 queries)
- **Bucket D2** — Tier 4N through Tier 4R (queries 127–164, 38 queries)
- **Bucket G1** — Tier 8 (Senior IC) + Tier 9 (Recent Hires) + Tier 9B (Departures) + Tier 10 (Funding Radar) — all fixed-query WebSearch tiers
- **Bucket G2** — Tier 11 (VC Blog Scan) + Tier 11B (BetaKit Scan) — both fetch-and-extract tiers with capped follow-on careers-page checks

For each Bucket D subagent's prompt, include: the exact numbered queries in its bucket (copy verbatim below), the skip list (see Step 3), the Browser Tab Hygiene rule, and this instruction: "Run every query in this list via WebSearch. For each query, report back: the query number, and for any result that looks like a VP/Head-of-Talent-or-People-equivalent role, report company, job title, URL, location if visible, and comp if visible. Do NOT verify links or write anywhere. End your report with 'Queries run: N/N'."

After all subagents return, aggregate every reported candidate, then skip verification (the robot does it) and go straight to Step 3 (filter) and Step 4 (write) yourself, centrally — never let a subagent write to Airtable directly.

### Tier 4C — Canadian & APAC tech companies (4 queries)

89. `Shopify OR Wealthsimple OR Hootsuite OR Ada OR FreshBooks "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
90. `Navan OR Carta OR Ironclad OR Coda OR Vanta "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
91. `Atlassian OR "Culture Amp" OR SafetyCulture OR Xero OR Canva "VP People" OR "Head of Talent" OR "Director of People" job 2026`
92. `"Stability AI" OR Runway OR ElevenLabs OR Pika OR Ideogram "VP People" OR "Head of Talent" OR "Director of People" job 2026`

### Tier 4D — Cybersecurity company career pages (3 queries)

93. `site:careers.crowdstrike.com OR site:careers.paloaltonetworks.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
94. `site:fortinet.com/corporate/about-us/careers OR site:zscaler.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
95. `site:sentinelone.com/company/careers OR site:tenable.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4E — Semiconductor company career pages (3 queries)

96. `site:nvidia.com/en-us/about-nvidia/careers OR site:amd.com/en/corporate/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
97. `site:qualcomm.com/company/careers OR site:broadcom.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
98. `site:intel.com/jobs OR site:micron.com/about/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4F — Enterprise SaaS / Cloud company career pages (3 queries)

99. `site:oracle.com/corporate/careers OR site:sap.com/about/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
100. `site:intuit.com/company/careers OR site:veeva.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
101. `site:mongodb.com/company/careers OR site:confluent.io/careers OR site:atlassian.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4G — Healthtech company career pages (3 queries)

102. `site:epic.com/about-epic/careers OR site:doximity.com/about/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
103. `site:teladoc.com/about/careers OR site:privia.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
104. `site:hims.com/pages/careers OR site:oscar.com/careers OR site:alignmenthealthcare.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4H — Fintech company career pages (2 queries)

105. `site:coinbase.com/careers OR site:robinhood.com/us/en/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
106. `site:adyen.com/en/careers OR site:toast.com/careers OR site:marqeta.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4I — Gaming & Entertainment company career pages (2 queries)

107. `site:ea.com/careers OR site:take2games.com/career "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
108. `site:riotgames.com/en/work-with-us OR site:epicgames.com/site/en-US/careers OR site:roblox.com/corp/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4J — HR Tech company career pages (2 queries)

109. `site:adp.com/careers OR site:ceridian.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
110. `site:paylocity.com/about/careers OR site:paycom.com/about/careers OR site:gusto.com/about/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4K — Marketing & Sales Tech company career pages (2 queries)

111. `site:sprinklr.com/careers OR site:amplitude.com/careers OR site:braze.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
112. `site:zoominfo.com/about/careers OR site:6sense.com/about/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4L — Consumer / Media / Logistics company career pages (3 queries)

113. `site:discord.com/jobs OR site:duolingo.com/careers OR site:peloton.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
114. `site:turo.com/careers OR site:bumble.com/careers OR site:match.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
115. `site:flexport.com/careers OR site:samsara.com/company/careers OR site:motive.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4M — MAD Landscape gaps: AI/data companies (11 queries)

116. `"Scale AI" OR Cohere OR "AI21 Labs" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" OR "VP Recruiting" job 2026`
117. `Palantir OR Anduril OR "Shield AI" OR "Vannevar Labs" OR Helsing "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
118. `"Applied Intuition" OR Skydio OR "Joby Aviation" OR Nuro OR Zoox "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
119. `Pinecone OR Weaviate OR Chroma OR Qdrant OR Zilliz "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
120. `Harvey OR Casetext OR Ironclad OR Regrello OR Klarity "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
121. `Visier OR "eightfold.ai" OR Eightfold OR Beamery "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
122. `Dataiku OR Collibra OR Alation OR "H2O.ai" "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
123. `"Sierra AI" OR Intercom OR Cresta OR Forethought OR "Maven AGI" "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
124. `site:scale.com/careers OR site:cohere.com/about/careers OR site:mistral.ai/jobs "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
125. `site:palantir.com/careers OR site:anduril.com/careers OR site:shieldai.com/about/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
126. `site:visier.com/about/careers OR site:eightfold.ai/careers OR site:beamery.com/careers OR site:dataiku.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4N — HR & Talent Tech platforms as employers (8 queries)
NOTE: These are companies Tim could work FOR — their products are in HR/recruiting, making his background uniquely relevant.

127. `BambooHR OR Personio OR HiBob OR "Phenom People" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
128. `SeekOut OR Findem OR Paradox OR Gem OR Beamery "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
129. `Checkr OR HireVue OR Karat OR "Modern Hire" OR Crosschq "VP People" OR "Head of Talent" OR "VP Talent" job 2026`
130. `Qualtrics OR Medallia OR Glint OR "Peakon" OR "Worklytics" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
131. `"iCIMS" OR SmartRecruiters OR Jobvite OR "Employ Inc" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of Talent" job 2026`
132. `site:bamboohr.com/careers OR site:personio.com/jobs OR site:hibob.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
133. `site:seekout.com/careers OR site:paradox.ai/careers OR site:gem.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`
134. `site:checkr.com/company/careers OR site:hirevue.com/company/careers OR site:karat.com/company/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4O — Music Industry (4 queries)
NOTE: Tim has specific interest in music. Spotify and TikTok are already covered in Part 2's Tier 4B.

135. `"Universal Music Group" OR "Sony Music" OR "Warner Music Group" OR "Warner Music" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
136. `SoundCloud OR Bandcamp OR Splice OR Beatport OR "Believe Music" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
137. `"Live Nation" OR "AEG Presents" OR Ticketmaster OR "SiriusXM" OR "iHeartMedia" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
138. `site:livenationentertainment.com/career OR site:siriusxm.com/careers OR site:iheartmedia.com/careers "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4P — Automotive & EV (3 queries)
NOTE: Tim has specific interest in automotive. EV/AV companies (Waymo, Aurora, Nuro, Zoox, Applied Intuition, Joby) are already covered in Part 2's Tier 4A and this file's Tier 4M. Legacy non-EV OEMs (Cadillac, Honda, Toyota) are covered in Part 2's Tier 6.7. This tier adds pure EV OEMs and traditional auto not covered elsewhere.

139. `Tesla OR Rivian OR "Lucid Motors" OR Canoo OR Fisker "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
140. `"General Motors" OR "Ford Motor" OR Stellantis OR Volkswagen OR BMW "VP People" OR "Head of Talent" OR "Director of Talent" OR "Senior Director" "People" OR "Talent" job 2026`
141. `site:tesla.com/careers OR site:rivian.com/careers OR site:lucidmotors.com/jobs "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4Q — Film & Entertainment (3 queries)
NOTE: Tim has specific interest in film. Netflix is already covered in Part 2's Tier 4.

142. `"Walt Disney" OR "Warner Bros" OR Paramount OR "Sony Pictures" OR NBCUniversal "VP People" OR "Head of Talent" OR "Director of Talent" OR "Senior Director" "People" OR "Talent" job 2026`
143. `A24 OR Lionsgate OR "Apple TV+" OR "Amazon Studios" OR Hulu "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
144. `site:careers.disney.com OR site:warnerbroscareers.com OR site:paramountcareers.com "Director" OR "Senior Director" OR "VP" "Talent" OR "People"`

### Tier 4R — GFD Tech 100 high-growth companies (20 queries)
NOTE: Companies from the GFD Tech 100 Q3 2026 ranking not already covered by earlier tiers. Runpod, RADAR, and Armada are on the permanent skip list.

145. `AppsFlyer OR Suno OR Aligned OR Cosm "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
146. `"Twelve Labs" OR Achieve OR Baseten OR Saronic "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
147. `Cognition OR Pocket OR NinjaOne OR Mercury "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
148. `Quince OR Sierra OR Warp OR Redo "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
149. `Kraken OR Higharc OR AlphaSense OR SandboxAQ "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
150. `WHOOP OR LeapXpert OR Cloaked OR Ripple "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
151. `Anysphere OR Cyera OR "Eight Sleep" OR Allium "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
152. `Octane OR Taktile OR Stepful OR Quantifind "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
153. `Whop OR "Upscale AI" OR "Assort Health" OR Chronograph "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
154. `Musely OR Attention OR Exa OR Qolab "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
155. `OpenRouter OR Stord OR Skims OR "Peregrine Technologies" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
156. `"Digital Asset" OR Turnout OR Decart OR "Kin Insurance" "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
157. `"Bland AI" OR "Impulse Space" OR "Flock Safety" OR Sardine "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
158. `"Clear Street" OR PsiQuantum OR Vapi OR Kalshi "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
159. `"Luma AI" OR TensorWave OR Honeycomb OR Parallel "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
160. `"Grow Therapy" OR Verse OR VoltaGrid OR Crusoe "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
161. `"VAST Data" OR "Onyx Odds" OR Factory OR Niural "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
162. `Collate OR Vercel OR "Fora Financial" OR Orderful "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
163. `Amca OR Novellia OR ClickHouse OR Solace "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`
164. `"Atom Computing" OR Apex OR Imprint OR Commure OR fomo "VP People" OR "Head of Talent" OR "VP Talent" OR "Director of People" job 2026`

**Before moving to Step 2, write a one-line completion log**, e.g.: "Part 3 sweep complete: 76/76 active queries run (Tiers 4C-4R, via 2 parallel subagents), plus Tier 8 Senior IC sweep, Tier 9 Recent Hires sweep, Tier 9B Departure Signals sweep, Tier 10 Funding Round Radar, Tier 11 VC Funding Blog Scan, and Tier 11B BetaKit Scan below." If the number is not 76, re-dispatch the shortfall bucket(s) to a fresh subagent before proceeding.

---

## TIER 8 — SENIOR IC TALENT/RECRUITING SWEEP ($300K+, separate table) — MANDATORY, RUN EVERY DAY

Tim also wants senior **individual-contributor** (non-manager) roles in the talent/recruiting space — e.g. Executive Recruiter, Principal Recruiter, Staff Technical Recruiter, Principal Talent Partner — filtered to roles where total comp (base + equity/bonus) is credibly $300K+. This is realistic mainly at elite AI labs, top-tier late-stage startups, mid-cap/late-stage pre-IPO companies, and a handful of public tech companies with very rich equity — most IC recruiting roles do not clear this bar, so it's normal for this tier to sometimes come back empty. Empty is a valid, honest result — do not stretch or force lower-comp roles in to fill the table.

Run these queries:

201. `"Executive Recruiter" OR "Principal Recruiter" OR "Principal Talent Partner" OR "Staff Technical Recruiter" OpenAI OR Anthropic OR "Scale AI" OR Anduril OR Palantir OR Mistral OR "Safe Superintelligence" job 2026`
202. `"Executive Recruiter" OR "Principal Recruiter" site:jobs.ashbyhq.com OR site:job-boards.greenhouse.io OR site:jobs.lever.co`
203. `"Executive Recruiter" OR "Head of Executive Search" Databricks OR Snowflake OR Stripe OR Ramp OR Coinbase OR Robinhood job 2026`
204. `"Technical Recruiter" OR "Executive Recruiter" compensation "$300,000" OR "$300K" OR "$350K" 2026`
205. `"Principal Executive Recruiter" OR "Executive Recruiting Lead" OR "Principal, Executive Recruiting" site:jobs.lever.co OR site:job-boards.greenhouse.io OR site:jobs.ashbyhq.com` (companies like Zoox, Whoop, Ro, Jerry have posted these — check comp bands carefully; e.g. Zoox's posting explicitly listed $185K-$309K)
206. `"Executive Recruiter" OR "Principal Recruiter" OR "Staff Technical Recruiter" Toast OR Confluent OR Gitlab OR HashiCorp OR Klaviyo OR "ServiceTitan" OR Grammarly OR Vercel OR Canva job 2026` (mirrors Part 2's Tier 6.10 mid-cap/late-stage pre-IPO gap-fix)
207. `"Executive Recruiter" OR "Principal Recruiter" OR "Head of Talent Acquisition" Shopify OR Wealthsimple OR "Culture Amp" OR Hootsuite Canada job 2026` (Canadian coverage given Tim's Vancouver base)

For each candidate: verify comp is credibly $300K+ total before adding — if comp isn't disclosed and can't be reasonably inferred to clear $300K, drop it rather than guess. Apply the same permanent skip list to this tier too.

Write verified Tier 8 results to the **"Senior IC - Talent"** table (see field mapping in STEP 4 below).

---

## TIER 9 — RECENT VP TALENT ACQUISITION HIRES ("who just moved, and is their old seat open?") — MANDATORY, RUN EVERY DAY

Tim wants to track people who have recently publicly taken a new VP Talent Acquisition / Head of Talent / VP People role, so he can check whether their PREVIOUS company now has an open seat to backfill them.

**Known limitation, be upfront about it:** General web search is unreliable at filtering to an exact 7-day window. Do your best, but always report honestly if you can't confirm the exact announcement date rather than guessing or fabricating one. An approximate date clearly labeled as approximate is fine; a fabricated precise date is not.

Run these queries:

301. `"joins as" OR "has joined" "VP of Talent Acquisition" OR "Head of Talent Acquisition" OR "VP Talent Acquisition" 2026`
302. `"thrilled to announce" OR "excited to share" "VP" OR "Head of" "Talent Acquisition" new role 2026`
303. `"people moves" OR "executive appointment" HR talent acquisition 2026` — **before running, substitute the actual current month name into the query** (e.g. "August 2026") in place of a generic year-only query; do not run this query with a literal `[current month]` placeholder still in it.

For each real hire found: identify (a) person's name, (b) new company + new title, (c) previous company + title, (d) announcement date (label if approximate), (e) source link, (f) a one-line note on why the previous company might now have an opening. Do not fabricate any field. Do not add a hire without a real source link.

Write results to the **"Recent VP TA Hires"** table (see field mapping in STEP 4 below).

**Feeds Departure Signals too:** every hire found here where a Previous Company was identified is itself a departure signal. Pass every (Person, Previous Company, Previous Title) triple into TIER 9B below.

---

## TIER 9B — DEPARTURE SIGNALS / BACKFILL WATCH LIST — MANDATORY, RUN EVERY DAY

This tier builds a running watch list of companies that may need to post a VP Talent/People backfill. Two mandatory input sources:

1. **Explicit departure posts** (queries 401-402 below).
2. **Implicit departure signals from Tier 9** — every "just started a new role" hire found above where a Previous Company was identified.

Run these queries for the explicit-departure half:

401. `"stepping down" OR "moving on" OR "next chapter" OR "excited for what's next" "VP Talent Acquisition" OR "Head of Talent" OR "VP People" OR "VP of People" 2026`
402. `"after" "years" "my last day" OR "farewell" "VP Talent" OR "Head of Talent" OR "VP People" 2026`

For the implicit half, no new searches needed — reuse Tier 9's findings.

Same honesty rule as Tier 9 for dates. Write results to the **"Departure Signals"** table (see field mapping in STEP 4 below). De-dup by Person — don't add a duplicate if they already have a record.

---

## TIER 10 — FUNDING ROUND RADAR (prospecting targets, NOT confirmed job openings) — MANDATORY, RUN EVERY DAY

Companies that just raised a Series C/D/E round often scale their people function within 1-3 months. This tier surfaces proactive outreach targets — never present results here to Tim as roles he can apply to.

Run these queries:

501. `"raises Series C" OR "raises Series D" OR "raises Series E" OR "closes Series C" funding 2026 startup technology`
502. `site:techcrunch.com "Series C" OR "Series D" OR "Series E" funding 2026`
503. `"announces $" million OR billion Series C OR Series D funding round 2026 technology`

For each company found, do a quick secondary check for whether they already have someone in a VP Talent/People/Head of People seat. Mark Y/N/Unknown. Before adding, also check whether the company already has a live role tracked on the "2026" table (via `list_records_for_table`) — if so, mark Y and skip. Only worth including if N or Unknown.

**Secondary-check cap (credit control):** the three queries above can return more freshly-funded companies than is worth a full secondary check every day. Rank all companies found today by funding amount (largest round first) and run the secondary "already has VP People?" check on **at most the top 15**. For any company beyond the top 15, skip the secondary check and log it directly to "Funding Targets" with a note "Unchecked (cap reached)" in Notes rather than leaving it out entirely — this way nothing found is silently dropped, only the deeper check is deferred. Note the cap and how many companies were capped in your final summary.

Write results to the **"Funding Targets"** table (see field mapping in STEP 4 below).

---

## TIER 11 — VC FUNDING BLOG SCAN (medium.com/@vcnewsfr) — MANDATORY, RUN EVERY DAY

TheVCNotebook (medium.com/@vcnewsfr) posts periodic funding roundups. Freshly-funded companies often haven't posted a Talent/People leadership opening yet but are about to, or already have one that hasn't hit mainstream job boards.

Steps:
1. Fetch `https://medium.com/@vcnewsfr` and identify the 2 most recent posts (blog posts roughly every 2-6 weeks; de-dup handles overlap).
2. Open each post and extract every company mentioned as having raised a round (name, round, amount, valuation, HQ).
3. **Careers-page check cap (credit control):** if the combined post(s) mention more than 10 companies total, rank them by funding amount and only run the per-company careers-page check (step 4 below) on the **top 10**. For companies beyond the cap, log them directly to "Funding Targets" with Notes "Unchecked (cap reached) — from medium.com/@vcnewsfr" so they're captured for a future pass rather than dropped. Note the cap and how many companies were capped in your final summary.
4. For each company within the cap, check its careers/jobs page for an open Head of Talent / VP Talent / Head of People / VP People / VP Talent Acquisition role. Actually check each company's careers page before moving on, don't just list companies from the post.
5. If a matching role exists, verify it's live per the STEP 2 gate below, then add it to the "2026" table — in Notes, lead with "Found via new source: medium.com/@vcnewsfr (VC funding blog)" followed by funding details. Apply the same skip list and de-dup rules, plus the Date Added logic in Step 4.
6. If a company has funding but no matching role, don't add it to "2026" — optionally log it in "Funding Targets" instead.
7. Large/well-known companies (Ramp, Supabase, Anduril, etc.) usually already have an established People function — a quick careers-board check is enough; don't force a match if the only open roles are sub-VP.

---

## TIER 11B — BETAKIT SCAN (betakit.com) — MANDATORY, RUN EVERY DAY

BetaKit is Canada's leading startup/tech news outlet, covering Canadian tech funding rounds, executive hires/departures, and company news that general search and the existing VC blog scan (Tier 11, US-centric) don't reliably surface. This tier is modeled directly on Tier 11 but scoped to Canadian companies, which is a genuine gap given Tim's Vancouver base and stated interest in Canadian opportunities.

Steps:
1. Fetch `https://betakit.com` and identify recent funding-announcement and executive-hire/departure articles (check the last ~7 days of posts; BetaKit posts more frequently than the VC blog in Tier 11, so a shorter window is appropriate).
2. Extract every company mentioned as having raised a round, or as having hired/lost a senior People/Talent/HR executive (name, round/signal, amount if applicable, HQ).
3. **Careers-page check cap (credit control, mirrors Tier 11):** if more than 10 companies are found in the window, rank by funding amount (or recency for hire/departure signals) and only run the per-company careers-page check on the **top 10**. Companies beyond the cap get logged directly to "Funding Targets" with Notes "Unchecked (cap reached) — from betakit.com" rather than dropped.
4. For each company within the cap that shows a funding signal, check its careers/jobs page for an open Head of Talent / VP Talent / Head of People / VP People / VP Talent Acquisition role, same as Tier 11 step 4.
5. If a matching live role exists, verify it per the STEP 2 gate below, then add it to the "2026" table — in Notes, lead with "Found via new source: betakit.com (Canadian tech news)" followed by funding/signal details. Apply the same skip list and de-dup rules, plus the Date Added logic in Step 4.
6. If a company has a funding signal but no matching role, log it in "Funding Targets" instead (Notes: "via betakit.com").
7. For hire/departure signals (an article naming someone who just took or left a VP/Head of People-type role at a Canadian company), route these into Tier 9 / Tier 9B's tables instead of "2026" or "Funding Targets" — same fields and honesty-on-dates rule as those tiers apply (do not fabricate a precise date if the article is vague).
8. If BetaKit has no relevant articles in the window, that's a valid, honest empty result — say so plainly, same as Tier 11.

---

## STEP 3: FILTER AND EVALUATE

- **Seniority**: VP-level or equivalent Head-of. For **large public companies and Big Tech** (Google, Meta, Amazon, Apple, Microsoft, Netflix, Salesforce, Adobe, Workday, ServiceNow, Shopify, Snowflake, Databricks, Stripe, Okta, Datadog, Cloudflare, HubSpot, Spotify, TikTok, Snap, Airbnb, Uber, eBay, NVIDIA, Qualcomm, CrowdStrike, Palo Alto, Intuit, Oracle, SAP, EA, Palantir, Scale AI, Anduril, Applied Intuition, Cohere, Qualtrics, Medallia, Live Nation, Universal Music Group, Sony Music Entertainment, Warner Music Group, SiriusXM, iHeartMedia, Tesla, General Motors, Ford Motor, Stellantis, Walt Disney, Warner Bros Discovery, Paramount, NBCUniversal, Sony Pictures, Otis Worldwide, CRH, etc.), also include **Director and Senior Director** of Talent/People/Recruiting. Smaller private companies do NOT get this exception — only true VP+ titles qualify there.
- **Comp signal**: Note if listed, in Comp Range. Flag high-value roles.
- **Location filter (hard):** Drop any role explicitly on-site or hybrid outside the US and Canada. Remote-first/global roles are fine.
- **Vancouver compatibility** flag in Location: `Remote-first (global ✓)` / `Remote (US + Canada ✓)` / `Remote (US only ⚠️)` / `Hybrid ([City] ⚠️)` / `On-site ([City] ⚠️)`

**Skip list: none.** Do not skip companies. De-dup only against jobs.json (Step 4). If a company seems unwanted, add it anyway; Tim will say so.

**Note:** being on this skip list does NOT mean every existing record for that company is dead — verify on its own merits.

---

## STEP 4: RECORD RESULTS IN THE REPO

1. Clone: `git clone --depth 1 https://github.com/tkhoojones-cmd/talent-board` (the repo is public; if `add_repo` exists in this session call it first with access push; if it does not exist, continue anyway). Work inside the clone.
2. **4a. Companies for the crawl.** In `boards.json`: if a result URL is on `job-boards.greenhouse.io/<token>/...` or `boards.greenhouse.io/<token>/...` add `<token>` to `greenhouse`; `jobs.lever.co/<token>/...` to `lever`; `jobs.ashbyhq.com/<token>/...` to `ashby` (skip if already present). For any other company (Workday, company career sites, or only seen on an aggregator), append the plain company name to `candidates` (skip if already in candidates, dead, or any list). The crawl will work out the right job-feed address itself. For Workday links like `https://<tenant>.<wdN>.myworkdayjobs.com/<site>/...` add `{"tenant":"<tenant>","wd":"<wdN>","site":"<site>","company":"<Company>"}` to `workday`. **Also employer-hosted systems:** if a result URL is on `<host>.fa.<region>.oraclecloud.com/hcmUI/CandidateExperience/<lang>/sites/<SITE>/...` add `{"host":"<host>.fa.<region>.oraclecloud.com","site":"<SITE>","company":"<Company>"}` to `boards.json` `oracle`; `<tenant>.taleo.net/careersection/<section>/...` add `{"tenant":"<tenant>","section":"<section>","company":"<Company>"}` to `taleo`; a SuccessFactors career site (`career<N>.successfactors.com/...`, `career<N>.successfactors.eu/...`, or a company jobs site that serves `/job/<Title-Slug>/<id>/` pages and a `/sitemap.xml`) add `{"host":"<that host>","company":"<Company>"}` to `successfactors`. The robot reads these for new roles.
3. **4b. Roles with employer links.** `jobs.json` = {"updated":..., "jobs":[{id, kind, company, title, location, url, comp, added, status, lastChecked, reason}]}. De-dup: canonical key from the URL (Greenhouse job id or `gh_jid`, Lever/Ashby uuid, otherwise the URL without query string); a candidate is a duplicate only if that key matches an existing job that is not closed. Never use company+title alone. Append new ones: {"id": first 10 hex of sha1(url), "kind":"role", "company", "title" (exactly as shown on the employer's page, never guessed), "location" (plain text), "url", "comp": or "", "added": today YYYY-MM-DD, "status":"new", "lastChecked":null, "reason":null}. Never change existing jobs.
4. **Part 3 extras.** Tier 8 Senior IC roles: same job record but "kind":"ic". `signals.json` = {"moves":[{kind:"Hired"|"Left", company, title, url, added}], "funding":[{company, round, amount, url, added}]}. Tier 9 (recent VP TA hires) -> moves with kind "Hired" (title = new hire title); Tier 9B (departures) -> moves with kind "Left"; Tiers 10/11/11B (funding) -> funding. De-dup moves by company+title+kind and funding by company+round; keep the source URL and a real date (never invent dates); drop entries older than 120 days. Also commit signals.json. The crawl automatically treats every company in signals.json as a company to find job feeds for, so newly funded companies get checked for people/talent leadership roles.
5. Commit ('Part 3 intake YYYY-MM-DD'), `git pull --rebase origin main`, `git push origin main` (retry up to 3 times; on a rebase conflict in a JSON file, re-apply your additions on the latest copy). The push starts the robot.
5. Final summary: queries run, companies added to boards.json/candidates, roles added, roles dropped and why, and whether the push succeeded (exact error if not). Do not create email drafts.

## CHANGE LOG
- 2026-10-08: moved off Airtable; the repo is the database; verification is done by the GitHub Action robot with a real browser (WebFetch/page-render checks proved unreliable: Greenhouse keeps closed job pages up). Search tiers and filters unchanged.
- 2026-10-08 (later): searches now mainly discover companies for the feed crawl (boards.json); roles are added by the crawl and also directly when an employer link is found. Skip list removed.
