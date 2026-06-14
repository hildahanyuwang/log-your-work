# ai-worklog

> A Claude skill that makes the AI write down *why* — at the moment it makes the call — so you can defend AI-written code in a standup.

**The problem:** AI writes the code. But it doesn't write the part of your brain that remembers *why* you did it that way.

So in standups you can't answer "walk me through your implementation" — you never held that answer in your head in the first place. You've gone from knowledge producer to routing layer between a manager's expectations and a model's output.

GitHub can give you a commit history. Linear can give you ticket status. Neither can tell you why you rejected the other approach — that reasoning only exists during the work itself, and it's gone the moment the session ends.

**The fix:** force the AI to emit a structured report card *at the moment of doing the work*, while the reasoning is still live, and accumulate them in a log you can scan before any meeting.

---

## Quickstart (30 seconds)

1. **Install:** `unzip ai-worklog.skill -d .claude/skills/` then restart Claude Code (or upload `ai-worklog.skill` in Claude desktop/web → Settings → Skills).
2. **Turn it on for the session** — say once:
   > Auto-emit a worklog card after each substantive change and append it to WORKLOG.md. No need to prompt me each time.
3. **Work as normal.** After each real change, a card lands in `WORKLOG.md`.
4. **Before a standup:** say `give me a standup`, or pull a slice with `node scripts/worklog.mjs --since 2026-06-08`.

Cards come out in the language you're working in. Everything below is detail.

---

## What you get

After each substantive task (feature built, bug fixed, decision made), the AI outputs a card with a machine-readable header and a human-readable body.

| Field | What it gives you |
|---|---|
| **What** | 1–2 sentences your manager can read without context |
| **Why** | The actual trade-off — what was rejected and why. This cannot be reconstructed after the session ends. |
| **Where** | File + function/line range. Open it mid-meeting and point at the screen. |
| **Verified** | What was tested. Unverified things are stated explicitly — no false confidence going into a review. |
| **Shortcuts** | The corner that got cut and why it was OK for now. Answers "wait, did you handle X?" before it's asked. |
| **Risks** | Known problems and external constraints, by severity. |
| **Next** | The 1–3 most important next actions and what each is waiting on. |

Each card also carries a **YAML frontmatter header** — `date`, `type`, `component`, `tags`, `status`, `ref` — so the pile is queryable. `status` is the one-word lifecycle marker (`drafted` / `applied` / `verified` / `shipped`) that answers "is this actually live?" at a glance, built for the vibe-coding default where code exists but isn't running yet.

Cards accumulate in `WORKLOG.md` at your project root. Say "give me a standup" and it rolls them into a status summary — or run `node scripts/worklog.mjs --since <date> --tag <tag>` to pull exactly the slice you need.

There's also an **exec tier** (`/ai-worklog exec`): drops file paths and technical detail entirely, four plain-language fields only — for a non-technical PM, stakeholder, or manager who won't open the code.

**Works for knowledge work too** (secondary mode): the same card for AI-assisted analysis, reports, and research drafts. `Where` points at a document and section instead of a file and line; `Verified` tracks which facts and citations you actually checked against a source versus took straight from the model. Code is the primary case — but the reasoning evaporates just as fast when AI drafts your prose.

---

## Why frontmatter + prose

Pure prose logs are fine to read but expensive to *integrate* — at high commit velocity or across several projects, rolling a month of text into a weekly report means re-reading everything. So every card carries both layers:

```markdown
---
date: 2026-06-01
type: feature
component: export
tags: [performance, ui]
status: verified
ref: feat/export-worker
mode: code
---
### Moved image export off the main thread to fix UI freeze

**What:** ...
**Why:** ...
```

The body still reads like something a person said out loud. The header makes the pile filterable by date, component, tag, or status — without an LLM in the loop. See [`scripts/worklog.mjs`](scripts/worklog.mjs).

---

## Install

The packaged skill is `ai-worklog.skill` (a zip containing `ai-worklog/SKILL.md`).

**Claude Code:** skills are *directories*, not zip files. Unzip the package into your skills folder so you end up with `.claude/skills/ai-worklog/SKILL.md`:

```bash
# project-local
unzip ai-worklog.skill -d .claude/skills/
# or global
unzip ai-worklog.skill -d ~/.claude/skills/
```

Then restart Claude Code. (If you cloned this repo, you can also just copy the top-level `SKILL.md` into `.claude/skills/ai-worklog/SKILL.md` directly.)

**Claude desktop / web:** Settings → Capabilities → Skills → upload `ai-worklog.skill` as-is.

---

## How to use it

**You don't have to do anything.** After each substantive change, the skill triggers automatically and appends a card to `WORKLOG.md`.

When you want to trigger manually or switch output format:

| Say this | What happens |
|---|---|
| `log this` / `write it up` | Emit a card for the last piece of work |
| `give me a standup` | Roll up recent WORKLOG entries into a status summary |
| `/ai-worklog exec` | Non-technical version — no file paths, no jargon — for a PM or stakeholder |
| `for a non-technical manager` | Same as above |

> Note: `/ai-worklog` is the slash command (it matches the skill's name). The `exec` part is an argument the skill reads. Earlier drafts referred to `/report exec` — that never resolved as a real command; use `/ai-worklog exec` or just say "exec version."

**Set it and forget it** — say this once at the start of a session:
> For this session, auto-emit a worklog card after each substantive change and append it to WORKLOG.md. No need to prompt me each time.

---

## Automating the trigger

The skill auto-triggers from its description, but in deep "vibe coding" sessions it's easy to blow past it. Two interception points, depending on your tool:

**Cursor** — drop the rule in [`integrations/.cursorrules`](integrations/.cursorrules) into your project root (merge it into an existing `.cursorrules` if you have one). It tells Cursor to emit a card after any cross-file change or new component and save it under `logs/decision-records/`.

**Git** — [`scripts/worklog-to-commit.sh`](scripts/worklog-to-commit.sh) pulls the newest card out of `WORKLOG.md` and prints it as a commit-message body, so the reasoning travels with the commit:

```bash
git commit -m "$(scripts/worklog-to-commit.sh)"
# or wire it as a prepare-commit-msg hook — see comments in the script
```

**Claude Code** — the most reliable trigger is the "set and forget" session phrase above; the skill then fires after each substantive change on its own. (Claude Code hooks run shell commands on events — they can't make the model author a card — so the session instruction plus the skill description is the right mechanism here, not a hook.)

---

## Querying the log

[`scripts/worklog.mjs`](scripts/worklog.mjs) (Node, no dependencies) splits `WORKLOG.md` into cards, parses each frontmatter header, and filters:

```bash
node scripts/worklog.mjs                          # all cards, newest first
node scripts/worklog.mjs --since 2026-06-08        # this week
node scripts/worklog.mjs --tag api --status shipped
node scripts/worklog.mjs --component export --json  # machine-readable out
```

Use it to feed a standup, a weekly report, or another script.

---

## Verify it's working

1. Ask the AI to make any small change.
2. After it's done, say: `emit a worklog card`.
3. Check four things:
   - The **frontmatter header** is present and the `status` matches reality (don't mark `shipped` if it isn't merged)
   - **Where** has a real file path and line range — not "the auth module"
   - **Verified** explicitly states what wasn't tested, not just what was
   - **Why** names the option that was *rejected* and why — not just what was chosen
4. If Why just describes what was built without naming the alternative, push back: "what did you consider and rule out?"
5. Satisfied? Set the auto-trigger phrase and stop thinking about it.

---

## How it's different from ADRs and changelogs

Architecture Decision Records capture *architectural* decisions for the codebase's future maintainers. A changelog records *what shipped* for users. ai-worklog is written from neither angle — it's written from the **reporting** angle: what *you* need to walk into a standup and defend work you didn't type line by line.

Concretely:
- The **Why** is optimized for the question a person asks out loud — "why not the other way?" — not for archival completeness.
- **Where** is tuned to be openable mid-meeting (file + function/line), not a prose summary.
- **Shortcuts** is called out as its own field, because the cut corner is what detonates in review.
- There are explicit rules against AI-slop phrasing, so the card reads like something you'd actually say.
- The `status` header tracks lifecycle (drafted / applied / verified / shipped), because AI-assisted work is usually "written but not live yet."

Already keep ADRs? This complements them. Let the ADRs hold the long-lived architecture record and let ai-worklog carry the meeting-facing summary.

## The underlying idea

The problem isn't vibe coding. It's that AI-assisted work creates a gap between *code that exists* and *understanding that lives in a person*. If you can explain the why and point to the where, the work is still yours — regardless of who typed it. This skill keeps that gap from forming.

---

## Repo layout

| Path | What it is |
|---|---|
| `SKILL.md` | The skill itself — the source of truth |
| `README.md` | This file |
| `ai-worklog.skill` | Packaged skill (zip of `ai-worklog/SKILL.md` + `README.md`) for upload/install |
| `scripts/worklog.mjs` | Filter/query cards by date, tag, component, status |
| `scripts/worklog-to-commit.sh` | Pull the newest card into a git commit body |
| `integrations/.cursorrules` | Cursor rule to auto-emit cards on cross-file changes |
| `examples/WORKLOG.example.md` | A sample log so you can see the end product |
| `build.sh` | Rebuild `ai-worklog.skill` from source (forward-slash paths) |

Edit `SKILL.md`, then run `./build.sh` to regenerate `ai-worklog.skill` — don't hand-edit the zip.

---

MIT License — free to use, modify, and share. See `LICENSE`.
