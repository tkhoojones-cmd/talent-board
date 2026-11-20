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

module.exports = { wanted, wantedIC, borderline, payRange, isNA, normTitle, TOPIC, offTargetTitle, blockedCompany, cleanCompany, keepListing };
