// Opens every candidate listing in a real headless browser, like a visitor would,
// and publishes only the ones that are clearly still open.
const { chromium } = require("playwright");
const fs = require("fs");

const CLOSED = /no longer (available|accepting|open|active)|(position|job|role|posting|opening|requisition)( has been| is| was)? (filled|closed|removed|expired|unavailable|no longer)|this (job|position|posting|role) (has|is)( been)? (expired|closed|removed|filled)|page (you are looking for )?(doesn.t|does not) exist|we couldn.t find|couldn.t find that|sorry,? (but )?(the|this) (job|page|position)|404|not found|job not found|has expired|not (currently )?accepting (new )?applications|applications? (are|is) (now )?closed|no longer taking applications|position (is )?(on hold|paused)/i;

function idFrom(url) {
  const m = url.match(/\/jobs\/(\d+)/) || url.match(/lever\.co\/[^/]+\/([0-9a-f-]{36})/i) || url.match(/_(R-?\d+[\w-]*)/);
  return m ? m[1] : null;
}
function lastSeg(url) {
  try { return new URL(url).pathname.replace(/\/+$/, "").split("/").pop().toLowerCase(); } catch { return ""; }
}

async function findLocation(page) {
  try {
    return await page.evaluate(() => {
      const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
      // 1) schema.org JobPosting
      for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const j = JSON.parse(el.textContent);
          const items = Array.isArray(j) ? j : (j["@graph"] || [j]);
          for (const it of items) {
            if (it && it["@type"] === "JobPosting") {
              const locs = [].concat(it.jobLocation || []);
              const parts = locs.map((l) => {
                const a = (l && l.address) || {};
                return [a.addressLocality, a.addressRegion, a.addressCountry && (a.addressCountry.name || a.addressCountry)].filter(Boolean).join(", ");
              }).filter(Boolean);
              if (parts.length) return clean(parts.join(" / "));
              if (it.jobLocationType === "TELECOMMUTE") return "Remote";
            }
          }
        } catch (e) {}
      }
      // 2) common ATS selectors
      const sels = ['[data-automation-id="locations"]', ".job__location", ".posting-categories .location", ".location", '[class*="location" i]'];
      for (const sel of sels) {
        const e = document.querySelector(sel);
        if (e && clean(e.innerText).length > 1 && clean(e.innerText).length < 160) return clean(e.innerText);
      }
      return "";
    });
  } catch (e) { return ""; }
}


// the job title as the posting itself shows it
async function findTitle(page) {
  try {
    return await page.evaluate(() => {
      const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
      for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const j = JSON.parse(el.textContent);
          const items = Array.isArray(j) ? j : (j["@graph"] || [j]);
          for (const it of items) if (it && it["@type"] === "JobPosting" && it.title) return clean(it.title);
        } catch (e) {}
      }
      const h1 = document.querySelector("h1");
      if (h1 && clean(h1.innerText).length > 2) return clean(h1.innerText);
      const og = document.querySelector('meta[property="og:title"]');
      if (og && og.content) return clean(og.content);
      return clean(document.title);
    });
  } catch (e) { return ""; }
}
const STOP = new Set(["of","and","the","a","for","to","in","at","head","vp","vice","president","senior","sr"]);
const toks = (t) => (t || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w && !STOP.has(w));
// does the posting's title agree with what we recorded?
function titleAgrees(recorded, onPage) {
  const a = toks(recorded), b = new Set(toks(onPage));
  if (!a.length) return true;
  return a.some(w => b.has(w));
}
const LEADER_TOPIC = /people|talent|recruit|human|hr\b|culture|workforce|chro|chief/i;

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
    if (status === 404 || status === 410) return ["closed", "HTTP " + status];
    if (status >= 400) return ["unverifiable", "HTTP " + status];
    if (/[?&]error=true/.test(final)) return ["closed", "redirected to board with error=true"];
    const id = idFrom(url);
    if (id && !final.toLowerCase().includes(String(id).toLowerCase())) return ["closed", "redirected away from the job: " + final.slice(0, 100)];
    if (!id) {
      const a = lastSeg(url), b = lastSeg(final);
      if (a && a !== b) return ["unverifiable", "redirected to a different page: " + final.slice(0, 100)];
    }
    const text = (await page.evaluate(() => document.body ? document.body.innerText : "")) || "";
    const head = text.slice(0, 2500);
    if (CLOSED.test(head)) return ["closed", "page says: " + (head.match(CLOSED) || [""])[0]];
    if (text.length < 400) return ["unverifiable", "page had almost no text (blocked or not rendered)"];
    const apply = await page.locator("a, button, input[type=submit]").filter({ hasText: /apply/i }).count();
    if (!apply) return ["unverifiable", "no Apply control found"];
    const pt = await findTitle(page);
    if (rec && rec.title && pt) {
      if (!titleAgrees(rec.title, pt)) return ["unverifiable", "title mismatch: we have '" + rec.title + "', page says '" + pt.slice(0, 90) + "'"];
      if (rec.kind === "role" && !LEADER_TOPIC.test(pt)) return ["unverifiable", "page title doesn't look like a people/talent role: '" + pt.slice(0, 90) + "'"];
    }
    return ["live", "opened normally with an Apply control", await findLocation(page), pt];
  } catch (e) {
    return ["unverifiable", "error: " + e.message.slice(0, 80)];
  } finally { await page.close().catch(() => {}); }
}

const UNCLEAR = /^(unknown|location unclear|unclear|not specified|us \(location unspecified\))/i;
const NONNA = /\b(united kingdom|uk|england|london|emea|europe|apac|asia|india|australia|singapore|germany|france|ireland|japan|brazil|mexico|latam|latin america|philippines|israel|spain|portugal|netherlands)\b/i;
const AGG = /builtin|themuse\.com|remotive\.com|jobright\.ai|linkedin\.com|theladders\.com|himalayas\.app|wellfound\.com|ycombinator\.com|indeed\.com|lensa\.com|jobgether\.com|remoterocketship\.com|hollylist\.com|zapply\.jobs|resumegeni\.com|refreshmiami\.com|communitech\.ca|jobs\.a16z\.com|quiet\.com|bhsg\.com|topechelon\.com|jrgpartners\.com|loxo\.co|glassdoor|ziprecruiter|simplyhired|jooble/i;

(async () => {
  const store = JSON.parse(fs.readFileSync("jobs.json", "utf8"));
  const signals = JSON.parse(fs.readFileSync("signals.json", "utf8"));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    viewport: { width: 1280, height: 900 }, locale: "en-US",
  });
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set();
  const jobs = [];
  for (const j of store.jobs) {            // dedupe by URL
    if (seen.has(j.url)) continue;
    seen.add(j.url); jobs.push(j);
  }
  for (const j of jobs) {
    if (j.status === "closed") continue;   // once closed, stays closed
    if (AGG.test(new URL(j.url).hostname)) {
      j.status = "needs_employer_link"; j.reason = "link is a job board, not the employer's own page"; j.lastChecked = today;
      console.log("needs link ", j.company, "|", j.title); continue;
    }
    let [state, why, loc, pt] = await check(ctx, j.url, j);
    if (state === "unverifiable") { [state, why, loc, pt] = await check(ctx, j.url, j); }
    if (pt) j.pageTitle = pt;
    j.status = state; j.reason = why; j.lastChecked = today;
    // take the location from the real posting when ours is missing or vague
    if (loc && (!j.location || UNCLEAR.test(j.location) || /verify|confirm/i.test(j.location))) j.location = loc;
    if (loc) j.pageLocation = loc;
    console.log(state.padEnd(12), j.company, "|", j.title, "|", why);
  }
  // forget jobs that have been closed for more than 30 days
  const cutoff = Date.now() - 30 * 864e5;
  store.jobs = jobs.filter(j => !(j.status === "closed" && j.lastChecked && Date.parse(j.lastChecked) < cutoff));
  store.updated = today;
  fs.writeFileSync("jobs.json", JSON.stringify(store, null, 1));

  const pub = (kind) => store.jobs.filter(j => j.status === "live" && j.kind === kind && j.location && !UNCLEAR.test(j.location) && !(j.pageLocation && NONNA.test(j.pageLocation) && !/united states|usa|canada|remote/i.test(j.pageLocation)))
    .map(j => ({ company: j.company, title: j.title, location: j.location, url: j.url, comp: j.comp || "", added: j.added, checked: j.lastChecked }));
  const data = {
    generated: today, verifiedAt: new Date().toISOString(),
    roles: pub("role"), ic: pub("ic"), moves: signals.moves, funding: signals.funding,
    notPublished: store.jobs.filter(j => j.status !== "live").map(j => ({ company: j.company, title: j.title, url: j.url, state: j.status, reason: j.reason })),
  };
  fs.writeFileSync("data.json", JSON.stringify(data));
  await browser.close();
  console.log(`live: ${data.roles.length + data.ic.length}, not published: ${data.notPublished.length}`);
})();
