---
name: ai-worklog
description: After completing any substantive coding task — writing a feature, fixing a bug, refactoring, running an experiment — emit a "report card" alongside the code so the human can explain what changed, why, and what's next without re-reading everything. Use this whenever you finish a unit of work the user will eventually have to report on, defend in a meeting, or hand off — especially in fast "vibe coding" sessions where the human didn't write the code line-by-line and won't otherwise have the details in their head. Trigger even if the user didn't explicitly ask for a summary; the cost of being asked "where's the code for this?" in a meeting and not knowing is exactly what this prevents. Also use when the user says "log this," "what did we do," "write it up," "append to the worklog," or asks for a standup/status update on recent work. Supports a condensed "exec" version (triggered by "/ai-worklog exec" or "for a non-technical manager") that drops code-level detail for non-technical stakeholders. The same applies to AI-assisted knowledge work — analysis, reports, research drafts — where the reasoning and the source-checking vanish just as fast; coding is the primary case, knowledge work a documented secondary mode.
---

# AI Worklog

## The problem this solves

When AI writes the code, the code ships — but the *mental ledger* doesn't. The engineer can't answer "why this approach?", "where's the relevant code?", or "what's still open?" in a meeting, because they never held those answers in their head in the first place.

Reconstructing the record afterward is lossy: re-reading generated code produces a plausible-sounding story, not the real one. The Why — the actual trade-off faced, the option rejected — is gone the moment the session ends. GitHub can give you a commit history. Linear can give you ticket status. Neither can tell you why you rejected the other approach. That reasoning only exists during the work itself.

The fix: capture the report-ready record **at the moment of doing the work**, from the *reporting perspective* (what the next conversation needs), not the *implementation perspective* (what the diff contains).

---

## When to emit a card

Emit one card after each **substantive** unit of work:
- Feature or component built
- Bug fixed
- Refactor or migration completed
- Experiment run (including failures — failed experiments are decisions too)
- Non-trivial decision made (chose A over B, changed the data model, picked a library)

Skip trivial mechanical steps (renaming a variable, reformatting, fixing a typo). Batch a few tiny related edits into one card if they belong together.

**Knowledge work counts too** (secondary mode): a section drafted with AI, a claim or figure you sourced (or didn't), an analytical framing chosen over another, a paragraph you'll put your name on. The unit is the same — a choice someone could question later.

**The test:** would this come up in a status meeting, or could someone be confused about it later? If no — skip it.

---

## Persisted format: frontmatter + prose

Every persisted card has two layers so it's **both machine-readable and human-readable**:

1. A **YAML frontmatter block** at the top — for scripts that filter and roll up by date, type, or tag.
2. The **human-readable card body** below it — the part you read aloud in a meeting.

The frontmatter schema (all on the card, between `---` fences):

```yaml
---
date: 2026-06-01          # YYYY-MM-DD, the day the work was done
type: feature             # feature | bugfix | refactor | experiment | decision | docs | knowledge
component: export         # short slug for the area touched (one word, lowercase)
tags: [performance, ui]   # free-form labels for filtering/rollup
status: verified          # drafted | applied | verified | shipped
ref: feat/export-worker   # optional — branch / PR / commit
mode: code                # code (default) | knowledge
---
```

Keep frontmatter values short and consistent — they're filter keys, not prose. Put the nuance in the body. Reuse the same `component` and `tag` spellings across cards so a script can group them (`export`, not `Export`/`exporting`/`the export pipeline`).

> Why frontmatter and not pure prose: a 30-second script can then turn a month of cards into a weekly report or a standup script, filtered by tag or component — without re-reading anything. The prose body keeps the card sounding like a person; the frontmatter makes the pile queryable. See `scripts/worklog.mjs` in the package for a reference extractor.

---

## Card format — Full (default)

Use this for the user themselves, engineering leads, code reviewers: anyone who can and will open the code.

```markdown
---
date: YYYY-MM-DD
type: feature
component: <slug>
tags: [<tag>, <tag>]
status: applied
ref: <branch/PR/commit if known>
mode: code
---
### [Title: what got done, in plain language]

**What:** 1–2 sentences a non-technical manager would understand. No API names, no jargon.

**Why:** The trade-off that was actually faced — what alternative was rejected and why. This is the highest-value field. It proves judgment was exercised, and it cannot be reconstructed faithfully after the fact. Write it from memory of the decision as it happened, not from re-reading the code. If two approaches were considered, name both. If something was ruled out fast, say why.

**Where:** File(s) touched, with the location of the core logic — file + function name, or file + line range. Must be specific enough to open and point at mid-meeting. "Updated the auth module" is not acceptable. "`auth/session.ts`, `refreshToken()` ~L40–75" is.

**Verified:** What was actually run and the result. Anything NOT verified must be stated explicitly — never imply something was checked when it wasn't. "Not tested on mobile" is a complete sentence.

**Shortcuts:** _(optional — but include it whenever a corner was cut.)_ The compromise the current code makes and why it was acceptable for now: a workaround for an upstream bug, a hard-coded value, a skipped edge case, a non-standard pattern. This is the field that saves you when someone asks "wait, did you handle X?" — answer it before they ask. "None" is allowed but only after a real look.

**Risks:** Known problems, ordered by severity. Includes external constraints — a pinned dependency version, a platform assumption, an API that might change under you. "None" is allowed but requires genuine consideration before writing it.

**Next:** The 1–3 most important next actions, each with its blocking dependency if any. This is the answer to "so what's the plan?"
```

The `Status` field from earlier versions now lives in frontmatter (`status:`). It's the one-glance lifecycle marker; `Verified` holds the evidence behind it. Use it whenever code exists that isn't live yet — the most common vibe-coding state.

---

## Card format — Exec (on request)

Triggered by: `/ai-worklog exec`, "exec version", "for a non-technical manager", "non-technical stakeholder."

Drop `Where`, `Verified`, and `Shortcuts` entirely. Strip all jargon from the remaining fields. The split is by **technical depth of the reader**, not by formality or length. Keep a minimal frontmatter block so exec cards still roll up.

```markdown
---
date: YYYY-MM-DD
type: feature
status: shipped
audience: exec
---
### [Plain-language title]

**What:** What changed for the user or the business. Zero technical vocabulary.

**Why:** What was chosen and what was given up — in terms anyone can follow.

**Risks:** What could still go wrong, and how serious. Plainly stated.

**Next:** What happens next and what it depends on.
```

When in doubt about which version is needed, produce Full and offer to condense.

---

## Two modes: code (primary) and knowledge work

The card is identical in both. Set `mode: knowledge` in frontmatter for the second case. Only two body fields shift:

- **Where** — Code: file + function/line (`auth/session.ts`, `refreshToken()` ~L40–75). Knowledge work: the document plus the section or the specific claim (`Q3-memo.md`, "Section 3, the comparison of the two enforcement regimes").
- **Verified** — Code: what ran and the result. Knowledge work: which facts, figures, and citations were checked against a real source, and which came straight from the model unchecked. For AI-drafted analysis this is the highest-stakes field — an unverified statistic or a hallucinated citation is the prose equivalent of code that doesn't compile.

Everything else (What, Why, Shortcuts, Risks, Next, frontmatter) is the same. Code is the default framing throughout this doc; when the work is prose, read "file" as "document" and "tested" as "source-checked."

---

## Output language

Write the **card body in the language the user is working in**. If the conversation is in Chinese, the content of What / Why / Where / etc. is in Chinese; if it's in English, English. Match the user — don't default to English just because this doc is in English.

Two things stay fixed regardless of language:

- **The field labels** — `What`, `Why`, `Where`, `Verified`, `Shortcuts`, `Risks`, `Next`. Keep them in English.
- **The frontmatter keys and their enum values** — `type: feature`, `status: shipped`, `mode: code`, etc. Keep these exact.

These are structural, not prose: `scripts/worklog.mjs`, the standup rollup, and the commit helper all match on them, and consistent labels keep a mixed-language team's log greppable. Translating them silently breaks the tooling. Free-text frontmatter values (`component`, `tags`, `ref`) can be in any language, but keep each one spelled consistently across cards so filters still group them.

---

## Hard rules

**Honesty over polish.** A card that smooths over uncertainty gives false confidence in a meeting — that's worse than no card. If something is unknown, write "unknown." If something wasn't tested, say so explicitly.

**Why must come from the live decision, not reverse-engineered from the code.** If the reasoning genuinely isn't recoverable because it spanned too many turns, write "reasoning unclear at this point" rather than inventing a clean narrative. An honest gap is more useful than a fabricated rationale.

**Retroactive logging degrades the Why — flag it.** This skill works best emitted live, right after each task. When you instead reconstruct a whole session at once, or log work from much earlier turns, the oldest cards' Why is the first thing to rot. If you're writing a card well after the decision and can't recall the actual trade-off, write "logged after the fact — original trade-off no longer certain" instead of back-filling a tidy story. Marking the gap beats laundering a guess into a confident rationale.

**Where must be navigable.** The standard: can the human open the file and point at the right code while someone is watching their screen? If not, it's not specific enough. Always give file + function or file + line range — never just a module or directory name. For knowledge work the equivalent is document + section or the exact claim — never just "the report."

**Shortcuts are not optional honesty.** If the code cut a corner, the card says so. A hidden shortcut is the thing that detonates in a review when someone hits the edge case you skipped. Naming it first is the whole point of defending your work.

**What is manager-readable; everything else is engineer-readable.** The What line is the one a non-technical stakeholder reads first. It should stand alone without the rest of the card.

**Frontmatter is for filtering, not prose.** Keep values short, lowercase, and consistent across cards. Never put a sentence in a frontmatter field — that's what the body is for.

**No padding.** No "this is an important change." No restating the whole codebase. The reader's attention is limited and the card competes with everything else in the meeting.

## Writing style — What and Why only

What and Why are the fields a human reads aloud or quotes verbally. They must sound like something a person actually said, not generated text. Apply these rules strictly to What and Why; other fields can be neutral.

**No AI sentence scaffolding.** Banned patterns:
- "It's worth noting that..."
- "This ensures that..."
- "By doing X, we achieve Y..."
- "Not only X, but also Y..."
- "This is particularly important because..."

**No decorative punctuation.** Em dashes used for dramatic pause, excessive commas creating rhythm, semicolons connecting things that should just be two sentences — all of these signal generated text. Write shorter sentences instead.

**No hedging that sounds like a disclaimer.** "It should be noted," "it is important to mention," "as mentioned above" — cut them. Say the thing directly.

**Concrete over abstract.** "The old approach would have still stuttered on large files" beats "the alternative solution presented certain performance limitations." Name the actual problem, not a category of problem.

**Write like a person, not a report.** Write the way an engineer would explain it to a teammate over lunch, not the way a formal report reads.

**The test for both fields:** read it out loud. If it sounds like something you'd say in a meeting, it passes. If it sounds like something you'd read off a slide someone else made, rewrite it.

---

## Persisting to WORKLOG.md

When working in a repo or project directory: append each card to `WORKLOG.md` at the project root, newest entry at the top. Each card carries its own frontmatter block (above), so the date lives in `date:` — no separate date heading is needed. Create the file if absent.

Keep one blank line between cards so a script can split the file on the `---` frontmatter fences. The reference extractor (`scripts/worklog.mjs`) reads exactly this layout.

If using git: append the card in the same commit as the code. The log and the code travel together; the card is permanently tied to that state of the repo. The package ships `scripts/worklog-to-commit.sh` to pull the newest card into a commit message body.

If there's no project directory (one-off scripts, exploratory sessions): output the card inline in the response.

**If the project already keeps a progress or handoff doc** (e.g. `PROGRESS.md`, `CHANGELOG.md`, a design log): don't duplicate it. The worklog's unique value is the `Why`, `Verified`, `Shortcuts`, and `Risks` those docs usually leave out. Capture those, and cross-reference the existing doc for the rest — don't copy status and next-steps into two files that will drift apart.

---

## Standup / status rollup on request

When the user asks "what did we do this week," "give me a standup," "roll up the log," or similar: read `WORKLOG.md` (or scroll back through the session if no file exists) and produce the summary below.

Use the frontmatter to scope and group: filter by `date:` for the time window, group by `component:` or `tags:` when the user asks about a specific area, and read `status:` to sort shipped from in-progress. If the project uses `scripts/worklog.mjs`, prefer running it to gather the cards (e.g. `node scripts/worklog.mjs --since 2026-06-08 --tag api`) rather than eyeballing the whole file.

```markdown
## Status — [date range]

**Shipped:** [What lines from cards with status: shipped/verified, as bullets]
**In progress:** [status: drafted/applied — what's mid-stream and its current blocker]
**Decisions made:** [notable Why entries — these are what stakeholders re-litigate most often]
**Shortcuts taken:** [open Shortcuts entries that haven't been paid back yet]
**Risks to flag:** [open Risks items leadership should know, by severity]
**Next:** [consolidated Next items, deduplicated and prioritized]
```

Readable in under a minute. Lead with what shipped. Put risks where they won't be missed.

---

## Examples

**Bad** — implementation-perspective, not navigable, hides uncertainty:
> Refactored the export pipeline and improved performance.

**Good — Full card:**
```markdown
---
date: 2026-06-01
type: feature
component: export
tags: [performance, ui, worker]
status: verified
ref: feat/export-worker
mode: code
---
### Moved image export off the main thread to fix UI freeze

**What:** Large exports were freezing the UI for a few seconds. Now they run in the background and the app stays usable throughout.

**Why:** Could have chunked the work on the main thread — simpler, but it would still stutter on big files. Went with a Web Worker instead because the stutter itself was the complaint; halving it wouldn't have been enough.

**Where:** `src/export/exportWorker.ts` (new file, all offloaded logic); wired into `src/export/useExport.ts`, `runExport()` ~L55–90.

**Verified:** Tested PNG and TIFF export on a 30-image board — no UI freeze, byte output matches the old path. NOT tested on Safari: Worker transferable-object support there is unconfirmed.

**Shortcuts:** No progress events from the worker yet — the UI just shows a generic spinner, not real percentage. Fine for now because exports finish in a few seconds; would need rework if we add 500-image batches.

**Risks:**
- Safari untested — transfer may fail or fall back slowly. Medium.
- No progress indicator: very large exports look frozen to the user. Low.

**Next:**
1. Verify on Safari (blocker: need a test device).
2. Add a progress bar (no blocker).
```

**Same work, Exec card:**
```markdown
---
date: 2026-06-01
type: feature
status: verified
audience: exec
---
### Fixed the freeze that happened during large exports

**What:** Exporting a lot of images at once used to freeze the app for a few seconds. That's fixed now — it runs in the background.

**Why:** There was a quicker fix that would have made it less bad but not actually smooth. We skipped that and did it properly, because a partial fix tends to just come back as a complaint later.

**Risks:** Not yet confirmed to work on Safari (Apple's browser). Medium priority to check.

**Next:** Verify on Safari, then add a visual indicator so users know the export is running.
```

**Knowledge-work card (secondary mode):**
```markdown
---
date: 2026-06-02
type: knowledge
component: market-overview
tags: [enforcement, draft]
status: drafted
ref: draft v3
mode: knowledge
---
### Reframed the market-overview section around enforcement, not adoption

**What:** The section now leads with how the rules get enforced in practice, instead of how fast the technology is being adopted.

**Why:** The adoption angle read as cheerleading, and every competing report already opens that way. Enforcement is the one cut that's actually contested, so it's where the section earns its place. Considered keeping both framings and cut it — the section was already too long to carry two spines.

**Where:** `market-overview.md`, "Section 2 — Enforcement in practice" (rewritten); the old adoption framing moved to the appendix.

**Verified:** Re-checked the three enforcement figures against the primary regulator filings — two confirmed, one (the 2025 penalty total) is still model-supplied and NOT verified, flagged inline. Two quotes still need source links.

**Shortcuts:** Left the two quotes in without source links for now, marked TODO inline. Acceptable only until this leaves draft.

**Risks:**
- The unverified penalty figure is load-bearing for the argument. High until checked.
- Moving adoption to the appendix may read as burying it, to a reviewer who expects it up front. Low.

**Next:**
1. Verify the 2025 penalty total before this goes to review (blocker: regulator's annual report).
2. Add source links for the two quotes.
```

**What a bad Why looks like — and why it fails:**
```markdown
**Why:** Used a Web Worker for better performance.
```
This is reverse-engineered from the code, not from the decision. It tells the reader *what* was done, not *why that over the alternative*. In a meeting, someone will ask "why not just do X?" and this card gives you nothing. A real Why names the option that was rejected and the specific reason it lost.
