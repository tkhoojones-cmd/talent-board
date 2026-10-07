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

(async () => {
  const cand = JSON.parse(fs.readFileSync("candidates.json", "utf8"));
  const data = JSON.parse(fs.readFileSync("data.json", "utf8"));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    viewport: { width: 1280, height: 900 }, locale: "en-US",
  });
  const today = new Date().toISOString().slice(0, 10);
  const rejected = [];
  async function run(list) {
    const out = [];
    for (const r of list) {
      let [state, why] = await check(ctx, r.url);
      if (state === "unverifiable") { [state, why] = await check(ctx, r.url); } // one retry
      console.log(state.padEnd(12), r.company, "|", r.title, "|", why);
      if (state === "live") out.push({ ...r, checked: today });
      else rejected.push({ company: r.company, title: r.title, url: r.url, state, reason: why });
    }
    return out;
  }
  data.roles = await run(cand.roles || []);
  data.ic = await run(cand.ic || []);
  data.rejected = rejected;
  data.generated = today;
  data.verifiedAt = new Date().toISOString();
  fs.writeFileSync("data.json", JSON.stringify(data));
  await browser.close();
  console.log(`live: ${data.roles.length + data.ic.length}, not published: ${rejected.length}`);
})();
