// Opens every candidate listing in a real headless browser, like a visitor would,
// and publishes only the ones that are clearly still open.
const { chromium } = require("playwright");
const fs = require("fs");

const CLOSED = /no longer (available|accepting|open|active)|(position|job|role|posting|opening|requisition)( has been| is| was)? (filled|closed|removed|expired|unavailable|no longer)|this (job|position|posting|role) (has|is)( been)? (expired|closed|removed|filled)|page (you are looking for )?(doesn.t|does not) exist|we couldn.t find|couldn.t find that|sorry,? (but )?(the|this) (job|page|position)|404|not found|job not found|has expired/i;

function idFrom(url) {
  const m = url.match(/\/jobs\/(\d+)/) || url.match(/lever\.co\/[^/]+\/([0-9a-f-]{36})/i) || url.match(/_(R-?\d+[\w-]*)/);
  return m ? m[1] : null;
}
function lastSeg(url) {
  try { return new URL(url).pathname.replace(/\/+$/, "").split("/").pop().toLowerCase(); } catch { return ""; }
}

async function check(ctx, url) {
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
    return ["live", "opened normally with an Apply control"];
  } catch (e) {
    return ["unverifiable", "error: " + e.message.slice(0, 80)];
  } finally { await page.close().catch(() => {}); }
}

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
    let [state, why] = await check(ctx, j.url);
    if (state === "unverifiable") { [state, why] = await check(ctx, j.url); }
    j.status = state; j.reason = why; j.lastChecked = today;
    console.log(state.padEnd(12), j.company, "|", j.title, "|", why);
  }
  // forget jobs that have been closed for more than 30 days
  const cutoff = Date.now() - 30 * 864e5;
  store.jobs = jobs.filter(j => !(j.status === "closed" && j.lastChecked && Date.parse(j.lastChecked) < cutoff));
  store.updated = today;
  fs.writeFileSync("jobs.json", JSON.stringify(store, null, 1));

  const pub = (kind) => store.jobs.filter(j => j.status === "live" && j.kind === kind)
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
