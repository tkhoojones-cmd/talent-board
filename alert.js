// Opens (or updates) one GitHub issue when the crawl reports a problem, so the repo owner gets an email.
// Uses the gh CLI that is already on the runner. Does nothing when everything is healthy.
const fs = require("fs");
const { execFileSync } = require("child_process");
let rep; try { rep = JSON.parse(fs.readFileSync("crawl-report.json", "utf8")); } catch (e) { process.exit(0); }
const alerts = rep.alerts || [];
const TITLE = "Job feeds need attention";
const gh = (...a) => execFileSync("gh", a, { encoding: "utf8" });
try {
  const open = JSON.parse(gh("issue", "list", "--state", "open", "--search", `"${TITLE}" in:title`, "--json", "number,title"));
  const existing = open.find((i) => i.title === TITLE);
  if (!alerts.length) { if (existing) gh("issue", "close", String(existing.number), "--comment", "All feeds healthy again."); process.exit(0); }
  const body = "The robot found these problems in the latest run:\n\n" + alerts.map((a) => "- " + a).join("\n") + `\n\nRun: ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  if (existing) gh("issue", "comment", String(existing.number), "--body", body);
  else gh("issue", "create", "--title", TITLE, "--body", body);
} catch (e) { console.log("alert step could not reach GitHub:", String(e.message).slice(0, 120)); }
