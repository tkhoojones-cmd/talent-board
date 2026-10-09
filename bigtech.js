// Readers for large employers that run their own career sites (not Greenhouse/Lever/etc).
// Each returns { status, jobs: [{ title, location, url }] }. They only ADD candidates; a role is never closed
// because it is missing from one of these, and everything found is still opened in a real browser by verify.js.
const enc = encodeURIComponent;

async function amazon(ctx) {
  const seen = new Map(); let any = false;
  for (const term of ctx.terms) {
    const r = await ctx.http(`https://www.amazon.jobs/en/search.json?base_query=${enc(term)}&result_limit=50&sort=recent&country%5B%5D=USA&country%5B%5D=CAN`);
    if (r.status !== 200 || !r.json || !Array.isArray(r.json.jobs)) continue;
    any = true;
    for (const j of r.json.jobs) if (j.job_path && j.title) seen.set(j.job_path, { title: j.title, location: j.normalized_location || j.location || "", url: "https://www.amazon.jobs" + j.job_path });
  }
  return any ? { status: 200, jobs: [...seen.values()] } : { status: 404 };
}

// Eightfold-powered career sites (Netflix, Microsoft and others share this public JSON API)
function eightfold(host, domain) {
  return async (ctx) => {
    const seen = new Map(); let any = false;
    for (const term of ctx.terms) {
      const r = await ctx.http(`https://${host}/api/apply/v2/jobs?domain=${enc(domain)}&query=${enc(term)}&start=0&num=25&sort_by=timestamp`);
      if (r.status !== 200 || !r.json || !Array.isArray(r.json.positions)) continue;
      any = true;
      for (const p of r.json.positions) {
        if (!p.name) continue;
        const url = p.canonicalPositionUrl || `https://${host}/careers/job/${p.id}`;
        seen.set(String(p.id || url), { title: p.name, location: (p.locations || [p.location]).filter(Boolean).join("; "), url });
      }
    }
    return any ? { status: 200, jobs: [...seen.values()] } : { status: 404 };
  };
}

// Sites with no public JSON: load the search page in a real browser and read the job links on it
function browserRead(name, searchUrl, linkRe, urlFix) {
  return async (ctx) => {
    if (!ctx.browser) return { status: 0 };
    const seen = new Map(); let any = false;
    for (const term of ctx.terms.slice(0, 3)) {
      if (Date.now() > ctx.deadline) break;
      const page = await ctx.browser.newPage();
      try {
        await page.goto(searchUrl(term), { waitUntil: "domcontentloaded", timeout: 40000 });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);
        const links = await page.evaluate((src) => {
          const re = new RegExp(src, "i");
          return [...document.querySelectorAll("a[href]")].filter((a) => re.test(a.getAttribute("href"))).map((a) => ({ href: a.href, text: (a.innerText || "").split("\n").map((s) => s.trim()).filter(Boolean) }));
        }, linkRe.source);
        if (links.length) any = true;
        for (const l of links) {
          const title = l.text.find((s) => s.length > 6 && s.length < 140 && !/^(learn more|apply|view|see details|share|save)/i.test(s));
          if (title) seen.set(urlFix ? urlFix(l.href) : l.href, { title, location: "", url: urlFix ? urlFix(l.href) : l.href });
        }
      } catch (e) { /* this term failed; try the next */ } finally { await page.close().catch(() => {}); }
    }
    return any ? { status: 200, jobs: [...seen.values()] } : { status: 404 };
  };
}

const SITES = [
  { id: "bigtech:amazon", company: "Amazon", read: amazon },
  { id: "bigtech:netflix", company: "Netflix", read: eightfold("explore.jobs.netflix.net", "netflix.com") },
  { id: "bigtech:microsoft", company: "Microsoft", read: eightfold("apply.careers.microsoft.com", "microsoft.com") },
  { id: "bigtech:apple", company: "Apple", read: browserRead("Apple", (t) => `https://jobs.apple.com/en-us/search?search=${enc(t)}&sort=newest&location=united-states-USA`, /\/en-us\/details\/\d+/, (u) => u.split("?")[0]) },
  { id: "bigtech:google", company: "Google", read: browserRead("Google", (t) => `https://www.google.com/about/careers/applications/jobs/results/?q=${enc(t)}&location=United%20States`, /jobs\/results\/\d+-/, (u) => u.split("?")[0]) },
  { id: "bigtech:meta", company: "Meta", read: browserRead("Meta", (t) => `https://www.metacareers.com/jobs?q=${enc(t)}`, /metacareers\.com\/(?:profile\/)?jobs\/\d+|\/jobs\/\d+/, (u) => u.split("?")[0]) },
];
module.exports = { SITES };
