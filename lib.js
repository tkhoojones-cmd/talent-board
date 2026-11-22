// Shared rules for "is this a role we want" and "is this location in the US/Canada".
const normTitle = (t) => (t || "").replace(/[–—‑]/g, "-").replace(/\bv\.?\s?p\.?(?=[\s,\/-]|$)/gi, "VP").replace(/vice[- ]president/gi, "vice president");
const STRONG = /\b(vp|svp|evp|vice president|head|chief|cpo|chro|ctlo)\b/i;
const LEVEL = /\b(vp|svp|evp|vice president|head|chief|cpo|chro|ctlo|director|general manager)\b/i;
const TOPIC = /\b(people|talent|recruit\w*|human resources|hr|human capital|culture|employee (experience|relations|engagement|success)|total rewards|learning (and|&) development|organizational (development|effectiveness)|staffing|chro|chief people|chief human|chief talent)\b/i;
const NOISE = /\b(intern|interns|internship|coordinator|assistant|sourcer|analyst|specialist|generalist|engineer|software|designer|payroll|paralegal|apprentice|trainee)\b/i;
const DIR_NOISE = /\b(business partner\w*|people partner\w*|hrbp|partner\w*|sourcing|clinical|design|data|architect\w*|analytics|engineering|legal|operations analyst|payroll|systems|technology|technical program)\b/i;

function wanted(title) {
  const t = normTitle(title);
  if (offTargetTitle(title)) return false;
  if (!LEVEL.test(t) || !TOPIC.test(t)) return false;
  if (/\b(legal|attorney|paralegal)\b/i.test(t)) return false;
  if (!STRONG.test(t)) {                         // Director / GM level: stricter
    if (NOISE.test(t) || DIR_NOISE.test(t)) return false;
    if (!/\b(people|talent|hr|human resources|recruit\w*|culture|total rewards|human capital|workforce|employee)\b/i.test(t)) return false;
  } else if (/\b(intern|interns|internship|coordinator|assistant|sourcer|paralegal)\b/i.test(t)) return false;
  return true;
}


// Senior individual-contributor recruiting roles (the "Senior recruiting" tab): executive / principal / staff level, not managers.
const IC_LEVEL = /\b(executive|principal|staff|lead|senior executive)\b/i;
const IC_TOPIC = /\b(recruiter|recruiting|talent partner|talent acquisition partner|executive search|talent sourcer|talent acquisition lead)\b/i;
const IC_NOISE = /\b(intern|interns|internship|coordinator|assistant|associate|junior|apprentice|trainee|contract|temporary|temp|operations|ops|enablement|analyst|engineer|software|designer|payroll|paralegal|legal|manager|director)\b/i;
function wantedIC(title) {
  const t = normTitle(title);
  if (offTargetTitle(title)) return false;
  if (!IC_LEVEL.test(t) || !IC_TOPIC.test(t) || IC_NOISE.test(t)) return false;
  if (!/\b(executive|principal|staff)\b/i.test(t) && !/\blead\b.*\b(executive|technical|principal)\b|\b(executive|technical|principal)\b.*\blead\b/i.test(t)) return false;
  return !wanted(t);                                  // leadership roles belong on the roles tab
}
// Borderline titles: close to what Tim wants but not matched by the strict rules. They go to a "To review" list
// (still opened in a real browser and checked live) so nothing is silently dropped.
const B_TOPIC = /\b(people|talent|recruit\w*|human resources|hr|human capital|culture|employee (experience|success|relations)|total rewards|learning (and|&) development)\b/i;
const B_LEVEL = /\b(head of|leader|lead|chief of staff|senior manager|sr\.? manager|associate director|executive director|managing director|principal)\b/i;
const B_NOISE = /\b(intern|interns|internship|coordinator|assistant|sourcer|analyst|specialist|generalist|engineer|software|designer|payroll|paralegal|apprentice|trainee|legal|attorney|contract|temporary|business partner\w*|people partner\w*|hrbp|operations analyst|data|analytics|systems|technical program|product|sales|engineering|business system|project|program|design|real estate|netsuite|relations|compliance)\b/i;
function borderline(title) {
  const t = normTitle(title);
  if (offTargetTitle(title)) return false;
  if (!B_TOPIC.test(t) || !B_LEVEL.test(t) || B_NOISE.test(t)) return false;
  return !wanted(t) && !wantedIC(t);
}
// highest figure in a pay range such as "$185,000 - $309,000" or "$250K to $300K"; returns {text, max} or null
function payRange(text) {
  const m = String(text || "").match(/\$\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])\s*(?:-|–|—|to)\s*\$?\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])/);
  if (!m) return null;
  const n = (x) => /k$/i.test(x.trim()) ? Math.round(parseFloat(x) * 1000) : parseInt(x.replace(/,/g, ""), 10);
  const lo = n(m[1]), hi = n(m[2]); if (!(lo >= 20000 && hi >= lo)) return null;
  return { text: m[0].replace(/\s+/g, " "), max: hi };
}

const STATES = "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT";
const STATE_RE = new RegExp(",\\s?(" + STATES + ")\\b(?!\\w)");
const EXPLICIT_NA = /\b(united states|usa|u\.s\.a?|canada|north america|americas)\b|\bUS\b/i;
const FOREIGN = /\b(united kingdom|uk|england|scotland|london(?!,?\s?(on|ontario))|emea|europe|apac|asia|india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|australia|sydney|melbourne|new zealand|singapore|hong kong|china|beijing|shanghai|korea|seoul|japan|tokyo|germany|berlin|munich|france|paris|ireland|dublin|italy|milan|spain|madrid|barcelona|portugal|lisbon|netherlands|amsterdam|belgium|brussels|poland|warsaw|sweden|stockholm|denmark|copenhagen|norway|oslo|finland|helsinki|switzerland|zurich|austria|vienna|israel|tel aviv|dubai|uae|saudi|south africa|nigeria|kenya|egypt|brazil|sao paulo|argentina|colombia|chile|peru|(?<!new )mexico|latam|latin america|philippines|manila|vietnam|thailand|indonesia|malaysia|pakistan|turkey|ukraine|romania|czech|prague|hungary|budapest|greece|brasil|kyiv|kiev|kanagawa|fujisawa|jp)\b/i;
const REMOTE = /\b(remote|anywhere|distributed|work from home)\b/i;

// true if the location is (or could be) in the US/Canada. Drops only when EVERY listed place is outside North America.
function isNA(loc) {
  if (!loc || !String(loc).trim()) return true;       // unknown: do not hide
  const parts = String(loc).split(/[;|\/•\n]| or | and /).map((s) => s.trim()).filter(Boolean);
  let anyForeign = false;
  for (const p of parts) {
    const foreign = FOREIGN.test(p);
    if (EXPLICIT_NA.test(p)) return true;
    if (foreign) { anyForeign = true; continue; }
    if (STATE_RE.test(p) || /\b(new york|san francisco|los angeles|chicago|boston|seattle|austin|denver|atlanta|toronto|vancouver|montreal|calgary|ottawa)\b/i.test(p)) return true;
    if (REMOTE.test(p)) return true;
    return true;                                      // unrecognised place: keep rather than hide
  }
  return !anyForeign;
}
// Not a people-leadership role: admissions, clinical/donor/volunteer recruitment, or an engineering seat that only mentions HR tech.
function offTargetTitle(title) {
  const t = normTitle(title);
  if (/\b(student|pupil|k-?12|undergraduate|alumni)\b.{0,48}\b(recruit\w*|enroll\w*|admission\w*)\b/i.test(t)) return true;
  if (/\b(recruit\w*|enroll\w*|admission\w*)\b.{0,48}\b(student|pupil|k-?12|undergraduate|alumni)\b/i.test(t)) return true;
  if (/\b(patient|donor|volunteer)\b.{0,40}\brecruit\w*\b/i.test(t) || /\brecruit\w*\b.{0,40}\b(patient|donor|volunteer)\b/i.test(t)) return true;
  if (/\bclinical\b.{0,24}\brecruit\w*\b/i.test(t) || /\brecruit\w*\b.{0,24}\bclinical\b/i.test(t)) return true;
  if (/\b(university|college)\s+admissions\b/i.test(t)) return true;
  if (/\badmissions\s+(officer|counselor|counsellor|representative)\b/i.test(t)) return true;
  if (/\b(vp|vice president|svp|evp|head|chief)\b[^.\n]{0,40}\bengineering\b/i.test(t) && /\b(hr|human resources)\s+(tech\w*|systems|is)\b/i.test(t) && !/\b(recruit\w*|talent|people)\b/i.test(t)) return true;
  return false;
}

// Job aggregators and reposter boards. The listing is not the employer's own role.
const AGGREGATORS = new Set(["jobgether", "lensa", "tietalent", "tietalentcom", "underdog", "underdogio", "bebee", "jooble", "whatjobs", "arbeitnow"]);
const squashed = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9.]+/g, "");
function blockedCompany(company) {
  const n = String(company || "").trim();
  const flat = squashed(n).replace(/\./g, "");
  if (AGGREGATORS.has(flat)) return true;
  if (!/\s/.test(n) && /(supportcareers|careers)$/i.test(n)) return true;
  return false;
}

// Greenhouse and other board tokens that publish as one smashed word. Real names from the board APIs.
const COMPANY_NAMES = {
  andurilindustries: "Anduril Industries",
  banyansoftware: "Banyan Software",
  peregrinetechnologies: "Peregrine Technologies",
  futurestandard: "Future Standard",
  launchdarkly: "LaunchDarkly",
  indeedbtrbt: "Pediatrics Plus",
  achievementfirstnetworksupportcareers: "Achievement First",
  achievementfirst: "Achievement First",
  amazonjobs: "Amazon",
  "amazon.jobs": "Amazon",
  adventhealth: "AdventHealth",
  "1password": "1Password"
};
function cleanCompany(name, ctx) {
  let n = String(name || "").replace(/\s+/g, " ").trim();
  if (!n) return n;
  const pipe = n.match(/^(.+?)\s+\|\s+(.+)$/);
  if (pipe) {
    const left = pipe[1].replace(/\s+(careers|jobs)$/i, "").trim();
    const right = pipe[2].trim();
    if (left && right && left.toLowerCase() === right.toLowerCase()) n = right;
    else if (right && !/\b(careers|jobs)\b/i.test(right)) n = right;
  }
  n = n.replace(/\s+(careers|jobs)$/i, "").trim();
  const urlTok = String((ctx && ctx.url) || "").match(/ats\.rippling\.com\/([^/?#]+)/i);
  const feedTok = String((ctx && ctx.feed) || "").match(/^rippling:([^:]+)/i);
  const tok = (urlTok && urlTok[1]) || (feedTok && feedTok[1]);
  if (tok && /^rippling(?:\s+recruiting)?$/i.test(n) && tok.toLowerCase() !== "rippling") n = tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
  else if (tok && tok.toLowerCase() === "rippling" && /^rippling\s+recruiting$/i.test(n)) n = "Rippling";
  if (/^amazon(?:\.jobs)?$/i.test(n)) n = "Amazon";
  const key = squashed(n);
  if (COMPANY_NAMES[key]) n = COMPANY_NAMES[key];
  else if (!/\s/.test(n) && /^[A-Za-z0-9.]+$/.test(n)) {
    const split = n.match(/^(.*?)(industries|software|technologies|technology)$/i);
    if (split && split[1].length >= 3) {
      const stem = split[1].charAt(0).toUpperCase() + split[1].slice(1);
      const suf = { industries: "Industries", software: "Software", technologies: "Technologies", technology: "Technology" }[split[2].toLowerCase()];
      n = stem + " " + suf;
    }
  }
  return n;
}

function keepListing(job) {
  const title = (job && job.title) || "";
  const company = (job && job.company) || "";
  if (offTargetTitle(title)) return false;
  const cleaned = cleanCompany(company, job);
  // A known smashed board token is renamed, not dropped. An unknown "*careers" slug or an aggregator is dropped.
  if (blockedCompany(company) && !COMPANY_NAMES[squashed(company)]) return false;
  if (blockedCompany(cleaned)) return false;
  return true;
}

// Companies discovered by the shared registry (my.soundherald.com). Simple boards are a token.
// Hosted systems need the pieces of the careers URL, because a single token is not enough to read them.
const SIMPLE_ATS = ["greenhouse", "lever", "ashby", "workable", "rippling", "smartrecruiters", "recruitee", "icims"];
const ATS_NAMES = {
  greenhouse: "greenhouse", lever: "lever", ashby: "ashby", workable: "workable", rippling: "rippling",
  smartrecruiters: "smartrecruiters", recruitee: "recruitee", icims: "icims", workday: "workday",
  oracle: "oracle", taleo: "taleo", successfactors: "successfactors"
};
const REGISTRY_CAP = 40;

function registryDomain(v) {
  return String(v || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
}
function registryPick(obj, keys) {
  for (const k of keys) if (obj && obj[k] != null && String(obj[k]).trim()) return obj[k];
  return "";
}
function atsFromCareersUrl(url) {
  const u = String(url || "");
  let m;
  if ((m = u.match(/greenhouse\.io\/([^/?#]+)/i)) && !/^(embed|v1|jobs)$/i.test(m[1])) return { ats: "greenhouse", token: m[1].toLowerCase() };
  if ((m = u.match(/jobs\.lever\.co\/([^/?#]+)/i))) return { ats: "lever", token: m[1].toLowerCase() };
  if ((m = u.match(/(?:jobs\.)?ashbyhq\.com\/([^/?#]+)/i)) && m[1].toLowerCase() !== "api") return { ats: "ashby", token: m[1] };
  if ((m = u.match(/apply\.workable\.com\/([^/?#]+)/i))) return { ats: "workable", token: m[1].toLowerCase() };
  if ((m = u.match(/ats\.rippling\.com\/([^/?#]+)/i)) && m[1].toLowerCase() !== "api") return { ats: "rippling", token: m[1].toLowerCase() };
  if ((m = u.match(/jobs\.smartrecruiters\.com\/([^/?#]+)/i))) return { ats: "smartrecruiters", token: m[1] };
  if ((m = u.match(/^https?:\/\/(careers-[a-z0-9-]+)\.icims\.com\//i))) return { ats: "icims", token: m[1].toLowerCase() };
  if ((m = u.match(/([a-z0-9-]+)\.recruitee\.com/i)) && m[1].toLowerCase() !== "www") return { ats: "recruitee", token: m[1].toLowerCase() };
  if ((m = u.match(/^https?:\/\/([^.]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([^/?#]+)/i))) return { ats: "workday", token: (m[1] + ":" + m[3]).toLowerCase(), hosted: { tenant: m[1], wd: m[2], site: m[3] } };
  if ((m = u.match(/^https?:\/\/([a-z0-9.-]+\.oraclecloud\.com)\/hcmUI\/CandidateExperience\/[^/]+\/sites\/([^/?#]+)/i))) return { ats: "oracle", token: (m[1] + ":" + m[2]).toLowerCase(), hosted: { host: m[1], site: m[2] } };
  if ((m = u.match(/^https?:\/\/([a-z0-9-]+)\.taleo\.net\/careersection\/([^/?#]+)/i)) && m[2].toLowerCase() !== "rest") return { ats: "taleo", token: (m[1] + ":" + m[2]).toLowerCase(), hosted: { tenant: m[1], section: m[2] } };
  if ((m = u.match(/^https?:\/\/([^/?#]*successfactors[^/?#]*)/i))) return { ats: "successfactors", token: m[1].toLowerCase(), hosted: { host: m[1] } };
  return null;
}
function hostedFromToken(ats, token) {
  const p = String(token || "").split(/[:/]/).filter(Boolean);
  if (ats === "workday" && p.length >= 3 && /^wd\d+$/i.test(p[1])) return { tenant: p[0], wd: p[1], site: p.slice(2).join(":") };
  if (ats === "oracle" && p.length >= 2) return { host: p[0], site: p.slice(1).join(":") };
  if (ats === "taleo" && p.length >= 2 && p[1].toLowerCase() !== "rest") return { tenant: p[0], section: p[1] };
  if (ats === "successfactors" && token) return { host: token };
  return null;
}
function normalizeRegistryCompany(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const name = String(registryPick(raw, ["name", "company"]) || "").replace(/\s+/g, " ").trim();
  if (name && blockedCompany(name)) return null;
  const domain = registryDomain(registryPick(raw, ["domain", "website"]));
  const careersUrl = String(registryPick(raw, ["careers_url", "careersUrl", "careers"]) || "").trim();
  const fromUrl = careersUrl ? atsFromCareersUrl(careersUrl) : null;
  let ats = String(registryPick(raw, ["ats", "ats_type", "atsType", "type"]) || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  ats = ATS_NAMES[ats] || (fromUrl && fromUrl.ats) || "";
  let token = String(registryPick(raw, ["token", "board", "slug"]) || "").trim().replace(/^\/+|\/+$/g, "");
  if (!token && fromUrl) token = fromUrl.token;
  if (!ats || !token) return null;
  if (SIMPLE_ATS.includes(ats)) token = token.toLowerCase();
  const hosted = (fromUrl && fromUrl.ats === ats && fromUrl.hosted) || hostedFromToken(ats, token);
  if (!SIMPLE_ATS.includes(ats) && !hosted) return null;
  if (SIMPLE_ATS.includes(ats) && !/^[a-z0-9][a-z0-9._-]*$/i.test(token)) return null;
  return {
    name: name || token,
    domain,
    ats,
    token,
    careersUrl,
    hosted,
    firstSeen: String(registryPick(raw, ["first_seen", "firstSeen"]) || ""),
    discoveredVia: String(registryPick(raw, ["discovered_via", "discoveredVia"]) || "")
  };
}

// null when the body is not a registry. Otherwise the deduped companies, oldest first.
function parseRegistry(payload) {
  if (payload == null) return null;
  const list = Array.isArray(payload) ? payload : (payload && (payload.companies || payload.employers));
  if (!Array.isArray(list)) return null;
  const rows = [];
  for (const raw of list) { const c = normalizeRegistryCompany(raw); if (c) rows.push(c); }
  rows.sort((a, b) => (a.firstSeen || "9999").localeCompare(b.firstSeen || "9999") || a.name.localeCompare(b.name));
  const seenAts = new Set(), seenDom = new Set(), out = [];
  for (const c of rows) {
    const k = c.ats + ":" + c.token.toLowerCase();
    if (seenAts.has(k)) continue;
    if (c.domain && seenDom.has(c.domain)) continue;
    seenAts.add(k);
    if (c.domain) seenDom.add(c.domain);
    out.push(c);
  }
  return out;
}

function knownFeedKeys(boards, wdSet) {
  const keys = new Set();
  for (const a of SIMPLE_ATS) for (const t of (boards[a] || [])) keys.add(a + ":" + String(t).toLowerCase());
  const days = wdSet ? [...wdSet.values()] : (boards.workday || []);
  for (const w of days) if (w && w.tenant && w.site) keys.add("workday:" + String(w.tenant).toLowerCase() + ":" + String(w.site).toLowerCase());
  for (const o of (boards.oracle || [])) if (o && o.host && o.site) keys.add("oracle:" + String(o.host + ":" + o.site).toLowerCase());
  for (const x of (boards.taleo || [])) if (x && x.tenant && x.section) keys.add("taleo:" + String(x.tenant + ":" + x.section).toLowerCase());
  for (const s of (boards.successfactors || [])) if (s && s.host) keys.add("successfactors:" + String(s.host).toLowerCase());
  return keys;
}

// Adds up to `cap` new registry companies onto the existing crawl list. Curated boards stay put.
function mergeRegistry(boards, wdSet, companies, cap) {
  const limit = cap == null ? REGISTRY_CAP : cap;
  boards.registry = boards.registry || {};
  const known = knownFeedKeys(boards, wdSet);
  const knownDomains = new Set(Object.values(boards.registry).map((x) => x.domain).filter(Boolean));
  const added = [];
  let already = 0, capped = 0;
  for (const c of companies || []) {
    const id = c.ats + ":" + c.token.toLowerCase();
    if (known.has(id) || (c.domain && knownDomains.has(c.domain))) { already++; continue; }
    if (added.length >= limit) { capped++; continue; }
    if (SIMPLE_ATS.includes(c.ats)) {
      boards[c.ats] = boards[c.ats] || [];
      if (!boards[c.ats].some((t) => String(t).toLowerCase() === c.token)) boards[c.ats].push(c.token);
    } else if (c.ats === "workday") {
      wdSet.set(c.hosted.tenant + c.hosted.site, { tenant: c.hosted.tenant, wd: c.hosted.wd, site: c.hosted.site, company: c.name });
    } else if (c.ats === "oracle") {
      boards.oracle = boards.oracle || [];
      boards.oracle.push({ host: c.hosted.host, site: c.hosted.site, company: c.name });
    } else if (c.ats === "taleo") {
      boards.taleo = boards.taleo || [];
      boards.taleo.push({ tenant: c.hosted.tenant, section: c.hosted.section, company: c.name });
    } else if (c.ats === "successfactors") {
      boards.successfactors = boards.successfactors || [];
      boards.successfactors.push({ host: c.hosted.host, company: c.name });
    } else continue;
    boards.names = boards.names || {};
    boards.names[id] = c.name;
    const saved = { name: c.name, domain: c.domain, ats: c.ats, token: c.token, discoveredVia: c.discoveredVia, firstSeen: c.firstSeen };
    boards.registry[id] = saved;
    known.add(id);
    if (c.domain) knownDomains.add(c.domain);
    added.push(saved);
  }
  return { added, already, capped };
}

module.exports = { wanted, wantedIC, borderline, payRange, isNA, normTitle, TOPIC, offTargetTitle, blockedCompany, cleanCompany, keepListing, parseRegistry, mergeRegistry, knownFeedKeys, REGISTRY_CAP, SIMPLE_ATS };
