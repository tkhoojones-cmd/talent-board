// Shared rules for "is this a role we want" and "is this location in the US/Canada".
const normTitle = (t) => (t || "").replace(/[–—‑]/g, "-").replace(/\bv\.?\s?p\.?(?=[\s,\/-]|$)/gi, "VP").replace(/vice[- ]president/gi, "vice president");
const STRONG = /\b(vp|svp|evp|vice president|head|chief|cpo|chro|ctlo)\b/i;
const LEVEL = /\b(vp|svp|evp|vice president|head|chief|cpo|chro|ctlo|director|general manager)\b/i;
const TOPIC = /\b(people|talent|recruit\w*|human resources|hr|human capital|workforce|culture|employee (experience|relations|engagement|success)|total rewards|learning (and|&) development|organizational (development|effectiveness)|staffing|chro|chief people|chief human|chief talent)\b/i;
const NOISE = /\b(intern|interns|internship|coordinator|assistant|sourcer|analyst|specialist|generalist|engineer|software|designer|payroll|paralegal|apprentice|trainee)\b/i;
const DIR_NOISE = /\b(business partner|people partner|hrbp|partner|operations analyst|payroll|systems|technology|technical program)\b/i;

function wanted(title) {
  const t = normTitle(title);
  if (!LEVEL.test(t) || !TOPIC.test(t)) return false;
  if (!STRONG.test(t)) {                         // Director / GM level: stricter
    if (NOISE.test(t) || DIR_NOISE.test(t)) return false;
    if (!/\b(people|talent|hr|human resources|recruit\w*|culture|total rewards|human capital|workforce|employee)\b/i.test(t)) return false;
  } else if (/\b(intern|interns|internship|coordinator|assistant|sourcer|paralegal)\b/i.test(t)) return false;
  return true;
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
module.exports = { wanted, isNA, normTitle, TOPIC };
