// Reads the employers' own job feeds (Greenhouse, Lever, Ashby, Workday) and adds any leadership
// people/talent role it finds to jobs.json as "new". The checker then opens each one in a browser.
const fs = require("fs");
const boards = JSON.parse(fs.readFileSync("boards.json", "utf8"));
const store = JSON.parse(fs.readFileSync("jobs.json", "utf8"));
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(new Date());

const LEVEL = /\b(vp|v\.p\.|vice president|svp|evp|head|chief|cpo|chro|cto?o|director|general manager|lead)\b/i;
const TOPIC = /\b(people|talent|recruit\w*|human resources|hr|human capital|workforce|culture|employee experience|total rewards|chro|chief people|chief human|chief talent)\b/i;
const NOISE = /\b(intern|coordinator|assistant|sourcer|partner|business partner|hrbp|analyst|specialist|generalist|engineer|software|product manager|designer|counsel|legal|payroll|benefits administrator|recruiter\b(?!.*(head|vp|director)))/i;
const BIG = /(anthropic|figma|stripe|databricks|airbnb|cloudflare|datadog|coinbase|snowflake|openai|palantir|spotify|doordash|rippling|gitlab|twilio|okta|shopify)/i;
const FOREIGN = /\b(united kingdom|uk|london(?!, ?(on|ontario))|emea|europe|apac|asia|india|australia|singapore|germany|berlin|paris|france|ireland|dublin|japan|tokyo|brazil|(?<!new )mexico|latam|latin america|philippines|israel|tel aviv|spain|portugal|netherlands|amsterdam|poland|sweden|switzerland)\b/i;
const NA = /\b(united states|usa|u\.s\.|canada|remote|north america|americas)\b|,\s?[A-Z]{2}\b/i;

function wanted(company, title, loc) {
  if (!LEVEL.test(title) || !TOPIC.test(title) || NOISE.test(title)) return false;
  if (/\bdirector\b/i.test(title) && !/\b(vp|vice|head|chief|svp)\b/i.test(title) && !BIG.test(company)) return false;
  if (loc && FOREIGN.test(loc) && !NA.test(loc)) return false;
  return true;
}
const key = (u) => {
  let m;
  if ((m = u.match(/greenhouse\.io\/(?:embed\/job_app\?.*token=|[^/]+\/jobs\/)(\d+)/)) || (m = u.match(/[?&]gh_jid=(\d+)/))) return "gh:" + m[1];
  if ((m = u.match(/(?:lever\.co|ashbyhq\.com)\/[^/]+\/([0-9a-f-]{36})/i))) return "id:" + m[1].toLowerCase();
  return u.toLowerCase().replace(/^https?:\/\//, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
};
const have = new Set(store.jobs.map((j) => key(j.url)));
const sha = (s) => require("crypto").createHash("sha1").update(s).digest("hex").slice(0, 10);
const nice = (t) => t.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

async function getJSON(url, opt) {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
    const r = await fetch(url, { ...(opt || {}), signal: c.signal }); clearTimeout(t);
    if (!r.ok) return { status: r.status };
    return { status: 200, json: await r.json() };
  } catch (e) { return { status: 0 }; }
}

// extra Workday tenants taken from links we already have
const wd = new Set((boards.workday || []).map((x) => JSON.stringify(x)));
for (const j of store.jobs) {
  const m = j.url.match(/^https:\/\/([^.]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([^/]+)/);
  if (m) wd.add(JSON.stringify({ tenant: m[1], wd: m[2], site: m[3], company: nice(m[1]) }));
}
const ghExtra = new Set(boards.greenhouse), lvExtra = new Set(boards.lever), abExtra = new Set(boards.ashby);
for (const j of store.jobs) {
  let m;
  if ((m = j.url.match(/greenhouse\.io\/([^/?]+)\//))) ghExtra.add(m[1]);
  if ((m = j.url.match(/jobs\.lever\.co\/([^/?]+)/))) lvExtra.add(m[1]);
  if ((m = j.url.match(/jobs\.ashbyhq\.com\/([^/?]+)/))) abExtra.add(m[1]);
}

const found = [], report = { ok: 0, fail: [], scanned: 0 };
async function each(list, fn) { const q = [...list]; await Promise.all(Array.from({ length: 6 }, async () => { while (q.length) await fn(q.shift()); })); }

(async () => {
  await each(ghExtra, async (t) => {
    const r = await getJSON(`https://boards-api.greenhouse.io/v1/boards/${t}/jobs`);
    if (r.status !== 200) return report.fail.push("gh:" + t + ":" + r.status);
    report.ok++; report.scanned += r.json.jobs.length;
    for (const j of r.json.jobs) { const loc = (j.location && j.location.name) || ""; if (wanted(t, j.title, loc)) found.push({ company: nice(t), title: j.title, location: loc, url: j.absolute_url }); }
  });
  await each(lvExtra, async (t) => {
    const r = await getJSON(`https://api.lever.co/v0/postings/${t}?mode=json`);
    if (r.status !== 200 || !Array.isArray(r.json)) return report.fail.push("lever:" + t + ":" + r.status);
    report.ok++; report.scanned += r.json.length;
    for (const j of r.json) { const loc = (j.categories && j.categories.location) || ""; if (wanted(t, j.text, loc)) found.push({ company: nice(t), title: j.text, location: loc, url: j.hostedUrl }); }
  });
  await each(abExtra, async (t) => {
    const r = await getJSON(`https://api.ashbyhq.com/posting-api/job-board/${t}`);
    if (r.status !== 200 || !r.json.jobs) return report.fail.push("ashby:" + t + ":" + r.status);
    report.ok++; report.scanned += r.json.jobs.length;
    for (const j of r.json.jobs) { if (j.isListed === false) continue; const loc = j.location || ""; if (wanted(t, j.title, loc)) found.push({ company: nice(t), title: j.title, location: loc, url: j.jobUrl }); }
  });
  await each([...wd].map((x) => JSON.parse(x)), async (w) => {
    for (const term of ["people", "talent", "human resources"]) {
      const r = await getJSON(`https://${w.tenant}.${w.wd}.myworkdayjobs.com/wday/cxs/${w.tenant}/${w.site}/jobs`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: term }) });
      if (r.status !== 200 || !r.json.jobPostings) { report.fail.push("workday:" + w.tenant + ":" + r.status); return; }
      report.scanned += r.json.jobPostings.length;
      for (const j of r.json.jobPostings) { const loc = j.locationsText || ""; if (wanted(w.company, j.title, loc)) found.push({ company: w.company, title: j.title, location: /^\d+ locations?$/i.test(loc) ? "" : loc, url: `https://${w.tenant}.${w.wd}.myworkdayjobs.com/${w.site}${j.externalPath}` }); }
    }
    report.ok++;
  });

  let added = 0;
  for (const f of found) {
    if (!f.url) continue;
    const k = key(f.url); if (have.has(k)) continue; have.add(k);
    store.jobs.push({ id: sha(f.url), kind: "role", company: f.company, title: f.title, location: f.location, url: f.url, comp: "", added: today, status: "new", lastChecked: null, reason: null, source: "feed" });
    added++; console.log("NEW", f.company, "|", f.title, "|", f.location);
  }
  console.log(`feeds ok: ${report.ok}, failed: ${report.fail.length}, jobs scanned: ${report.scanned}, matched: ${found.length}, new: ${added}`);
  if (report.fail.length) console.log("failed feeds:", report.fail.join(" "));
  fs.writeFileSync("jobs.json", JSON.stringify(store, null, 1));
  fs.writeFileSync("crawl-report.json", JSON.stringify({ at: new Date().toISOString(), ok: report.ok, failed: report.fail, scanned: report.scanned, matched: found.length, added }, null, 1));
  if (report.ok === 0) { console.error("No feed could be read at all"); process.exit(1); }
})();
