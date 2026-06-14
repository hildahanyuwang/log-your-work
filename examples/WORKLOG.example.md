# Worklog — example

This is a sample `WORKLOG.md` so you can see what the accumulated log looks like.
Newest card on top. Each card is a frontmatter header + a prose body. Try:

```bash
node ../scripts/worklog.mjs --file WORKLOG.example.md --tag auth
node ../scripts/worklog.mjs --file WORKLOG.example.md --status shipped
```

---
date: 2026-06-12
type: bugfix
component: auth
tags: [auth, session, security]
status: shipped
ref: fix/refresh-race
mode: code
---
### Fixed token refresh firing twice on a cold start

**What:** When the app opened with an expired session, it sometimes hit the login server twice at once and one of the two requests would fail loudly. Users saw a flash of an error toast on launch. Gone now.

**Why:** Could have just swallowed the second failure in the UI, but that hides a real double-call that also doubles load on the auth server. Fixed the race at the source with a single in-flight promise instead, so only one refresh ever runs.

**Where:** `src/auth/session.ts`, `refreshToken()` ~L40–75 — added a module-level `inFlight` promise that callers await.

**Verified:** Reproduced the double-call by clearing the token and cold-starting 20 times — was ~3/20 before, 0/20 after. Unit test added in `session.test.ts`.

**Shortcuts:** The in-flight promise is module-global, so it assumes a single auth context per process. True for the app today; would break if we ever run two tenants in one worker.

**Risks:**
- Single-context assumption above. Low for now, documented in the code.

**Next:**
1. None blocking. Revisit the single-context assumption if multi-tenant lands.

---
date: 2026-06-10
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

**Shortcuts:** No progress events from the worker yet — the UI shows a generic spinner, not a real percentage. Fine while exports finish in a few seconds.

**Risks:**
- Safari untested — transfer may fail or fall back slowly. Medium.
- No progress indicator: very large exports look frozen to the user. Low.

**Next:**
1. Verify on Safari (blocker: need a test device).
2. Add a progress bar (no blocker).

---
date: 2026-06-09
type: decision
component: db
tags: [database, migration]
status: applied
ref: main
mode: code
---
### Kept the flat tags column instead of a join table

**What:** Decided how tags get stored. Left them as a single array column on the row rather than splitting them into their own table.

**Why:** A join table is the "correct" normalized design, but we only ever read all of a row's tags at once and never query across tags. The join would add a migration and a JOIN to every read for a flexibility we don't use yet. Chose the array column; we can migrate later if cross-tag queries actually show up.

**Where:** `db/schema.sql`, `cards` table — `tags text[]` column; no new table.

**Verified:** Schema applies cleanly on a fresh DB. Existing read path in `db/cards.ts` `listCards()` already returns the array, no change needed.

**Shortcuts:** This bets that we won't need "find everything tagged X" soon. If that query arrives, it's a migration, not a quick patch.

**Risks:**
- Cross-tag search would force a schema migration later. Low — not on the roadmap.

**Next:**
1. None. Revisit if a cross-tag filter gets requested.
