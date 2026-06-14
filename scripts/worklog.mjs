#!/usr/bin/env node
// worklog.mjs — query WORKLOG.md cards by date / tag / component / status.
// Zero dependencies. Run with: node scripts/worklog.mjs [options]
//
//   --file <path>        path to the worklog (default: WORKLOG.md in cwd)
//   --since <YYYY-MM-DD>  only cards on or after this date
//   --until <YYYY-MM-DD>  only cards on or before this date
//   --tag <tag>          only cards whose tags include <tag>
//   --component <slug>   only cards with this component
//   --type <type>        only cards with this type
//   --status <status>    only cards with this status
//   --json               emit parsed cards as JSON instead of markdown
//
// A "card" is a YAML frontmatter block (--- ... ---) followed by its markdown body,
// exactly the layout the skill writes. Frontmatter is parsed with a deliberately
// small YAML reader: flat `key: value` pairs plus inline `[a, b]` lists. That covers
// the skill's schema and nothing more — if you start hand-writing nested YAML in a
// card, swap this for a real parser.

import { readFileSync } from "node:fs";

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (key === "json") opts.json = true;
      else opts[key] = argv[++i];
    }
  }
  return opts;
}

function parseFrontmatter(block) {
  const fm = {};
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // strip trailing inline comment (not inside brackets)
    if (!val.startsWith("[")) val = val.replace(/\s+#.*$/, "").trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      fm[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      fm[key] = val;
    }
  }
  return fm;
}

// Split the file into cards. Each card starts at a line that is exactly "---",
// runs to the next "---", and its body is everything up to the next card's "---".
function splitCards(text) {
  const lines = text.split("\n");
  const cards = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === "---") {
      const fmStart = i + 1;
      let j = fmStart;
      while (j < lines.length && lines[j].trim() !== "---") j++;
      if (j >= lines.length) break; // unterminated frontmatter — stop
      const fmBlock = lines.slice(fmStart, j).join("\n");
      // body runs from after the closing --- to the line before the next opening ---
      let k = j + 1;
      while (k < lines.length && lines[k].trim() !== "---") k++;
      const body = lines.slice(j + 1, k).join("\n").trim();
      cards.push({ frontmatter: parseFrontmatter(fmBlock), body });
      i = k;
    } else {
      i++;
    }
  }
  return cards;
}

function matches(card, opts) {
  const fm = card.frontmatter;
  if (opts.since && (!fm.date || fm.date < opts.since)) return false;
  if (opts.until && (!fm.date || fm.date > opts.until)) return false;
  if (opts.type && fm.type !== opts.type) return false;
  if (opts.component && fm.component !== opts.component) return false;
  if (opts.status && fm.status !== opts.status) return false;
  if (opts.tag) {
    const tags = Array.isArray(fm.tags) ? fm.tags : [];
    if (!tags.includes(opts.tag)) return false;
  }
  return true;
}

const opts = parseArgs(process.argv.slice(2));
const file = opts.file || "WORKLOG.md";

let text;
try {
  text = readFileSync(file, "utf8");
} catch {
  console.error(`worklog: cannot read ${file}`);
  process.exit(1);
}

const cards = splitCards(text)
  .filter((c) => matches(c, opts))
  // newest first by date string (YYYY-MM-DD sorts correctly as text)
  .sort((a, b) => String(b.frontmatter.date).localeCompare(String(a.frontmatter.date)));

if (opts.json) {
  console.log(JSON.stringify(cards, null, 2));
} else if (cards.length === 0) {
  console.error("worklog: no cards matched the filter");
} else {
  const out = cards
    .map((c) => {
      const fm = c.frontmatter;
      const head = Object.entries(fm)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(", ")}]` : v}`)
        .join("\n");
      return `---\n${head}\n---\n${c.body}`;
    })
    .join("\n\n");
  console.log(out);
}
