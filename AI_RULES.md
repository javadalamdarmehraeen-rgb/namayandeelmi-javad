# AI RULES
# Namayande Elmi
# Rules for AI Agents / Agent Mode

This file contains mandatory rules for any AI agent working on this repository.

These rules exist because the project has a long iterative development history
and contains interconnected systems.

The agent must protect existing functionality before adding new functionality.

---

# 1. GOLDEN RULE

DO NOT CHANGE CODE JUST BECAUSE YOU THINK IT CAN BE BETTER.

The existing implementation is the baseline.

A requested change must be implemented with the smallest safe modification
that satisfies the request.

Do not redesign unrelated parts of the system.

---

# 2. REQUIRED READING ORDER

Before making ANY code change, the AI agent MUST read:

1. AI_PROJECT_CONTEXT.md
2. AI_ARCHITECTURE.md
3. AI_RULES.md
4. AI_DECISION_LOG.md

Then inspect:

5. Relevant source files
6. Relevant Git history
7. Relevant documentation
8. Relevant configuration

Only after this process may implementation begin.

---

# 3. READ-ONLY FIRST

Every non-trivial task starts in READ-ONLY mode.

The agent must first determine:

- What the user wants
- Which subsystem is involved
- Which files implement the subsystem
- Which APIs are involved
- Which database tables are involved
- Which other components depend on it
- Which historical changes affected it
- What could break

The agent must not start coding immediately.

---

# 4. NO GUESSING

If information is missing:

DO NOT GUESS.

Use one of:

UNKNOWN
NEEDS AUDIT
NEEDS USER CLARIFICATION

Examples:

If the agent does not know why a function exists:

WRONG:
"This function was created for X."

CORRECT:
"The historical reason is not currently verified."

---

# 5. SOURCE OF TRUTH

Use the following priority:

1. Current source code
2. Database schema / migrations
3. Existing project documentation
4. Git history
5. AI_PROJECT_CONTEXT.md
6. AI_ARCHITECTURE.md
7. AI_DECISION_LOG.md
8. User's explicit current request
9. Inference

Historical assumptions must never override actual current source behavior.

---

# 6. CURRENT USER REQUEST HAS PRIORITY

The current user's explicit request defines the task.

However:

A request to modify one feature does NOT authorize unrelated refactoring.

Example:

User:
"Fix pharmacy search."

The agent is NOT authorized to:

- redesign the database
- rewrite authentication
- replace the CRM
- rewrite the UI framework
- remove old files
- modify synchronization

unless required by the requested fix and explicitly explained.

---

# 7. MINIMAL CHANGE PRINCIPLE

Prefer:

ONE FEATURE
    ↓
SMALLEST REQUIRED CHANGE
    ↓
TEST
    ↓
VERIFY

Avoid:

ONE FEATURE
    ↓
GLOBAL REFACTOR
    ↓
MANY FILES
    ↓
UNPREDICTABLE REGRESSIONS

---

# 8. NO UNAUTHORIZED REFACTORING

Do not refactor code simply because:

- it is old
- it is duplicated
- it is long
- it looks ugly
- a newer framework exists
- a different architecture appears cleaner

Refactoring requires a reason.

If refactoring is necessary:

Explain:

- Why
- Which files
- What dependencies exist
- What can break
- How it will be tested
- How it can be rolled back

---

# 9. DO NOT DELETE FILES CASUALLY

Never delete a file because its name looks old.

Before deletion:

1. Search all repository references.
2. Search imports.
3. Search HTML script references.
4. Search API references.
5. Search configuration references.
6. Inspect Git history.
7. Check deployment references.
8. Check whether another subsystem depends on it.

If uncertain:

DO NOT DELETE.

---

# 10. VERSIONED CRM FILES

The repository contains versioned CRM feature files.

Examples:

crm-features-v9.js
crm-features-v10.js
crm-features-v11.js
crm-features-v12.js
crm-features-v13.js
crm-features-v14.js
crm-features-v15.js
crm-features-v16.js
crm-features-v17.js
crm-features-v18.js

Do not assume these files are obsolete.

Do not merge them.

Do not delete them.

Do not change script loading order.

unless dependency analysis proves it is safe and the change is required.

---

# 11. crm-app.js IS HIGH RISK

crm-app.js is a central CRM file.

Git history shows that a syntax break in crm-app.js previously caused
main-tab restoration work.

Therefore:

Before modifying crm-app.js:

1. Inspect syntax.
2. Search all global functions used by it.
3. Search all functions that depend on it.
4. Inspect script loading order.
5. Inspect related feature files.
6. Test navigation.
7. Test forms.
8. Test lists.
9. Test browser console.

Do not rewrite the file unnecessarily.

---

# 12. FORM / LIST / MANUAL DESIGNER

The Form/List/Manual Designer subsystem is HIGH RISK.

It includes functionality related to:

- field order
- field size
- form/list visibility
- row/stack
- boxes
- widgets
- tabs
- searchable selects
- freeze headers
- required fields
- edit/delete
- scroll restoration
- manual designer
- manual designer lock
- selective copy

This subsystem evolved through many versions.

Do not replace it with a generic form system.

Do not redesign it unless explicitly requested.

---

# 13. DEFAULT LIST BEHAVIOR

Configuration related to default list behavior must be treated carefully.

Git history contains a specific restoration related to:

DEFAULT_LIST_ON

Do not remove or rename this kind of configuration without verifying all
references and current behavior.

---

# 14. DATABASE RULE

Database changes are HIGH RISK.

Before changing the database:

1. Inspect src/db/schema.ts
2. Inspect migrations
3. Search all table references
4. Search API usage
5. Search UI usage
6. Check seed/demo data if applicable
7. Check backup/restore
8. Check synchronization
9. Check production compatibility

Do not change database schema just to make a frontend task easier.

---

# 15. DATABASE MIGRATION RULE

Never modify an existing migration casually.

Prefer creating a new migration for a new schema change.

Before migration:

Explain:

- Existing schema
- New schema
- Migration direction
- Data compatibility
- Rollback strategy

---

# 16. AUTHENTICATION RULE

Authentication is a security boundary.

Do not modify authentication casually.

Relevant areas may include:

/api/auth/*
/api/mobile/*
sessions
OTP
passwords
device authentication

Never expose:

- passwords
- tokens
- secrets
- API keys
- session secrets
- database credentials

---

# 17. AUTHORIZATION RULE

Never assume frontend visibility is sufficient authorization.

If a feature involves permissions:

Check:

- UI permission
- API permission
- server-side authorization
- database access

Do not grant additional privileges simply to make a UI feature work.

---

# 18. MOBILE AUTHENTICATION RULE

Mobile authentication is HIGH RISK.

The repository documents mobile authentication involving concepts such as:

- nonce
- timestamp
- device ID
- phone
- SIM fingerprint
- HMAC-SHA256
- MOBILE_APP_SECRET

Do not modify this flow unless the task explicitly concerns it.

Any change requires:

- security analysis
- API compatibility analysis
- mobile compatibility analysis
- testing

---

# 19. SYNCHRONIZATION RULE

Synchronization is HIGH RISK.

Known concepts include:

uid
updated_at
origin

and synchronization endpoints.

Never modify sync behavior casually.

Before changing sync:

1. Inspect both sides.
2. Inspect pull.
3. Inspect push.
4. Inspect conflict resolution.
5. Inspect authentication.
6. Inspect environment variables.
7. Inspect deployment topology.
8. Test both directions.

---

# 20. SYNC CONFLICT RULE

Do not change conflict behavior without explicitly explaining:

- Current behavior
- Proposed behavior
- Why it is necessary
- Possible data loss
- How conflicts are resolved
- Rollback plan

Never silently change Last-Write-Wins behavior.

---

# 21. PWA / OFFLINE RULE

PWA and offline behavior is HIGH RISK.

Do not disable:

- service worker
- cache
- IndexedDB
- offline mode
- background sync
- offline route

just to solve a normal online UI problem.

If a change affects caching:

Test:

1. Online first load
2. Online navigation
3. Offline navigation
4. Return online
5. Cache update
6. Authentication
7. API calls

---

# 22. MAP / GPS RULE

Mapping and GPS functionality is sensitive to:

- browser permissions
- GPS
- geocoding
- Leaflet
- GeoJSON
- trip tracking
- location APIs

Do not replace mapping infrastructure for a minor UI change.

Trace the actual implementation first.

---

# 23. MESSAGING RULE

Messaging providers may include:

- Telegram
- Bale
- Eitaa
- WhatsApp

Never expose provider credentials.

Never hard-code tokens.

Never print tokens to logs.

Before changing messaging:

Check:

- provider
- API URL
- authentication
- retries
- message formatting
- logging
- error handling

---

# 24. DEPLOYMENT RULE

Production deployment is HIGH RISK.

Do not change:

- Render configuration
- render.yaml
- start command
- build command
- environment variables
- CI/CD
- deployment hooks

unless required.

Before deployment changes:

Inspect:

- package.json
- render.yaml
- GitHub workflows
- GitLab CI
- environment configuration

---

# 25. PACKAGE.JSON RULE

Do not change package.json scripts casually.

Before changing:

- build
- start
- dev
- prebuild
- dependencies

verify how Render and local development use them.

---

# 26. ENVIRONMENT VARIABLE RULE

Never commit real secrets.

Never add:

.env
real API tokens
real database URLs
real passwords
real deployment secrets

to Git.

Use:

.env.example
.env.*.example

for documentation.

---

# 27. API CHANGE RULE

Before changing an API:

1. Find all callers.
2. Find all clients.
3. Check frontend.
4. Check mobile.
5. Check sync.
6. Check external integrations.
7. Check authentication.
8. Check response format.

Do not change an API response shape without checking consumers.

---

# 28. RESPONSE COMPATIBILITY

If an API currently returns:

{
  "field": "value"
}

do not casually change it to:

{
  "data": {
    "field": "value"
  }
}

without checking every consumer.

Backward compatibility is preferred when possible.

---

# 29. UI CHANGE RULE

Before changing a UI component:

Determine whether it is used by:

- admin
- supervisor
- representative
- mobile
- public CRM
- dashboard
- form
- list
- reports

Do not assume a UI component has only one consumer.

---

# 30. DATA SAFETY RULE

Never intentionally delete production data to solve a development problem.

Never run destructive SQL without explicit approval.

Avoid:

DROP TABLE
TRUNCATE
DELETE without verified WHERE clause

unless explicitly authorized and fully explained.

---

# 31. BACKUP RULE

Before a potentially destructive database operation:

Confirm that a recoverable backup exists.

If no backup exists:

STOP.

---

# 32. GIT SAFETY RULE

Before editing:

Run:

git status

Understand the current state.

Do not overwrite unrelated user changes.

---

# 33. GIT DIFF RULE

After changes:

Run:

git diff

and inspect:

- added files
- deleted files
- changed files
- unexpected changes
- formatting changes
- generated files

Do not commit unexpected changes.

---

# 34. NO BLIND GIT RESET

Do not use:

git reset --hard

git checkout -- .

git clean -fd

unless explicitly requested and the user understands that uncommitted
changes may be destroyed.

---

# 35. COMMIT RULE

Before committing:

1. Test.
2. Inspect git diff.
3. Inspect git status.
4. Confirm only intended files changed.

Commit messages should describe the actual change.

---

# 36. DEPLOYMENT AFTER COMMIT

A Git push does not automatically mean the feature is verified.

After push:

1. Confirm GitHub commit.
2. Confirm deployment status.
3. Open production.
4. Test affected feature.
5. Check logs if necessary.
6. Confirm no regression.

---

# 37. TESTING RULE

Every code change must have a verification step.

Depending on the change:

- npm run build
- lint
- unit tests
- API test
- browser test
- mobile test
- database test
- production smoke test

Do not claim a feature is fixed without verification.

---

# 38. BUILD RULE

For build-related changes:

Run:

npm run build

If build fails:

Do not hide the error.

Report:

- exact failure
- affected file
- likely cause
- whether it existed before the change

---

# 39. BROWSER TEST RULE

For UI changes, test the actual browser behavior.

Check:

- desktop
- mobile
- relevant role
- form
- list
- navigation
- console errors
- network errors

---

# 40. PRODUCTION TEST RULE

When a task concerns production behavior:

Test the deployed application.

Do not assume:

"Local works = production works."

---

# 41. ERROR HANDLING RULE

Do not suppress errors just to make the UI appear functional.

Do not replace:

throw error

with:

console.log(error)

without understanding the consequences.

---

# 42. NO SILENT FALLBACKS

Do not add silent fallback behavior that hides real failures.

If a fallback is necessary:

Explain:

- Why
- When it activates
- What data it uses
- What failure it hides

---

# 43. NO MASS REPLACEMENT

Do not perform broad search/replace operations across the repository.

Especially avoid mass replacement in:

- crm-app.js
- crm-features-v*.js
- schema files
- API routes
- authentication
- sync

unless the exact impact is known.

---

# 44. NO GENERATED-FILE POLLUTION

Do not commit:

node_modules
.next
temporary files
debug dumps
local databases
secret files
browser caches

unless explicitly required.

---

# 45. PRESERVE USER DATA

Never modify real customer/pharmacy/doctor/order data simply to test code.

Use test/demo data whenever possible.

---

# 46. BEFORE LARGE CHANGES

If a task affects more than one major subsystem:

STOP BEFORE CODING.

Prepare:

## IMPACT REPORT

### Request
What the user asked.

### Affected subsystems
List them.

### Files
List expected files.

### Dependencies
List dependencies.

### Risks
List possible regressions.

### Plan
Describe the smallest safe implementation.

### Verification
Describe how it will be tested.

### Rollback
Describe how to revert.

Then wait for approval if the change is high-risk.

---

# 47. WHEN TO ASK THE USER

Ask the user when:

- requirements conflict
- data deletion is required
- security behavior must change
- production data may be affected
- architecture must be redesigned
- two valid implementations have materially different consequences
- historical behavior is unknown and cannot be safely inferred

---

# 48. WHEN NOT TO ASK

Do not ask unnecessary questions when:

- the request is clear
- implementation is low-risk
- the required file is obvious
- the change is localized

Use the safest reasonable implementation.

---

# 49. STOP CONDITIONS

The AI agent MUST STOP and report instead of coding if:

1. The target subsystem cannot be identified.
2. Existing behavior is unclear.
3. Multiple conflicting implementations exist.
4. A database migration may cause data loss.
5. Authentication security may be weakened.
6. Sync consistency may be affected.
7. Production configuration may be broken.
8. Required historical reasoning is missing and the choice is unsafe.
9. The change requires a large architectural redesign.
10. The agent is about to delete or replace a critical subsystem.

---

# 50. REQUIRED CHANGE REPORT

Before a significant implementation, provide:

## CHANGE PLAN

### Goal
...

### Current behavior
...

### Problem
...

### Proposed minimal change
...

### Files to modify
...

### Files NOT to modify
...

### Risks
...

### Tests
...

### Rollback
...

---

# 51. REQUIRED FINAL REPORT

After implementation report:

## COMPLETED

### Changed
...

### Files
...

### Tests
...

### Git diff
...

### Deployment
...

### Production verification
...

### Known limitations
...

---

# 52. NO CLAIM WITHOUT VERIFICATION

Never say:

"Fixed."

unless the relevant behavior was actually tested.

Never say:

"Production is working."

unless production was actually checked.

Never say:

"Nothing else changed."

unless git diff/status was checked.

---

# 53. HISTORICAL CLAIM RULE

Historical claims must be supported by:

- Git
- source code
- project documentation
- recovered conversation

If not supported:

UNKNOWN.

---

# 54. ARCHITECTURE CLAIM RULE

Do not infer architecture from filenames alone.

Example:

Seeing:

crm-features-v18.js

does NOT prove that v18 is the only active CRM layer.

Inspect actual imports/script loading/references.

---

# 55. DO NOT REBUILD FROM SCRATCH

Never recreate the project from scratch simply because:

- the code is complex
- there are many files
- architecture is old
- another implementation is easier
- AI cannot immediately understand it

Understand the existing system first.

---

# 56. PRESERVE WORKING FEATURES

The default assumption is:

EXISTING FEATURE = IMPORTANT

unless proven otherwise.

Do not remove working behavior while implementing an unrelated request.

---

# 57. ONE TASK AT A TIME

Do not combine unrelated improvements.

If the user asks:

"Fix pharmacy search."

Do not also:

- redesign dashboard
- change fonts
- refactor authentication
- change database
- redesign navigation

Keep the change focused.

---

# 58. NO AI-DRIVEN REDESIGN

The AI agent must never redesign the project simply because the AI prefers
another architecture.

AI preference is NOT a valid reason to change production architecture.

---

# 59. USER APPROVAL FOR ARCHITECTURAL CHANGES

The following require explicit user approval unless there is an emergency
production fix:

- database redesign
- authentication redesign
- sync redesign
- framework migration
- replacing CRM architecture
- removing major subsystems
- changing deployment architecture
- replacing PWA architecture
- replacing mobile authentication
- merging versioned CRM systems

---

# 60. FINAL AGENT BEHAVIOR

The agent must behave like:

SENIOR SOFTWARE ENGINEER
+
SYSTEM ARCHITECT
+
CAUTIOUS MAINTAINER

NOT:

AUTONOMOUS REWRITER

The primary objective is:

PRESERVE
    +
UNDERSTAND
    +
MINIMALLY CHANGE
    +
VERIFY

---

# 61. FINAL GOLDEN RULE

WHEN IN DOUBT:

DO NOT CHANGE CODE.

INSPECT FIRST.

---

# 62. PERMISSIONS REFLECTION RULE (PERMANENT — USER-MANDATED)

Declared by the user on 2026-08-15 as part of the v11.15.0 request (item #14)
and valid for ALL future work, not only v11.15.0:

Every capability that is added, removed, or changed anywhere in the CRM MUST
also be reflected in the permissions system in the same change.

Concretely:

1. New admin capability → add a permission key to `PERMISSION_GROUPS` in
   `public/crm-data.js` (new keys default to allowed for admins via
   `getDefaultPermissionsObject(true)`).
2. Removed capability → remove its permission key (or mark it deprecated)
   in the same commit.
3. Changed capability → review whether an existing key still maps correctly;
   add granular keys when one switch now controls several things.
4. New granular keys must be migrated for existing users (see the
   `migratePermissions` pattern in `crm-features-v19.js`) so saved users
   keep working after update.
5. The change report for any task must state which permission keys were
   added/removed/unchanged; "none" is only acceptable with a reason.

The UI renders permission groups dynamically, so new keys appear
automatically; skipping this rule leaves capabilities untoggleable and is
treated as an incomplete change.

---

# 63. CHAT.ARENA MEMORY FILE RULE (PERMANENT — USER-MANDATED)

Declared by the user on 2026-08-16 and valid for ALL future work:

The repository root contains a file named `chat.arena` that is the project's
living session memory. It contains the full project summary, architecture,
the ordered chat between the user and the AI, every permanent rule, and the
complete source of every text file.

The agent MUST:

1. Read `chat.arena` before starting work when it exists (treat it as
   session memory; source code still overrides it per rule #5).
2. Update `chat.arena` after every user chat that changes anything, and
   after every delivered app version: append the new user messages and
   assistant answers (verbatim), update the version summary, and refresh the
   embedded file contents of every file that changed.
3. Include the updated `chat.arena` in every delivered ZIP package alongside
   the new/changed files.
4. Never remove or truncate earlier chat turns or rules from `chat.arena`;
   it is append-update only, except for refreshing file contents and the
   summary sections.

---

# 64. AUTOMATIC DELIVERY ZIP RULE (PERMANENT — USER-MANDATED)

Declared by the user on 2026-08-16 and valid for ALL future work:

Every time the user sends a new request and the agent finishes handling it,
the agent's turn is NOT complete until a FRESH download package exists:

1. Rebuild the full program ZIP (exclude `.git` / `node_modules`; include the
   updated `chat.arena`) with the name pattern `namayandeelmi-v<version>.zip`.
2. Ensure the live download preview (port 8000 server) serves the NEW file —
   update `download_server.py`'s `ZIP_PATH`/`ZIP_NAME` when the name changes
   and restart the preview process.
3. Present the new ZIP file to the user at the end of the turn.
4. Verify before delivery: unzip and check the embedded `package.json`
   version matches the announced version, then state that proof in the reply.

Skipping any of these steps is an incomplete delivery.

---

# 65. GIT HYGIENE + DUAL-REMOTE SYNC RULE (PERMANENT — USER-MANDATED)

Declared by the user on 2026-08-16 and valid for ALL future work:

1. `.env` (any real secrets file with tokens/passwords) must NEVER enter Git.
   Verified 2026-08-16: full git history contains no real `.env`; only the
   sanitized template `.env.ndcohub.example`. `.gitignore` blocks `.env`,
   `.env.*`, `*.env` while re-allowing `!.env*.example` templates. If a real
   secrets file is ever found tracked: `git rm --cached <file>`, purge it,
   and TELL THE USER TO ROTATE those tokens/passwords immediately.
2. `node_modules` must NEVER enter GitHub/GitLab. The runnable app
   (`server.js` + every `scripts/*.mjs`) uses ONLY Node built-in modules;
   the dead `express`/`cors` dependencies were removed from `package.json`
   in v11.15.3 and `package-lock.json` was regenerated dependency-free.
   `npm install` is NOT required to run the project. Safe local cleanup:
   Windows `rmdir /s /q node_modules`, Linux/Mac `rm -rf node_modules`.
3. The user works on TWO computers and constantly moves the project folder
   between them. Rules:
   - End of work on either machine = run `SYNC_ALL.bat` (Windows) or
     `sh sync_all.sh` (Linux/Mac) with a short change message. The script
     pulls from GitHub (origin) and GitLab (gitlab remote, if configured),
     commits, and pushes to BOTH — one command updates both remotes.
   - Start of work on the second machine = run the same script once first
     to pull the newest state ("first take, then change, then send").
   - `.gitattributes` keeps line endings stable across systems
     (`.bat/.ps1` = CRLF, `.sh/.py` = LF, binaries untouched).
   - `server-db.json` is runtime data and stays local-only (gitignored).
4. GitLab one-time setup steps live in `RAHNAMA_GITLAB.txt`. Keep that file
   and both sync scripts up to date whenever remotes/branches change.
5. Every new repo file must immediately be added to OFFICIAL_FILELIST.txt
   (whitelist consumed by the user's cleanup scripts); in v11.15.3 the
   missing `KEEP_ONLY_GITHUB.bat` was found and re-added (239 entries).

---

# 66. KNOWLEDGE GRAPH FIRST-READ RULE (PERMANENT — USER-MANDATED)

Declared by the user on 2026-08-16:

`PROJECT_GRAPH.md` (generated by `update_project_graph.py` in the repo root)
is the full knowledge graph of the project: every file, every function,
window-layer override edges, API consumers, browser-storage keys and the
tab↔file map. To save tokens, the AI must read THIS FILE FIRST instead of
re-reading every source file. Workflow per completed request:
`python update_project_graph.py` FIRST, then `python update_chat_arena.py`
(so chat.arena embeds the fresh graph too). Never hand-edit PROJECT_GRAPH.md.

# 67. DUAL-REMOTE GIT COMMANDS RULE (PERMANENT — USER-MANDATED)

Declared by the user on 2026-08-16:

Every git instruction handed to the user must update BOTH GitHub (origin)
AND GitLab (gitlab remote). Either tell him to run `SYNC_ALL.bat "<msg>"`,
or give the full explicit sequence:
`git pull --no-rebase origin main` → `git pull --no-rebase gitlab main`
(if configured) → `git add -A` → `git commit -m "<msg>"` →
`git push origin main` → `git push gitlab main`.
Never deliver GitHub-only commands again.

# 68. DIAGNOSE-REMOTE-BEFORE-PUSH-ADVICE RULE (PERMANENT)

Date: 2026-08-16 incident (remote history replaced by manual commit
"پروژه اولیه" while the user kept pushing and nothing changed).

Whenever the user reports "GitHub/GitLab did not update", do NOT guess:
run `git fetch origin` and inspect `git log origin/main --oneline` +
spot-check a known file (e.g. `git show origin/main:package.json`).
If the remote history was replaced/recreated, deliver the one-time repair
`PUSH_FRESH_GITHUB.bat` (merge --allow-unrelated-histories -X ours → push)
and state the facts from the actual remote state.

# 69. SECRET + CAPTCHA SAFETY RULE (PERMANENT)

Credentials pasted in chat must never be copied into source, chat.arena, ZIP,
documentation, Git, logs or examples. Redact them and tell the user to rotate
the exposed password. CAPTCHA/security-code bypass must not be implemented.
Use manual manager login or an official provider API/service account.

# END OF AI RULES