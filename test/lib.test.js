const { wanted, wantedIC, borderline, payRange, isNA, offTargetTitle, blockedCompany, cleanCompany, keepListing, parseRegistry, mergeRegistry } = require("../lib");
let bad = 0;
const t = (name, got, want) => { if (got !== want) { bad++; console.log("FAIL", name, "got", got, "want", want); } };
const yes = ["Chief People Officer","VP, People","Head of People & Places","SVP Human Resources","Vice President of Talent Acquisition","Vice-President, People","V.P. People","VP, International People","VP Talent & Leadership Development","Head of Talent Acquisition, Engineering & Product","Chief People Officer & General Counsel","VP, Employee Relations & Engagement","Director of Human Resources","Director of People","Director, HR","Head of Executive Recruiting","Head of Technical Recruiting","Head of Learning & Development","Head of Employee Success","Head of the People Team","Head of North America Talent","Chief Human Resources Officer","VP Total Rewards","Head of Talent","Senior Director, Talent Acquisition","VP, HR - Operations"];
const no = ["Recruiting Coordinator","Senior Software Engineer","VP Engineering","Director, Business Partner People","People Analyst","Head of Sales","Talent Acquisition Specialist","Director of Marketing","Chief Financial Officer","Payroll Manager","VP of Engineering, Workforce Management","Vice President, Legal - Total Rewards and Employment","Product Design Director - HR Design","Global Workforce Optimization Data Architecture Lead Analyst Vice President"];
yes.forEach((x) => t("wanted: " + x, wanted(x), true));
no.forEach((x) => t("not wanted: " + x, wanted(x), false));
const locYes = ["San Francisco, CA","Remote","Remote - US","Remote (US only)","Toronto, ON","Vancouver, BC","New York or London","San Francisco / London","Santa Fe, New Mexico, US","London, Ontario, Canada","Kansas City, MO","","Remote, Canada; Remote, United States","UK / Remote (US)","Hybrid (NYC)","Foster City, CA"];
const locNo = ["London, UK","Remote - India","Remote - Europe","Remote, Mexico","Bangalore, IN","Sydney, Australia","Remote - EMEA","Berlin, Germany","Singapore"];
locYes.forEach((x) => t("NA: " + x, isNA(x), true));
locNo.forEach((x) => t("not NA: " + x, isNA(x), false));
const icYes = ["Executive Recruiter","Principal Recruiter","Staff Technical Recruiter","Principal Talent Partner","Executive Recruiting Lead","Lead Executive Recruiter","Senior Executive Recruiter, Engineering","Principal Executive Recruiter"];
const icNo = ["Senior Recruiter","Technical Recruiter","Recruiting Manager","Head of Recruiting","VP Recruiting","Director, Executive Recruiting","Recruiting Coordinator","Executive Assistant","Recruiter","Executive Recruiter Intern","Principal Software Engineer","Recruiting Operations Lead","Contract Executive Recruiter"];
icYes.forEach((x) => t("IC: " + x, wantedIC(x), true));
icNo.forEach((x) => t("not IC: " + x, wantedIC(x), false));
["Senior Manager, Talent Acquisition","People Operations Lead","Lead, People & Culture"].forEach((x) => t("borderline: " + x, borderline(x), true));
["Recruiting Coordinator","Senior Software Engineer","People Analyst","VP, People","Director of Marketing","Head of Sales","Senior Recruiter"].forEach((x) => t("not borderline: " + x, borderline(x), false));
t("pay 1", (payRange("Pay range: $185,000 - $309,000 per year") || {}).max, 309000);
t("pay 2", (payRange("$250K to $300K") || {}).max, 300000);
t("pay 3", payRange("We pay well"), null);
t("pay 4", (payRange("$120 - $150 per hour") || {}).max, undefined);
t("student admissions", offTargetTitle("Senior Director, Student Recruitment & Enrollment - New York"), true);
t("student still unwanted", wanted("Senior Director, Student Recruitment & Enrollment - New York"), false);
t("sales recruiting stays", wanted("Head of Sales Recruiting, AMER"), true);
t("technical recruiting stays", wanted("Head of Technical Recruiting"), true);
t("people partners stay", wanted("Head of People"), true);
t("engineering hr tech", wanted("VP, Engineering - HR Technology"), false);
t("people technology stays", wanted("Head of People Technology"), true);
t("volunteer program stays", wanted("Employee Engagement and Volunteerism, Vice President"), true);
t("clinical recruitment", offTargetTitle("Director of Clinical Recruitment"), true);
t("jobgether blocked", blockedCompany("Jobgether"), true);
t("anduril not blocked", blockedCompany("Anduril Industries"), false);
t("clean anduril", cleanCompany("Andurilindustries"), "Anduril Industries");
t("clean datadog", cleanCompany("Datadog Careers | Datadog"), "Datadog");
t("clean amazon", cleanCompany("Amazon.jobs"), "Amazon");
t("clean pathos", cleanCompany("Rippling Recruiting", { url: "https://ats.rippling.com/pathos/jobs/abc" }), "Pathos");
t("clean rippling", cleanCompany("Rippling Recruiting", { url: "https://ats.rippling.com/rippling/jobs/abc" }), "Rippling");
t("clean pediatrics", cleanCompany("Indeedbtrbt"), "Pediatrics Plus");
t("clean launchdarkly", cleanCompany("Launchdarkly"), "LaunchDarkly");
t("drop jobgether", keepListing({ company: "Jobgether", title: "Head of People" }), false);
t("keep real head of people", keepListing({ company: "Zip", title: "Head of People Operations & Total Rewards" }), true);
t("ic stays", wantedIC("Staff Technical Recruiter"), true);
t("registry not json", parseRegistry("nope"), null);
t("registry object wrapper", parseRegistry({ companies: [{ name: "Acme", domain: "acme.com", ats: "greenhouse", token: "acme", discovered_via: "Forbes AI 50", first_seen: "2026-11-01" }] }).length, 1);
const duped = parseRegistry([
  { name: "First", domain: "one.example", ats: "lever", token: "acme", first_seen: "2026-11-01" },
  { name: "Same token", domain: "two.example", ats: "lever", token: "acme", first_seen: "2026-11-02" },
  { name: "Same domain", domain: "one.example", ats: "ashby", token: "other", first_seen: "2026-11-03" }
]);
t("registry dedupes token and domain", duped.length, 1);
t("registry keeps oldest", duped[0].name, "First");
const fromUrl = parseRegistry([{ name: "Northwind", careers_url: "https://job-boards.greenhouse.io/northwind/jobs/1" }]);
t("registry reads greenhouse url", fromUrl[0] && fromUrl[0].ats + ":" + fromUrl[0].token, "greenhouse:northwind");
t("registry skips aggregator", parseRegistry([{ name: "Jobgether", ats: "lever", token: "jobgether" }]).length, 0);
const boards = { greenhouse: ["stripe"], lever: [], ashby: [], workable: [], rippling: [], smartrecruiters: [], recruitee: [], icims: [], oracle: [], taleo: [], successfactors: [], names: {}, registry: {} };
const wd = new Map();
const list = parseRegistry([
  { name: "Stripe", domain: "stripe.com", ats: "greenhouse", token: "stripe" },
  { name: "Piedmont", domain: "piedmont.example", ats: "ashby", token: "piedmont", discovered_via: "YC", first_seen: "2026-01-01" },
  { name: "Harbor", domain: "harbor.example", careers_url: "https://harbor.wd5.myworkdayjobs.com/en-US/External/job/x", first_seen: "2026-01-02" },
  { name: "Later", domain: "later.example", ats: "lever", token: "later", first_seen: "2026-02-01" }
]);
const merged = mergeRegistry(boards, wd, list, 2);
t("registry cap", merged.added.length, 2);
t("registry already curated", merged.already, 1);
t("registry held", merged.capped, 1);
t("registry added ashby", boards.ashby.includes("piedmont"), true);
t("registry added workday", wd.has("harbor" + "External"), true);
t("registry did not add capped", boards.lever.includes("later"), false);
t("registry remembered", boards.registry["ashby:piedmont"].discoveredVia, "YC");
console.log(bad ? bad + " failures" : "all passed"); process.exit(bad ? 1 : 0);
