# ai-worklog

> A Claude skill that makes the AI write down *why* — at the moment it makes the call — so you can defend AI-written code in a standup.

**The problem:** AI writes the code. But it doesn't write the part of your brain that remembers *why* you did it that way.

So in standups you can't answer "walk me through your implementation" — you never held that answer in your head in the first place. You've gone from knowledge producer to routing layer between a manager's expectations and a model's output.

GitHub can give you a commit history. Linear can give you ticket status. Neither can tell you why you rejected the other approach — that reasoning only exists during the work itself, and it's gone the moment the session ends.

**The fix:** force the AI to emit a structured report card *at the moment of doing the work*, while the reasoning is still live, and accumulate them in a log you can scan before any meeting.

---

## What you get

After each substantive task (feature built, bug fixed, decision made), the AI outputs:

| Field | What it gives you |
|---|---|
| **What** | 1–2 sentences your manager can read without context |
| **Why** | The actual trade-off — what was rejected and why. This cannot be reconstructed after the session ends. |
| **Where** | File + function/line range. Open it mid-meeting and point at the screen. |
| **Verified** | What was tested. Unverified things are stated explicitly — no false confidence going into a review. |
| **Risks** | Known problems, by severity. |
| **Next** | The 1–3 most important next actions and what each is waiting on. |
| **Status** _(optional)_ | One-word lifecycle marker — `drafted` / `applied` / `verified` / `shipped` — so "is this actually live?" is answered at a glance. Built for the vibe-coding default where code exists but isn't running yet. |

Cards accumulate in `WORKLOG.md` at your project root. Say "give me a standup" and it rolls them into a status summary.

There's also an **exec tier** (`/report exec`): drops file paths and technical detail entirely, four plain-language fields only — for a non-technical PM, stakeholder, or manager who won't open the code.

**Works for knowledge work too** (secondary mode): the same card for AI-assisted analysis, reports, and research drafts. `Where` points at a document and section instead of a file and line; `Verified` tracks which facts and citations you actually checked against a source versus took straight from the model. Code is the primary case — but the reasoning evaporates just as fast when AI drafts your prose.

---

## Install

**Claude Code:** drop `ai-worklog.skill` into `.claude/skills/` in your project (or `~/.claude/skills/` for global), then restart.

**Claude desktop / web:** Settings → Capabilities → Skills → upload `ai-worklog.skill`.

---

## How to use it

**You don't have to do anything.** After each substantive change, the skill triggers automatically and appends a card to `WORKLOG.md`.

When you want to trigger manually or switch output format:

| Say this | What happens |
|---|---|
| `log this` / `write it up` | Emit a card for the last piece of work |
| `give me a standup` | Roll up recent WORKLOG entries into a status summary |
| `/report exec` | Non-technical version — no file paths, no jargon — for a PM or stakeholder |
| `for a non-technical manager` | Same as above |

**Set it and forget it** — say this once at the start of a session:
> For this session, auto-emit a worklog card after each substantive change and append it to WORKLOG.md. No need to prompt me each time.

---

## Verify it's working

1. Ask the AI to make any small change.
2. After it's done, say: `emit a worklog card`.
3. Check three things:
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
- There are explicit rules against AI-slop phrasing, so the card reads like something you'd actually say.
- It tracks **Status** (drafted / applied / verified / shipped), because AI-assisted work is usually "written but not live yet."

Already keep ADRs? This complements them. Let the ADRs hold the long-lived architecture record and let ai-worklog carry the meeting-facing summary.

## The underlying idea

The problem isn't vibe coding. It's that AI-assisted work creates a gap between *code that exists* and *understanding that lives in a person*. If you can explain the why and point to the where, the work is still yours — regardless of who typed it. This skill keeps that gap from forming.

---

MIT License — free to use, modify, and share. See `LICENSE`.

