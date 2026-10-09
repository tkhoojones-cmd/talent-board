// Shared rules for "is this a role we want" and "is this location in the US/Canada".
const normTitle = (t) => (t || "").replace(/[–—‑]/g, "-").replace(/\bv\.?\s?p\.?(?=[\s,\/-]|$)/gi, "VP").replace(/vice[- ]president/gi, "vice president");
const STRONG = /\b(vp|svp|evp|vice president|head|chief|cpo|chro|ctlo)\b/i;
const LEVEL = /\b(vp|svp|evp|vice president|head|chief|cpo|chro|ctlo|director|general manager)\b/i;
const TOPIC = /\b(people|talent|recruit\w*|human resources|hr|human capital|culture|employee (experience|relations|engagement|success)|total rewards|learning (and|&) development|organizational (development|effectiveness)|staffing|chro|chief people|chief human|chief talent)\b/i;
const NOISE = /\b(intern|interns|internship|coordinator|assistant|sourcer|analyst|specialist|generalist|engineer|software|designer|payroll|paralegal|apprentice|trainee)\b/i;
const DIR_NOISE = /\b(business partner\w*|people partner\w*|hrbp|partner\w*|sourcing|clinical|design|data|architect\w*|analytics|engineering|legal|operations analyst|payroll|systems|technology|technical program)\b/i;

function wanted(title) {
  const t = normTitle(title);
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
  if (!IC_LEVEL.test(t) || !IC_TOPIC.test(t) || IC_NOISE.test(t)) return false;
  if (!/\b(executive|principal|staff)\b/i.test(t) && !/\blead\b.*\b(executive|technical|principal)\b|\b(executive|technical|principal)\b.*\blead\b/i.test(t)) return false;
  return !wanted(t);                                  // leadership roles belong on the roles tab
}
// Borderline titles: close to what Tim wants but not matched by the strict rules. They go to a "To review" list
// (still opened in a real browser and checked live) so nothing is silently dropped.
const B_TOPIC = /\b(people|talent|recruit\w*|human resources|hr|human capital|culture|employee (experience|success|relations)|total rewards|learning (and|&) development)\b/i;
const B_LEVEL = /\b(head of|leader|lead|chief of staff|senior manager|sr\.? manager|associate director|executive director|managing director|principal|partner)\b/i;
const B_NOISE = /\b(intern|interns|internship|coordinator|assistant|sourcer|analyst|specialist|generalist|engineer|software|designer|payroll|paralegal|apprentice|trainee|legal|attorney|contract|temporary|business partner\w*|people partner\w*|hrbp|operations analyst|data|analytics|systems|technical program)\b/i;
function borderline(title) {
  const t = normTitle(title);
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
const FOREIGN = /\b(united kingdom|uk|england|scotland|london(?!,?\s?(on|ontario))|emea|europe|apac|asia|india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|australia|sydney|melbourne|new zealand|singapore|hong kong|china|beijing|shanghai|korea|seoul|japan|tokyo|germany|berlin|munich|france|paris|ireland|dublin|italy|milan|spain|madrid|barcelona|portugal|lisbon|netherlands|amsterdam|belgium|brussels|poland|warsaw|sweden|stockholm|denmark|copenhagen|norway|oslo|finland|helsinki|switzerland|zurich|austria|vienna|israel|tel aviv|dubai|uae|saudi|south africa|nigeria|kenya|egypt|brazil|sao paulo|argentina|colombia|chile|peru|(?<!new )mexico|latam|latin america|philippines|manila|vietnam|thailand|indonesia|malaysia|pakistan|turkey|ukraine|romania|czech|prague|hungary|budapest|greece)\b/i;
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
module.exports = { wanted, wantedIC, borderline, payRange, isNA, normTitle, TOPIC };
