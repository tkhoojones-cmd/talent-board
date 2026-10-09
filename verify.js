// Opens every candidate listing in a real headless browser, like a visitor would,
// and publishes only the ones that are clearly still open.
const { chromium } = require("playwright");
const fs = require("fs");
const { isNA, TOPIC, normTitle, wanted } = require("./lib");

const CLOSED = /no longer (available|accepting|open|active|posted|listed|hiring)|(position|job|role|posting|opening|requisition|opportunity)( has been| is| was)? (filled|closed|removed|expired|unavailable|no longer|cancelled|canceled)|this (job|position|posting|role|opportunity) (has|is|isn.t)( been)? (expired|closed|removed|filled|available|open)|page (you are looking for )?(doesn.t|does not) exist|we couldn.t find|couldn.t find that|sorry,? (but )?(the|this) (job|page|position)|job not found|has expired|not (currently )?accepting (new )?applications|applications? (are|is) (now )?closed|applications are no longer being accepted|deadline (has|had) passed|position (is )?(on hold|paused)/i;

const idFrom = (url) => { const m = url.match(/\/jobs\/(\d+)/) || url.match(/lever\.co\/[^/]+\/([0-9a-f-]{36})/i) || url.match(/_(R-?\d+[\w-]*)/); return m ? m[1] : null; };
const lastSeg = (url) => { try { return new URL(url).pathname.replace(/\/+$/, "").split("/").pop().toLowerCase(); } catch { return ""; } };
const squash = (t) => normTitle(t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function findLocation(page) {
  try {
    return await page.evaluate(() => {
      const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
      for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const j = JSON.parse(el.textContent);
          const items = Array.isArray(j) ? j : (j["@graph"] || [j]);
          for (const it of items) if (it && it["@type"] === "JobPosting") {
            const locs = [].concat(it.jobLocation || []);
            const parts = locs.map((l) => { const a = (l && l.address) || {}; return [a.addressLocality, a.addressRegion, a.addressCountry && (a.addressCountry.name || a.addressCountry)].filter(Boolean).join(", "); }).filter(Boolean);
            if (parts.length) return clean(parts.join(" / "));
            if (it.jobLocationType === "TELECOMMUTE") return "Remote";
          }
        } catch (e) {}
      }
      for (const sel of ['[data-automation-id="locations"]', ".job__location", ".posting-categories .location", ".location", '[class*="location" i]']) {
        const e = document.querySelector(sel);
        if (e && clean(e.innerText).length > 1 && clean(e.innerText).length < 160) return clean(e.innerText);
      }
      return "";
    });
  } catch (e) { return ""; }
}
async function findTitle(page) {
  try {
    return await page.evaluate(() => {
      const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
      for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
        try { const j = JSON.parse(el.textContent); const items = Array.isArray(j) ? j : (j["@graph"] || [j]); for (const it of items) if (it && it["@type"] === "JobPosting" && it.title) return clean(it.title); } catch (e) {}
      }
      const h1 = document.querySelector("h1"); if (h1 && clean(h1.innerText).length > 2) return clean(h1.innerText);
      const og = document.querySelector('meta[property="og:title"]'); if (og && og.content) return clean(og.content);
      return clean(document.title);
    });
  } catch (e) { return ""; }
}
async function findOrg(page) {
  try {
    return await page.evaluate(() => {
      for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
        try { const j = JSON.parse(el.textContent); const items = Array.isArray(j) ? j : (j["@graph"] || [j]);
          for (const it of items) if (it && it["@type"] === "JobPosting" && it.hiringOrganization) { const o = it.hiringOrganization; const n = typeof o === "string" ? o : o.name; if (n && n.length < 60) return n.trim(); } } catch (e) {}
      }
      const og = document.querySelector('meta[property="og:site_name"]'); return og && og.content && og.content.length < 60 ? og.content.trim() : "";
    });
  } catch (e) { return ""; }
}
async function validThroughPast(page) {
  try {
    return await page.evaluate(() => {
      for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
        try { const j = JSON.parse(el.textContent); const items = Array.isArray(j) ? j : (j["@graph"] || [j]);
          for (const it of items) if (it && it["@type"] === "JobPosting" && it.validThrough) { const d = Date.parse(it.validThrough); if (d && d < Date.now() - 864e5) return it.validThrough; } } catch (e) {}
      }
      return "";
    });
  } catch (e) { return ""; }
}
const STOP = new Set(["of","and","the","a","for","to","in","at","head","vp","vice","president","senior","sr"]);
const toks = (t) => squash(t).split(" ").filter((w) => w && !STOP.has(w));
function titleAgrees(recorded, onPage) {
  const a = toks(recorded), b = new Set(toks(onPage));
  if (!a.length) return true;
  return a.filter((w) => b.has(w)).length >= Math.ceil(a.length / 2);
}

// Negative evidence only: an ATS API saying "gone" is definitive; "found" proves nothing.
async function apiGone(url) {
  const get = async (u) => { try { const c = new AbortController(); setTimeout(() => c.abort(), 15000); return await fetch(u, { signal: c.signal }); } catch (e) { return null; } };
  let m;
  if ((m = url.match(/^https:\/\/(?:job-boards|boards)\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/))) { const r = await get(`https://boards-api.greenhouse.io/v1/boards/${m[1]}/jobs/${m[2]}`); return !!r && r.status === 404; }
  if ((m = url.match(/^https:\/\/jobs\.lever\.co\/([^/]+)\/([0-9a-f-]{36})/i))) { const r = await get(`https://api.lever.co/v0/postings/${m[1]}/${m[2]}`); return !!r && r.status === 404; }
  return false;
}

const APPLY = /^\s*(apply\b[\w\s]{0,40}|submit( your)? application|easy apply)\s*$/i;
async function hasApply(page) {
  for (const f of page.frames()) {
    try {
      const n = await f.locator("a:visible, button:visible, [role=button]:visible, input[type=submit]:visible").filter({ hasText: APPLY }).count();
      if (n) return true;
      const n2 = await f.locator('input[type=submit][value*="pply" i], [aria-label*="apply" i]:visible').count();
      if (n2) return true;
    } catch (e) {}
  }
  return false;
}

// returns [state, why, location, pageTitle, definitive]
async function check(ctx, url, rec) {
  const page = await ctx.newPage();
  try {
    let resp;
    try { resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }); }
    catch (e) { return ["unverifiable", "page did not load: " + e.message.slice(0, 80)]; }
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const final = page.url();
    const status = resp ? resp.status() : 0;
    if (status === 410) return ["closed", "HTTP 410", "", "", true];
    if (status === 404) return ["closed", "HTTP 404", "", "", await apiGone(url)];
    if (status >= 400) return ["unverifiable", "HTTP " + status];
    if (/[?&]error=true/.test(final)) return ["closed", "redirected to board with error=true", "", "", true];
    const id = idFrom(url);
    if (id && !final.toLowerCase().includes(String(id).toLowerCase())) return ["closed", "redirected away from the job: " + final.slice(0, 100), "", "", false];
    const text = (await page.evaluate(() => document.body ? document.body.innerText : "")) || "";
    const head = text.slice(0, 2500);
    if (CLOSED.test(head)) return ["closed", "page says: " + (head.match(CLOSED) || [""])[0], "", "", false];
    const past = await validThroughPast(page);
    if (past) return ["closed", "posting's validThrough date has passed: " + past, "", "", false];
    const pt = await findTitle(page);
    if (rec && rec.titleFromSlug && pt) { if (wanted(pt)) { rec.title = pt; delete rec.titleFromSlug; } else return ["unverifiable", "page title does not look like the role: " + pt.slice(0, 80)]; }
    // positive evidence: the employer's own job feed lists this role today AND the page shows the role's title
    const feedOk = rec && rec.inFeed === new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" }) && rec.title && squash(text).includes(squash(rec.title));
    if (!id) {
      const a = lastSeg(url), b = lastSeg(final);
      if (a && a !== b && !feedOk && !/[?&]gh_jid=\d+/.test(url)) return ["unverifiable", "redirected to a different page: " + final.slice(0, 100)];
      if (/[?&]gh_jid=(\d+)/.test(url) && !feedOk && !final.includes(url.match(/gh_jid=(\d+)/)[1])) return ["unverifiable", "embedded job page lost its job id: " + final.slice(0, 100)];
    }
    if (text.length < 400 && !feedOk) return ["unverifiable", "page had almost no text (blocked or not rendered)"];
    const apply = await hasApply(page);
    if (!apply && !feedOk) return ["unverifiable", "no Apply control found"];
    if (rec && rec.title && !pt && !feedOk) return ["unverifiable", "could not read the job title from the page"];
    if (rec && rec.title && pt && !feedOk) {
      if (!titleAgrees(rec.title, pt) && !squash(text.slice(0, 3000)).includes(squash(rec.title))) return ["unverifiable", "title mismatch: we have '" + rec.title + "', page says '" + pt.slice(0, 90) + "'"];
    }
    const org = await findOrg(page);
    if (org && rec && !/myworkdayjobs\.com/.test(url) && !/^\d/.test(org)) rec._org = org;
    return ["live", feedOk ? "in the employer's job feed today and the page shows the role" : "opened normally with an Apply control", await findLocation(page), pt, false];
  } catch (e) {
    return ["unverifiable", "error: " + e.message.slice(0, 80)];
  } finally { await page.close().catch(() => {}); }
}

const UNCLEAR = /^(unknown|location unclear|unclear|not specified|us \(location unspecified\))/i;
const AGG = /builtin|themuse\.com|remotive\.com|jobright\.ai|linkedin\.com|theladders\.com|himalayas\.app|wellfound\.com|ycombinator\.com|indeed\.com|lensa\.com|jobgether\.com|remoterocketship\.com|hollylist\.com|zapply\.jobs|resumegeni\.com|refreshmiami\.com|communitech\.ca|jobs\.a16z\.com|quiet\.com|bhsg\.com|topechelon\.com|jrgpartners\.com|loxo\.co|glassdoor|ziprecruiter|simplyhired|jooble|employbl|dailyremote|choppingblock|virtualvocations|whynotremote|joinrise|swooped|jobera|flexjobs/i;

(async () => {
  const startedAt = Date.now(), DEADLINE = 33 * 60 * 1000;
  const store = JSON.parse(fs.readFileSync("jobs.json", "utf8"));
  const signals = JSON.parse(fs.readFileSync("signals.json", "utf8"));
  let prevUrls = new Set(); try { const p = JSON.parse(fs.readFileSync("data.json", "utf8")); for (const r of [...(p.roles || []), ...(p.ic || [])]) prevUrls.add(r.url); } catch (e) {}
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    viewport: { width: 1280, height: 900 }, locale: "en-US",
  });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(new Date());
  const seen = new Set(); const jobs = [];
  for (const j of store.jobs) { if (seen.has(j.url)) continue; seen.add(j.url); jobs.push(j); }
  const WEEK = 7 * 864e5;
  let unverifiableNow = 0;

  async function process(j) {
    const feedClosedNow = j.notInFeed === today && j.feed && j.inFeed !== today;
    if (feedClosedNow && j.status !== "closed") {          // the employer's own feed was read today and no longer lists this role
      j.status = "closed"; j.reason = "no longer in the employer's job feed"; j.lastChecked = today; console.log("closed (feed)", j.company, "|", j.title); return;
    }
    if (j.status === "closed" && j.inFeed !== today && j.lastChecked && Date.now() - Date.parse(j.lastChecked) < WEEK) return;   // recheck closed weekly (daily if back in the feed)
    let host = ""; try { host = new URL(j.url).hostname; } catch (e) { j.status = "closed"; j.reason = "malformed link"; return; }
    if (AGG.test(host)) { j.status = "needs_employer_link"; j.reason = "link is a job board, not the employer's own page"; j.lastChecked = today; console.log("needs link ", j.company, "|", j.title); return; }
    const prev = j.status;
    let [state, why, loc, pt, definitive] = await check(ctx, j.url, j);
    if (state === "unverifiable") { [state, why, loc, pt, definitive] = await check(ctx, j.url, j); }
    if (pt) j.pageTitle = pt;
    if (j._org) { if (j.source === "feed" && /^[A-Za-z0-9 ]+$/.test(j.company) && j.company === j.company.charAt(0).toUpperCase() + j.company.slice(1).toLowerCase() || j.source === "feed" && j.company === j.company.toLowerCase()) j.company = j._org; delete j._org; }
    if (state === "closed" && !definitive) {
      j.closedStreak = (j.closedStreak || 0) + 1;
      if (j.closedStreak < 2) { state = "unverifiable"; why = "looked closed once, rechecking: " + why; }
    } else if (state !== "closed") j.closedStreak = 0;
    if (state === "unverifiable") unverifiableNow++;
    if (state === "unverifiable" && prev === "live") {
      j.failStreak = (j.failStreak || 0) + 1;
      if (j.failStreak <= 3) { j.status = "live"; j.reason = "kept: last check failed (" + why + "); last confirmed " + (j.lastLive || j.lastChecked); console.log("grace       ", j.company, "|", j.title, "|", why); return; }
    }
    if (state === "live") { j.failStreak = 0; j.lastLive = today; }
    j.status = state; j.reason = why; j.lastChecked = today;
    if (loc && (!j.location || UNCLEAR.test(j.location) || /verify|confirm/i.test(j.location))) j.location = loc;
    if (loc) j.pageLocation = loc;
    console.log(state.padEnd(12), j.company, "|", j.title, "|", why);
  }
  const queue = [...jobs];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      if (Date.now() - startedAt > DEADLINE) { console.log("time budget used; remaining jobs keep their previous state"); queue.length = 0; break; }
      const j = queue.shift();
      try { await process(j); } catch (e) { console.log("error on", j.company, e.message.slice(0, 80)); }
    }
  }));

  const cutoff = Date.now() - 30 * 864e5;
  store.jobs = jobs.filter((j) => !(j.status === "closed" && j.lastChecked && Date.parse(j.lastChecked) < cutoff));
  store.updated = today;
  fs.writeFileSync("jobs.json", JSON.stringify(store, null, 1));

  const norm = (t) => (t || "").toLowerCase().replace(/\b(inc|llc|ltd|corp|group|careers|international)\b/g, "").replace(/[^a-z0-9]+/g, "");
  const dupSeen = new Set();
  const pub = (kind) => store.jobs.filter((j) => {
    if (j.status !== "live" || j.kind !== kind) return false;
    if (j.location && !UNCLEAR.test(j.location) && !isNA(j.location)) return false;
    if (j.pageLocation && !isNA(j.pageLocation)) return false;
    const clearLoc = (j.location && !UNCLEAR.test(j.location)) || (j.pageLocation && !UNCLEAR.test(j.pageLocation));
    if (!clearLoc && j.source !== "feed") return false;      // unclear location: hide, except roles read from the employer's own feed
    return true;
  }).filter((j) => { const k = norm(j.company) + "|" + norm(j.title) + "|" + norm(j.pageLocation || j.location); if (dupSeen.has(k)) return false; dupSeen.add(k); return true; })
    .map((j) => ({ company: j.company, title: j.title, location: (j.location && !UNCLEAR.test(j.location)) ? j.location : (j.pageLocation || "See job posting"), url: j.url, comp: j.comp || "", added: j.added, checked: j.lastChecked }));
  const crawl = (() => { try { const c = JSON.parse(fs.readFileSync("crawl-report.json", "utf8")); return { at: c.at, ok: c.ok, failed: (c.failed || []).length, scanned: c.scanned }; } catch (e) { return null; } })();
  const data = {
    generated: today, verifiedAt: new Date().toISOString(),
    roles: pub("role"), ic: pub("ic"), moves: signals.moves, funding: signals.funding,
    crawl, checkedNow: jobs.filter((j) => j.lastChecked === today).length, unverifiableNow,
    notPublished: store.jobs.filter((j) => j.status !== "live").map((j) => ({ company: j.company, title: j.title, url: j.url, state: j.status, reason: j.reason })),
  };
  // sanity gate: a big drop is only published if most of the lost roles are definitively closed
  const prevCount = prevUrls.size, nowUrls = new Set([...data.roles, ...data.ic].map((r) => r.url)), nowCount = nowUrls.size;
  if (prevCount >= 5 && nowCount < prevCount * 0.6) {
    const lost = [...prevUrls].filter((u) => !nowUrls.has(u));
    const closed = lost.filter((u) => { const j = store.jobs.find((x) => x.url === u); return j && j.status === "closed"; });
    if (closed.length < lost.length * 0.6) {
      console.error(`SANITY GATE: live roles dropped ${prevCount} -> ${nowCount}, and only ${closed.length}/${lost.length} of the lost roles are confirmed closed. Not publishing data.json.`);
      await browser.close(); process.exit(1);
    }
  }
  fs.writeFileSync("data.json", JSON.stringify(data));
  await browser.close();
  console.log(`live: ${data.roles.length + data.ic.length}, not published: ${data.notPublished.length}`);
})();
