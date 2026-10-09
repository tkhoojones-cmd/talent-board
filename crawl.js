// Reads employers' own job feeds (Greenhouse, Lever, Ashby, Workable, Rippling, SmartRecruiters, Recruitee, iCIMS, Workday,
// Oracle Recruiting Cloud, Taleo, SuccessFactors)
// and adds any matching leadership people/talent role to jobs.json as "new".
// It also records which jobs are in the employer's feed today (evidence the role is open).
const fs = require("fs");
const { wanted, wantedIC, isNA } = require("./lib");
const boards = JSON.parse(fs.readFileSync("boards.json", "utf8"));
const store = JSON.parse(fs.readFileSync("jobs.json", "utf8"));
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(new Date());
const ATS = ["greenhouse", "lever", "ashby", "workable", "rippling", "smartrecruiters", "recruitee", "icims"];
for (const a of ATS) boards[a] = boards[a] || [];
boards.workday = boards.workday || []; boards.oracle = boards.oracle || []; boards.taleo = boards.taleo || []; boards.successfactors = boards.successfactors || []; boards.candidates = boards.candidates || []; boards.tried = boards.tried || {};
boards.dead = boards.dead || []; boards.misses = boards.misses || {}; boards.names = boards.names || {};

const key = (u) => {
  let m;
  if ((m = u.match(/greenhouse\.io\/(?:embed\/job_app\?.*token=|[^/]+\/jobs\/)(\d+)/)) || (m = u.match(/[?&]gh_jid=(\d+)/))) return "gh:" + m[1];
  if ((m = u.match(/(?:lever\.co|ashbyhq\.com)\/[^/]+\/([0-9a-f-]{36})/i))) return "id:" + m[1].toLowerCase();
  if ((m = u.match(/myworkdayjobs\.com\/.*_(R-?\d+[\w-]*)/i))) return "wd:" + m[1].toLowerCase();
  if ((m = u.match(/icims\.com\/jobs\/(\d+)\//))) return "ic:" + m[1];
  if ((m = u.match(/oraclecloud\.com\/hcmUI\/CandidateExperience\/[^/]+\/sites\/[^/]+\/job\/(\d+)/i))) return "or:" + m[1];
  if ((m = u.match(/taleo\.net\/careersection\/[^?]*jobdetail\.ftl\?[^#]*\bjob=([\w-]+)/i))) return "tl:" + m[1].toLowerCase();
  if ((m = u.match(/successfactors\.(?:com|eu)\/.*\/job\/[^/]+\/(\d+)/i)) || (m = u.match(/\/job\/[^/]+\/(\d{5,})\/?$/))) return "sf:" + m[1];
  if ((m = u.match(/apply\.workable\.com\/[^/]+\/j\/([A-Z0-9]+)/i))) return "wk:" + m[1].toUpperCase();
  const keep = (u.match(/[?&](id|jobid|job_id|jid|req|reqid|gh_jid|jobId)=[^&]+/i) || [""])[0];
  return u.toLowerCase().replace(/^https?:\/\//, "").replace(/[?#].*$/, "").replace(/\/+$/, "") + keep.toLowerCase();
};
const sha = (s) => require("crypto").createHash("sha1").update(s).digest("hex").slice(0, 10);
const nice = (t) => t.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const display = (ats, tok) => boards.names[ats + ":" + tok] || nice(tok.replace(/^careers-/, ""));

async function http(url, opt) {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 20000);
    const r = await fetch(url, { ...(opt || {}), signal: c.signal }); clearTimeout(t);
    if (!r.ok) return { status: r.status };
    const ct = r.headers.get("content-type") || "";
    return { status: 200, json: ct.includes("json") ? await r.json() : null, text: ct.includes("json") ? "" : await r.text() };
  } catch (e) { return { status: 0 }; }
}
const post = (u, body) => http(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

// each fetcher: token -> {status, jobs:[{title, location, url}]}   (all jobs on that board)
const FETCH = {
  async greenhouse(t) {
    for (const host of ["boards-api.greenhouse.io", "boards-api.eu.greenhouse.io"]) {
      const r = await http(`https://${host}/v1/boards/${t}/jobs`);
      if (r.status === 200 && r.json && Array.isArray(r.json.jobs)) return { status: 200, jobs: r.json.jobs.map((j) => ({ title: j.title, location: (j.location && j.location.name) || "", url: j.absolute_url })) };
      if (r.status !== 404) return { status: r.status };
    }
    return { status: 404 };
  },
  async lever(t) {
    for (const host of ["api.lever.co", "api.eu.lever.co"]) {
      const r = await http(`https://${host}/v0/postings/${t}?mode=json`);
      if (r.status === 200 && Array.isArray(r.json)) return { status: 200, jobs: r.json.map((j) => ({ title: j.text, location: [(j.categories && j.categories.location) || "", ...((j.allLocations) || [])].filter(Boolean).join(" / "), url: j.hostedUrl })) };
      if (r.status !== 404) return { status: r.status };
    }
    return { status: 404 };
  },
  async ashby(t) {
    const r = await http(`https://api.ashbyhq.com/posting-api/job-board/${t}`);
    if (r.status !== 200 || !r.json || !r.json.jobs) return { status: r.status || 0 };
    return { status: 200, jobs: r.json.jobs.filter((j) => j.isListed !== false).map((j) => ({ title: j.title, location: [j.location || "", ...((j.secondaryLocations || []).map((x) => x.location || x))].filter(Boolean).join(" / "), url: j.jobUrl })) };
  },
  async workable(t) {
    const out = []; let token;
    for (let i = 0; i < 10; i++) {
      const r = await post(`https://apply.workable.com/api/v3/accounts/${t}/jobs`, { query: "", location: [], department: [], worktype: [], remote: [], ...(token ? { token } : {}) });
      if (r.status !== 200 || !r.json || !r.json.results) return i === 0 ? { status: r.status || 0 } : { status: 200, jobs: out };
      for (const j of r.json.results) out.push({ title: j.title, location: [j.location && j.location.city, j.location && j.location.region, j.location && j.location.country].filter(Boolean).join(", "), url: `https://apply.workable.com/${t}/j/${j.shortcode}/` });
      token = r.json.nextPage; if (!token) break;
    }
    return { status: 200, jobs: out };
  },
  async rippling(t) {
    const out = [];
    for (let p = 0; p < 10; p++) {
      const r = await http(`https://ats.rippling.com/api/v2/board/${t}/jobs?page=${p}&pageSize=100`);
      if (r.status !== 200 || !r.json) return p === 0 ? { status: r.status || 0 } : { status: 200, jobs: out };
      const items = r.json.items || r.json.results || (Array.isArray(r.json) ? r.json : []);
      for (const j of items) out.push({ title: j.name || j.title, location: (j.workLocation && j.workLocation.name) || (j.locations && j.locations[0] && (j.locations[0].name || j.locations[0])) || "", url: j.url || `https://ats.rippling.com/${t}/jobs/${j.id}` });
      if (!items.length || p + 1 >= (r.json.totalPages || 1)) break;
    }
    return { status: 200, jobs: out };
  },
  async smartrecruiters(t) {
    const out = []; let total = 1;
    for (let off = 0; off < Math.min(total, 1000); off += 100) {
      const r = await http(`https://api.smartrecruiters.com/v1/companies/${t}/postings?limit=100&offset=${off}`);
      if (r.status !== 200 || !r.json || !r.json.content) return off === 0 ? { status: r.status || 0 } : { status: 200, jobs: out };
      total = r.json.totalFound || 0;
      for (const j of r.json.content) out.push({ title: j.name, location: [j.location && j.location.city, j.location && j.location.region, j.location && j.location.country].filter(Boolean).join(", "), url: `https://jobs.smartrecruiters.com/${t}/${j.id}` });
    }
    return out.length || total === 0 ? { status: 200, jobs: out } : { status: 404 };
  },
  async icims(host) {
    // iCIMS has no public JSON; read the search result pages (in_iframe view) for several keywords
    const out = new Map(); let okAny = false;
    for (const kw of ["people", "talent", "human resources", "recruiting", "chief"]) {
      for (let pr = 0; pr < 5; pr++) {
        const r = await http(`https://${host}.icims.com/jobs/search?ss=1&searchKeyword=${encodeURIComponent(kw)}&in_iframe=1&pr=${pr}`);
        if (r.status !== 200 || !r.text) { if (pr === 0 && !okAny) break; else break; }
        okAny = true; let found = 0;
        for (const m of r.text.matchAll(/<a[^>]+href="(https?:\/\/[^"]*?\/jobs\/(\d+)\/([^"\/?]*)\/job[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
          const url = m[1].split("?")[0]; if (out.has(url)) continue; found++;
          let title = m[4].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/^\s*Title\s*/i, "").trim();
          if (!title || title.length > 140) title = decodeURIComponent(m[3]).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          out.set(url, { title, location: "", url });
        }
        if (!found) break;
      }
    }
    return okAny ? { status: 200, jobs: [...out.values()] } : { status: 404 };
  },
  async recruitee(t) {
    const r = await http(`https://${t}.recruitee.com/api/offers/`);
    if (r.status !== 200 || !r.json || !r.json.offers) return { status: r.status || 0 };
    return { status: 200, jobs: r.json.offers.map((j) => ({ title: j.title, location: [j.city, j.country_code].filter(Boolean).join(", ") || j.location || "", url: j.careers_url })) };
  },
};
const WD_DEADLINE = Date.now() + 12 * 60 * 1000;
async function workday(w) {
  if (Date.now() > WD_DEADLINE) return { status: 0 };
  const base = `https://${w.tenant}.${w.wd}.myworkdayjobs.com`;
  const terms = ["chief people officer", "vice president people", "vice president human resources", "head of talent", "head of people", "vice president talent"];
  const seen = new Map(); let any = false;
  for (const term of terms) {
    let off = 0, total = 1;
    while (off < total && off < 40 && Date.now() < WD_DEADLINE) {
      const r = await post(`${base}/wday/cxs/${w.tenant}/${w.site}/jobs`, { appliedFacets: {}, limit: 20, offset: off, searchText: term });
      if (r.status !== 200 || !r.json || !r.json.jobPostings) break;
      any = true; total = r.json.total || 0; off += 20;
      for (const j of r.json.jobPostings) seen.set(j.externalPath, { title: j.title, location: /^\d+ locations?$/i.test(j.locationsText || "") ? "" : (j.locationsText || ""), url: `${base}/${w.site}${j.externalPath}` });
    }
  }
  return any ? { status: 200, jobs: [...seen.values()] } : { status: 404 };
}


// ---------- Oracle Recruiting Cloud, Taleo and SuccessFactors (employer-hosted systems, mostly big companies) ----------
// These are read for NEW roles only. Their absence from a read is never used to close a role (the page check does that).
const LEAD_TERMS = ["chief people officer", "vice president people", "vice president human resources", "head of talent", "head of people", "vice president talent"];
const HOST_DEADLINE = Date.now() + 10 * 60 * 1000;
async function oracle(o) {                       // {host, site, company}
  const seen = new Map(); let any = false;
  for (const term of LEAD_TERMS) {
    if (Date.now() > HOST_DEADLINE) break;
    const q = `https://${o.host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations&finder=findReqs;siteNumber=${encodeURIComponent(o.site)},keyword=${encodeURIComponent('"' + term + '"')},limit=25,sortBy=POSTING_DATES_DESC`;
    const r = await http(q);
    const list = r.status === 200 && r.json && r.json.items && r.json.items[0] && r.json.items[0].requisitionList;
    if (!list) { if (r.status && r.status !== 200 && !any) return { status: r.status }; continue; }
    any = true;
    for (const j of list) if (j.Id && j.Title) seen.set(j.Id, { title: j.Title, location: j.PrimaryLocation || "", url: `https://${o.host}/hcmUI/CandidateExperience/en/sites/${o.site}/job/${j.Id}` });
  }
  return any ? { status: 200, jobs: [...seen.values()] } : { status: 404 };
}
async function taleo(t) {                        // {tenant, section, company}; portal id comes from the section's own page
  const base = `https://${t.tenant}.taleo.net/careersection`;
  let cookie = "";
  const shell = await (async () => {                 // fetched by hand so the session cookie can be kept for the search call
    try {
      const c = new AbortController(); const tm = setTimeout(() => c.abort(), 20000);
      const r = await fetch(`${base}/${t.section}/jobsearch.ftl?lang=en`, { signal: c.signal, headers: { "user-agent": "Mozilla/5.0" } }); clearTimeout(tm);
      const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
      cookie = sc.map((x) => x.split(";")[0]).join("; ");
      return r.ok ? { status: 200, text: await r.text() } : { status: r.status };
    } catch (e) { return { status: 0 }; }
  })();
  const portal = shell.text && (shell.text.match(/portal=(\d{6,})/) || shell.text.match(/"portalNo"\s*:\s*"?(\d{6,})/) || [])[1];
  if (shell.status !== 200) return { status: shell.status };
  if (!portal) return { status: 0 };
  let lastStatus = 0;
  const seen = new Map(); let any = false;
  for (const term of LEAD_TERMS) {
    if (Date.now() > HOST_DEADLINE) break;
    const r = await http(`${base}/rest/jobboard/searchjobs?lang=en&portal=${portal}`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/javascript, */*; q=0.01", "x-requested-with": "XMLHttpRequest", "user-agent": "Mozilla/5.0", referer: `${base}/${t.section}/jobsearch.ftl?lang=en`, tz: "GMT-07:00", tzname: "America/Vancouver", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({
      multilineEnabled: false, sortingSelection: { sortBySelectionParam: "3", ascendingSortingOrder: "false" },
      fieldData: { fields: { KEYWORD: term, LOCATION: "" }, valid: true },
      filterSelectionParam: { searchFilterSelections: [{ id: "POSTING_DATE", selectedValues: [] }, { id: "LOCATION", selectedValues: [] }, { id: "JOB_FIELD", selectedValues: [] }, { id: "JOB_TYPE", selectedValues: [] }, { id: "JOB_SCHEDULE", selectedValues: [] }, { id: "JOB_LEVEL", selectedValues: [] }] },
      advancedSearchFiltersSelectionParam: { searchFilterSelections: [{ id: "ORGANIZATION", selectedValues: [] }, { id: "LOCATION", selectedValues: [] }, { id: "JOB_FIELD", selectedValues: [] }, { id: "JOB_NUMBER", selectedValues: [] }, { id: "URGENT_JOB", selectedValues: [] }, { id: "EMPLOYEE_STATUS", selectedValues: [] }, { id: "STUDY_LEVEL", selectedValues: [] }, { id: "WILL_TRAVEL", selectedValues: [] }, { id: "JOB_SHIFT", selectedValues: [] }] },
      pageNo: 1 }) });
    if (r.status !== 200) lastStatus = r.status;
    const list = r.status === 200 && r.json && r.json.requisitionList;
    if (!Array.isArray(list)) continue;
    any = true;
    for (const j of list) {
      const col = j.column || []; const id = j.contestNo || j.jobId; if (!id || !col[0]) continue;
      let loc = col[1] || ""; try { const a = JSON.parse(loc); if (Array.isArray(a)) loc = a.join("; "); } catch (e) {}
      seen.set(id, { title: String(col[0]).trim(), location: String(loc).replace(/^[A-Z]{2}-/, "").replace(/-/g, ", "), url: `${base}/${t.section}/jobdetail.ftl?job=${encodeURIComponent(id)}&lang=en` });
    }
  }
  return any ? { status: 200, jobs: [...seen.values()] } : { status: lastStatus || 1 };   // real search status, so a failed search is not mistaken for a missing feed
}
async function successfactors(s) {               // {host, company}; reads the career site's public sitemap, title comes from the URL slug
  const urls = []; const queue = [`https://${s.host}/sitemap.xml`]; let any = false;
  for (let n = 0; n < 6 && queue.length; n++) {
    const r = await http(queue.shift());
    if (r.status !== 200 || !r.text) { if (!any && n === 0) return { status: r.status }; continue; }
    any = true;
    for (const m of r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) { const u = m[1].replace(/&amp;/g, "&"); if (/\.xml(\.gz)?$/i.test(u)) queue.push(u); else if (/\/job\/[^/]+\/\d+/.test(u)) urls.push(u); }
  }
  const jobs = [];
  for (const u of urls) {
    const slug = decodeURIComponent((u.match(/\/job\/([^/]+)\/\d+/) || [])[1] || "").replace(/-/g, " ").trim();
    if (slug && (wanted(slug) || wantedIC(slug))) jobs.push({ title: slug, location: "", url: u, slug: true });
  }
  return any ? { status: 200, jobs } : { status: 404 };
}
const HOSTED = { oracle: [oracle, (x) => `oracle:${x.host}:${x.site}`], taleo: [taleo, (x) => `taleo:${x.tenant}:${x.section}`], successfactors: [successfactors, (x) => `successfactors:${x.host}`] };

// Workday tenants taken from links we already have
const wdSet = new Map((boards.workday || []).map((x) => [x.tenant + x.site, x]));
for (const j of store.jobs) {
  const m = j.url.match(/^https:\/\/([^.]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([^/]+)/);
  if (m && !wdSet.has(m[1] + m[3])) wdSet.set(m[1] + m[3], { tenant: m[1], wd: m[2], site: m[3], company: nice(m[1]) });
}

for (const j of store.jobs) {
  let m;
  if ((m = j.url.match(/^https:\/\/([a-z0-9.-]+\.oraclecloud\.com)\/hcmUI\/CandidateExperience\/[^/]+\/sites\/([^/]+)\//i)) && !boards.oracle.some((x) => x.host === m[1] && x.site === m[2])) boards.oracle.push({ host: m[1], site: m[2], company: j.company });
  if ((m = j.url.match(/^https:\/\/([a-z0-9-]+)\.taleo\.net\/careersection\/([^/]+)\//i)) && m[2] !== "rest" && !boards.taleo.some((x) => x.tenant === m[1] && x.section === m[2])) boards.taleo.push({ tenant: m[1], section: m[2], company: j.company });
}
// feed tokens taken from links we already have
const add = (a, t) => { if (!boards[a].includes(t)) boards[a].push(t); };
for (const j of store.jobs) {
  let m;
  if ((m = j.url.match(/greenhouse\.io\/([^/?]+)\//)) && !/^(embed|v1)$/.test(m[1])) add("greenhouse", m[1]);
  if ((m = j.url.match(/jobs\.lever\.co\/([^/?]+)/))) add("lever", m[1]);
  if ((m = j.url.match(/jobs\.ashbyhq\.com\/([^/?]+)/))) add("ashby", m[1]);
  if ((m = j.url.match(/apply\.workable\.com\/([^/?]+)/))) add("workable", m[1]);
  if ((m = j.url.match(/ats\.rippling\.com\/([^/?]+)/))) add("rippling", m[1]);
  if ((m = j.url.match(/jobs\.smartrecruiters\.com\/([^/?]+)/))) add("smartrecruiters", m[1]);
  if ((m = j.url.match(/^https:\/\/(careers-[a-z0-9-]+)\.icims\.com\//))) add("icims", m[1]);
}
// companies from funding / hiring news are candidates too
try {
  const sig = JSON.parse(fs.readFileSync("signals.json", "utf8"));
  for (const x of [...(sig.funding || []), ...(sig.moves || [])]) { const c = (x.company || "").trim(); if (c && !boards.dead.includes(c) && !boards.candidates.includes(c) && boards.tried[c] === undefined) boards.candidates.push(c); }
} catch (e) {}

const slugsOf = (n) => { const b = n.toLowerCase().replace(/&/g, "and").replace(/\b(inc|llc|ltd|corp|co)\b\.?/g, "").trim(); return [...new Set([b.replace(/[^a-z0-9]+/g, ""), b.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")])].filter(Boolean); };
const sq = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
async function probe(name) {
  for (const s of slugsOf(name)) {
    const g = await http(`https://boards-api.greenhouse.io/v1/boards/${s}`);       // gives the board's real company name
    if (g.status === 200 && g.json && g.json.name && (sq(g.json.name).includes(sq(name)) || sq(name).includes(sq(g.json.name)))) return ["greenhouse", s];
    for (const a of ["lever", "ashby", "workable", "smartrecruiters", "recruitee", "rippling"]) {
      const r = await FETCH[a](s); if (r.status === 200 && r.jobs.length) return [a, s];
    }
  }
  return null;
}

const report = { ok: 0, fail: [], scanned: 0, probed: 0 };
async function each(list, fn) { const q = [...list]; await Promise.all(Array.from({ length: 6 }, async () => { while (q.length) { const x = q.shift(); try { await fn(x); } catch (e) { report.fail.push("error:" + e.message.slice(0, 60)); } } })); }

(async () => {
  const names = boards.candidates.filter((n) => (boards.tried[n] || 0) < 4 || (Date.now() % 30 === 0));
  await each(names, async (n) => {
    report.probed++;
    const hit = await probe(n);
    if (hit) { const [a, tok] = hit; add(a, tok); boards.names[a + ":" + tok] = n; boards.candidates = boards.candidates.filter((x) => x !== n); console.log("FEED FOUND", n, "->", a + "/" + tok); }
    else boards.tried[n] = (boards.tried[n] || 0) + 1;
  });

  const feedKeys = new Map();          // "ats:token" -> Set of job keys currently in that employer's feed
  const matches = [];
  const jobsToRead = [];
  for (const a of ATS) for (const t of boards[a]) jobsToRead.push({ a, t });
  await each(jobsToRead, async ({ a, t }) => {
    const r = await FETCH[a](t);
    const id = a + ":" + t;
    if (r.status !== 200) { report.fail.push(`${a}:${t}:${r.status}`); return; }
    boards.misses[id] = 0; report.ok++; report.scanned += r.jobs.length;
    const ks = new Set();
    for (const j of r.jobs) {
      if (!j.url || !j.title) continue;
      ks.add(key(j.url));
      if ((wanted(j.title) || wantedIC(j.title)) && isNA(j.location)) matches.push({ company: display(a, t), title: j.title, location: j.location, url: j.url, feed: id, kind: wanted(j.title) ? "role" : "ic" });
    }
    feedKeys.set(id, ks);
  });
  await each([...wdSet.values()], async (w) => {
    const r = await workday(w); const id = "workday:" + w.tenant + ":" + w.site;
    if (r.status !== 200) { report.fail.push(`${id}:${r.status}`); return; }
    report.ok++; report.scanned += r.jobs.length;
    const ks = new Set();
    for (const j of r.jobs) { ks.add(key(j.url)); if ((wanted(j.title) || wantedIC(j.title)) && isNA(j.location)) matches.push({ company: w.company, title: j.title, location: j.location, url: j.url, feed: id, kind: wanted(j.title) ? "role" : "ic" }); }
    feedKeys.set(id, ks);
  });


  for (const [kind, [fn, idOf]] of Object.entries(HOSTED)) {
    await each(boards[kind], async (x) => {
      const id = idOf(x); const r = await fn(x);
      if (r.status !== 200) { report.fail.push(`${id}:${r.status}`); return; }
      report.ok++; report.scanned += r.jobs.length;
      for (const j of r.jobs) if ((wanted(j.title) || wantedIC(j.title)) && isNA(j.location)) matches.push({ company: x.company, title: j.title, location: j.location, url: j.url, feed: id, slug: j.slug, kind: wanted(j.title) ? "role" : "ic" });
    });
  }

  // dead feeds: remove only after 3 misses in a row
  for (const f of report.fail) {
    const m = f.match(/^([a-z]+):(.+):404$/); if (!m || !ATS.includes(m[1])) continue;
    const id = m[1] + ":" + m[2]; boards.misses[id] = (boards.misses[id] || 0) + 1;
    if (boards.misses[id] >= 3) { boards[m[1]] = boards[m[1]].filter((x) => x !== m[2]); if (!boards.candidates.includes(m[2]) && !boards.dead.includes(m[2])) boards.candidates.push(m[2]); delete boards.misses[id]; }
  }
  for (const n of [...boards.candidates]) if ((boards.tried[n] || 0) >= 4) { boards.dead.push(n); boards.candidates = boards.candidates.filter((x) => x !== n); }
  for (const a of ATS) boards[a] = [...new Set(boards[a])];
  boards.workday = [...wdSet.values()];

  // evidence for existing jobs: present in / missing from the employer's own feed today
  const feedOf = (u) => { let m;
    if ((m = u.match(/greenhouse\.io\/([^/?]+)\//))) return "greenhouse:" + m[1];
    if ((m = u.match(/jobs\.lever\.co\/([^/?]+)/))) return "lever:" + m[1];
    if ((m = u.match(/jobs\.ashbyhq\.com\/([^/?]+)/))) return "ashby:" + m[1];
    if ((m = u.match(/apply\.workable\.com\/([^/?]+)/))) return "workable:" + m[1];
    if ((m = u.match(/^https:\/\/(careers-[a-z0-9-]+)\.icims\.com\//))) return "icims:" + m[1];
    if ((m = u.match(/^https:\/\/([^.]+)\.wd\d+\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([^/]+)/))) return "workday:" + m[1] + ":" + m[2];
    return null; };
  const wasInFeed = new Set(matches.map((m) => key(m.url)));
  for (const j of store.jobs) {
    const id = j.feed || feedOf(j.url); if (!id) continue;
    const ks = feedKeys.get(id); if (!ks || ks.size === 0) continue;
    j.feed = id;
    if (ks.has(key(j.url))) { j.inFeed = today; delete j.notInFeed; } else if (j.status !== "closed" || true) j.notInFeed = today;
  }

  const have = new Set(store.jobs.map((j) => key(j.url)));
  let added = 0;
  for (const f of matches) {
    const k = key(f.url); if (have.has(k)) continue; have.add(k);
    store.jobs.push({ id: sha(f.url), kind: f.kind || "role", company: f.company, title: f.title, location: f.location, url: f.url, comp: "", added: today, status: "new", lastChecked: null, reason: null, source: "feed", feed: f.feed, inFeed: today, ...(f.slug ? { titleFromSlug: true } : {}) });
    added++; console.log("NEW", f.company, "|", f.title, "|", f.location);
  }
  // feed-added jobs that no longer pass the rules: drop only if never confirmed live
  store.jobs = store.jobs.filter((j) => { if (j.source !== "feed") return true; const keep = (j.kind === "ic" ? wantedIC(j.title) : wanted(j.title)) && isNA(j.location); if (!keep) console.log("REMOVED (no longer matches rules):", j.company, "|", j.title); return keep; });

  console.log(`feeds ok: ${report.ok}, failed: ${report.fail.length}, jobs scanned: ${report.scanned}, matched: ${matches.length}, new: ${added}, probed: ${report.probed}`);
  if (report.fail.length) console.log("failed feeds:", report.fail.join(" "));
  fs.writeFileSync("jobs.json", JSON.stringify(store, null, 1));
  fs.writeFileSync("boards.json", JSON.stringify(boards, null, 1));
  fs.writeFileSync("crawl-report.json", JSON.stringify({ at: new Date().toISOString(), ok: report.ok, failed: report.fail, scanned: report.scanned, matched: matches.length, added }, null, 1));
  if (report.ok === 0) { console.error("No feed could be read at all"); process.exit(1); }
})();
