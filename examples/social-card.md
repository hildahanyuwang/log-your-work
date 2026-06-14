# A worklog card

```yaml
date: 2026-06-12
type: bugfix
component: auth
tags: [auth, session, security]
status: shipped
```

### Fixed token refresh firing twice on a cold start

**What:** When the app opened with an expired session, it sometimes hit the login server twice at once and one request would fail loudly — users saw an error toast flash on launch. Gone now.

**Why:** Could have just swallowed the second failure in the UI, but that hides a real double-call that also doubles load on the auth server. Fixed the race at the source with a single in-flight promise, so only one refresh ever runs.

**Where:** `src/auth/session.ts`, `refreshToken()` ~L40–75 — a module-level `inFlight` promise that callers await.

**Verified:** Reproduced the double-call by clearing the token and cold-starting 20 times — ~3/20 before, 0/20 after. Unit test added in `session.test.ts`.

**Shortcuts:** The in-flight promise is module-global, so it assumes one auth context per process. True today; would break if we ever run two tenants in one worker.

**Risks:** Single-context assumption above. Low for now, documented in the code.

**Next:** None blocking. Revisit the single-context assumption if multi-tenant lands.
