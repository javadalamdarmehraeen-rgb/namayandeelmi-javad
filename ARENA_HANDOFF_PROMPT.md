# ARENA AI MASTER HANDOFF PROMPT
# Namayande Elmi

YOU ARE NOW TAKING OVER AN EXISTING SOFTWARE PROJECT.

THIS IS NOT A NEW PROJECT.

THIS IS NOT A REQUEST TO REBUILD THE APPLICATION.

THIS IS A HANDOFF FROM A PREVIOUS AI DEVELOPMENT SESSION.

Your first responsibility is to UNDERSTAND and PRESERVE the existing system.

Your second responsibility is to continue development safely.

Your third responsibility is to make only the changes explicitly requested
by the user.

============================================================
1. PROJECT
============================================================

Project name:

Namayande Elmi

GitHub repository:

https://github.com/javadalamdarmehraeen-rgb/namayandeelmi-javad

Production application:

https://namayandeelmi-javad.onrender.com

Primary branch:

main

============================================================
2. CRITICAL INSTRUCTION
============================================================

DO NOT MODIFY CODE YET.

DO NOT DELETE FILES.

DO NOT REFACTOR.

DO NOT "IMPROVE" ARCHITECTURE.

DO NOT REBUILD ANYTHING.

DO NOT CREATE A NEW IMPLEMENTATION.

DO NOT ASSUME THAT OLD CODE IS OBSOLETE.

DO NOT ASSUME THAT THE NEWEST FILE IS THE ONLY ACTIVE FILE.

DO NOT CHANGE DATABASE STRUCTURE.

DO NOT CHANGE AUTHENTICATION.

DO NOT CHANGE SYNCHRONIZATION.

DO NOT CHANGE DEPLOYMENT.

DO NOT CHANGE MOBILE AUTHENTICATION.

DO NOT CHANGE PWA/OFFLINE SYSTEM.

DO NOT CHANGE CRM CORE.

DO NOT CHANGE MANUAL DESIGNER.

UNTIL YOU COMPLETE THE INITIAL AUDIT.

============================================================
3. YOUR FIRST JOB
============================================================

Your first job is:

RECONSTRUCT THE CURRENT PROJECT CONTEXT.

You must use the actual GitHub repository as the implementation source
of truth.

You must NOT rely only on filenames.

You must inspect actual source code, imports, references, configuration,
Git history and documentation.

============================================================
4. REQUIRED MEMORY FILES
============================================================

The repository contains project-memory files.

Read ALL of them before making any implementation decision:

1. AI_PROJECT_CONTEXT.md

2. AI_ARCHITECTURE.md

3. AI_DECISION_LOG.md

4. AI_RULES.md

5. AI_TASKS.md

6. ARENA_HANDOFF_PROMPT.md

These files are complementary.

Do not treat one file as the complete truth.

============================================================
5. SOURCE OF TRUTH PRIORITY
============================================================

Use this priority:

1. Current source code
2. Database schema and migrations
3. Current configuration
4. Current Git history
5. Existing project documentation
6. AI_PROJECT_CONTEXT.md
7. AI_ARCHITECTURE.md
8. AI_DECISION_LOG.md
9. AI_RULES.md
10. AI_TASKS.md
11. Inference

If documentation conflicts with source code:

SOURCE CODE WINS.

If historical reasoning is unknown:

SAY UNKNOWN.

Never invent historical reasoning.

============================================================
6. INITIAL AUDIT
============================================================

Before changing anything, inspect:

Repository root.

Then:

src/
public/
mobile/
scripts/
.github/
configuration files
package.json
render.yaml
server.js
database files
migration files
README files
change logs
AI memory files

============================================================
7. GIT AUDIT
============================================================

Inspect:

git status

git log --oneline --decorate -30

git branch -a

git remote -v

Inspect recent commits relevant to the current subsystem.

Do not assume commit messages completely explain the implementation.

Use Git history to understand evolution.

============================================================
8. CURRENT GIT STATE
============================================================

Determine:

- current branch
- current HEAD
- latest commit
- whether working tree is clean
- whether uncommitted changes exist
- whether there are unexpected files
- whether local changes differ from GitHub

Report this before implementation.

============================================================
9. ARCHITECTURE AUDIT
============================================================

Determine the actual architecture.

At minimum inspect:

Frontend:
Next.js
React
App Router
components
pages/routes

Backend:
API routes
server logic
server.js
libraries

Database:
PostgreSQL
Drizzle
schema
migrations

PWA:
service worker
cache
IndexedDB
offline routes

Mobile:
mobile/
React Native
authentication

Synchronization:
Render
NdcoHub
pull
push
sync
conflict resolution

Deployment:
GitHub
GitLab
Render
environment configuration

============================================================
10. CRM AUDIT
============================================================

The CRM is a major subsystem.

Do not assume the current CRM architecture from filenames.

Inspect:

- crm-app.js
- crm feature files
- versioned CRM files
- imports
- script loading
- references
- forms
- lists
- fields
- widgets
- boxes
- tabs
- manual designer

Determine which files are actually active.

============================================================
11. VERSIONED CRM FILES
============================================================

The repository contains versioned CRM files.

Examples may include:

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

DO NOT DELETE THEM.

DO NOT MERGE THEM.

DO NOT ASSUME THEY ARE UNUSED.

Determine actual runtime usage first.

============================================================
12. CRM CORE SAFETY
============================================================

crm-app.js is HIGH RISK.

Before changing it:

Inspect:

- imports
- global functions
- dependencies
- script order
- event handlers
- initialization
- navigation
- form/list behavior

Git history shows that crm-app.js has previously caused a syntax-related
break affecting main tabs.

Therefore:

DO NOT REWRITE crm-app.js.

Prefer the smallest possible change.

============================================================
13. MANUAL DESIGNER
============================================================

The Manual Designer is HIGH RISK.

It contains functionality related to:

- fields
- field order
- field width
- form/list visibility
- row/stack layout
- tabs
- widgets
- boxes
- searchable selects
- required fields
- locking
- selective copy

Do not replace the Manual Designer.

Do not redesign it.

Do not simplify it.

Understand it first.

============================================================
14. DATABASE SAFETY
============================================================

Database changes require special care.

Inspect:

src/db/schema.ts

and:

migrations

before modifying database-related code.

Before any database change:

- find all table references
- find API consumers
- find UI consumers
- inspect migrations
- inspect synchronization
- consider existing data

Never perform destructive SQL without explicit approval.

============================================================
15. AUTHENTICATION SAFETY
============================================================

Authentication is a security boundary.

Do not modify:

- password logic
- OTP
- session handling
- mobile login
- HMAC
- device authentication

unless explicitly requested.

Never expose:

passwords
tokens
API keys
secrets
database credentials

============================================================
16. MOBILE AUTHENTICATION
============================================================

Mobile authentication is HIGH RISK.

Inspect both:

mobile/

and:

src/

before modifying mobile authentication.

The repository documents nonce/timestamp/device/phone/SIM-related
authentication and HMAC-SHA256.

Do not weaken or bypass security checks.

============================================================
17. SYNCHRONIZATION
============================================================

Synchronization is HIGH RISK.

Inspect:

uid
updated_at
origin

and:

pull
push
sync
sync status
conflict resolution

before changing anything.

Do not change conflict behavior without explaining:

- current behavior
- proposed behavior
- data-loss risk
- rollback

============================================================
18. PWA / OFFLINE
============================================================

PWA and offline functionality is HIGH RISK.

Inspect:

- service worker
- IndexedDB
- cache
- offline route
- background sync
- online/offline handling

Do not disable PWA functionality to solve unrelated problems.

============================================================
19. DEPLOYMENT
============================================================

Do not change deployment configuration unless required.

Inspect:

package.json
render.yaml
server.js
.github/workflows/
.gitlab-ci.yml

before deployment changes.

Determine the actual deployment flow.

============================================================
20. PRODUCTION
============================================================

Production:

https://namayandeelmi-javad.onrender.com

You may inspect production for verification.

Do not modify production data.

Do not run destructive operations.

Do not change production configuration without explicit authorization.

============================================================
21. IMPORTANT DISTINCTION
============================================================

You must distinguish:

VERIFIED FACT

from:

INFERENCE

from:

UNKNOWN

Example:

[VERIFIED]
A Git commit changed a particular file.

[INFERRED]
The change appears related to a specific subsystem.

[UNKNOWN]
The original user request that caused the change.

Never turn INFERENCE into VERIFIED FACT.

============================================================
22. NO FABRICATION
============================================================

If the historical chat is unavailable:

DO NOT PRETEND YOU REMEMBER IT.

Say:

"The original conversation is not available. I can reconstruct this part
from Git/source/documentation, but the original reasoning is UNKNOWN."

============================================================
23. NO IMMEDIATE CODING
============================================================

After reading the repository, DO NOT start coding.

First produce:

PROJECT UNDERSTANDING REPORT

============================================================
24. PROJECT UNDERSTANDING REPORT
============================================================

Your first response after completing the audit must contain:

# PROJECT UNDERSTANDING REPORT

## 1. Project purpose

Explain what the application currently does.

## 2. Current architecture

Explain:

frontend
backend
database
PWA
mobile
sync
deployment

## 3. Current CRM architecture

Explain:

CRM core
feature modules
forms
lists
manual designer
widgets
boxes
tabs

## 4. Database architecture

Explain:

schema location
ORM
migration system
major data areas

## 5. Authentication

Explain current authentication architecture.

## 6. Mobile

Explain current mobile architecture.

## 7. Synchronization

Explain:

Render
NdcoHub
pull
push
conflict resolution

## 8. Deployment

Explain:

GitHub
GitLab
Render

## 9. Important files

List high-impact files.

## 10. High-risk subsystems

List them.

## 11. Recent Git history

Summarize the relevant recent commits.

## 12. Current Git state

Report:

branch
HEAD
working tree
recent commit

## 13. Production state

If accessible, report what was verified.

## 14. Unknowns

List anything that could not be verified.

============================================================
25. DO NOT CLAIM SUCCESS
============================================================

Do not say:

"Everything is understood."

unless you can actually demonstrate the evidence.

Instead say:

"Current understanding is..."

and list remaining uncertainties.

============================================================
26. AFTER THE REPORT
============================================================

STOP.

Wait for the user's actual task.

Do not modify code.

Do not commit.

Do not push.

Do not delete anything.

============================================================
27. WHEN USER PROVIDES A TASK
============================================================

For every new task:

STEP 1
Understand the request.

STEP 2
Identify affected subsystem.

STEP 3
Inspect relevant files.

STEP 4
Inspect Git history.

STEP 5
Determine dependencies.

STEP 6
Prepare a minimal implementation plan.

STEP 7
Explain risk.

STEP 8
Implement only the required change.

STEP 9
Test.

STEP 10
Inspect git diff.

STEP 11
Inspect git status.

STEP 12
Report exactly what changed.

============================================================
28. NO UNRELATED CHANGES
============================================================

If the user asks:

"Fix X"

you may modify only what is necessary for X.

Do not also:

- redesign UI
- refactor database
- update dependencies
- change authentication
- change deployment
- clean old files
- change unrelated CSS
- rewrite architecture

unless explicitly required.

============================================================
29. MINIMAL CHANGE PRINCIPLE
============================================================

Preferred:

READ
→ UNDERSTAND
→ PLAN
→ MINIMAL CHANGE
→ TEST
→ VERIFY

Never:

GUESS
→ REWRITE
→ DELETE
→ HOPE

============================================================
30. BEFORE DATABASE CHANGES
============================================================

STOP.

Explain:

Current schema
Affected tables
Affected APIs
Affected UI
Migration plan
Data risks
Rollback

Then proceed only if safe and authorized.

============================================================
31. BEFORE ARCHITECTURAL CHANGES
============================================================

STOP.

Explain:

Current architecture
Problem
Why current architecture cannot satisfy the requirement
Alternative approaches
Recommended approach
Affected files
Risks
Rollback

Architectural redesign requires user approval.

============================================================
32. BEFORE FILE DELETION
============================================================

STOP.

Search:

imports
references
script tags
API references
Git history
deployment references

Then explain why deletion is safe.

If uncertain:

DO NOT DELETE.

============================================================
33. BEFORE LARGE REFACTOR
============================================================

STOP.

Prepare an impact report.

Do not perform a large refactor as part of a small feature request.

============================================================
34. GIT SAFETY
============================================================

Before changes:

git status

After changes:

git diff

Then:

git status

Do not use:

git reset --hard

git clean -fd

or destructive commands

without explicit authorization.

============================================================
35. TESTING
============================================================

Do not claim:

"FIXED"

until the affected behavior is verified.

Depending on the task, run:

build
tests
browser test
API test
mobile test
production smoke test

============================================================
36. FINAL IMPLEMENTATION REPORT
============================================================

After implementation provide:

# IMPLEMENTATION REPORT

## Requested task

...

## What I changed

...

## Files changed

...

## Why these files were changed

...

## What I intentionally did NOT change

...

## Tests performed

...

## Git diff reviewed

YES / NO

## Git status reviewed

YES / NO

## Production verified

YES / NO / NOT REQUIRED

## Remaining risks

...

## Remaining unknowns

...

============================================================
37. COMMIT / PUSH
============================================================

Do NOT automatically push.

The user may manage Git manually.

If the user asks to prepare the changes for GitHub, the expected workflow is:

git add -A
git status
git commit -m "..."
git push origin main

Before these commands:

verify that only intended changes are present.

============================================================
38. MOST IMPORTANT RULE
============================================================

THIS PROJECT ALREADY WORKS.

Your job is NOT to prove that you can write a new application.

Your job is to PRESERVE the existing working system while making the
requested improvement.

============================================================
39. SECOND MOST IMPORTANT RULE
============================================================

WHEN YOU DO NOT KNOW:

INSPECT.

WHEN YOU CANNOT VERIFY:

SAY UNKNOWN.

WHEN THE CHANGE IS HIGH RISK:

STOP AND EXPLAIN.

WHEN THE REQUEST IS CLEAR AND LOW RISK:

MAKE THE SMALLEST SAFE CHANGE.

============================================================
40. FINAL INSTRUCTION
============================================================

START NOW.

DO NOT MODIFY CODE.

READ THE PROJECT MEMORY FILES.

INSPECT THE GITHUB REPOSITORY.

INSPECT THE CURRENT GIT HISTORY.

INSPECT THE ARCHITECTURE.

INSPECT THE CURRENT SOURCE STRUCTURE.

INSPECT PRODUCTION ONLY FOR VERIFICATION.

THEN PRODUCE:

PROJECT UNDERSTANDING REPORT

AND WAIT.

============================================================
LATEST STATE ADDENDUM (2026-08-16 — v11.15.3)
============================================================

- App version: 11.15.3. Screens unchanged since 11.15.2; 11.15.3 is a
  repo/tooling release only.
- Runtime is zero-dependency (Node built-ins only); node_modules is
  deletable and gitignored; package-lock.json is dependency-free.
- Secrets: no real .env ever entered git; .gitignore hardened; template
  .env.ndcohub.example sanitized. Permanent rule: AI_RULES #65.
- Sync: user runs SYNC_ALL.bat (Windows) / sync_all.sh (Linux/Mac) → one
  command pulls then pushes to GitHub AND GitLab (gitlab remote setup in
  RAHNAMA_GITLAB.txt). .gitattributes keeps files cross-system safe.
- Memory is regenerated via `python update_chat_arena.py` after every chat;
  chat.arena v1.7 includes all turns 1-12 and full file contents.
- OFFICIAL_FILELIST.txt is the cleanup whitelist (239 entries) — register
  every new repo file there immediately.
- Permanent delivery rules: AI_RULES #62 (permissions mirror), #63
  (chat.arena append-only), #64 (fresh versioned ZIP every completed
  request), #65 (git hygiene + dual-remote sync).

============================================================
ADDENDUM v11.16.0 (2026-08-16)
============================================================

- READ FIRST: PROJECT_GRAPH.md — the auto-generated knowledge graph
  (files/functions/window-overrides/API map/storage map/tab map). Rule #66:
  regenerate with update_project_graph.py before every chat.arena build.
- New last script layer: public/crm-features-v20.js (index.html loads 17
  scripts; v20 wins all overrides). Contains: combo manager, grey chains,
  order lock, v20DupGate (exact-dup block wired into v9 + both crm-app.js
  generations), field mirror pharmacy→orders, presets, change-password FAB.
- window.state getter now exists (v20) — diagnostics depend on it.
- New state keys: selectExtraOptions (pre-existing), v20Renames,
  v20HiddenOptions, v20GreyMap, settings.v20GreyOn, settings.v20OrderLock.
- Git delivery instructions must target GitHub AND GitLab (rule #67).
- chat.arena v1.9 (turn 14 appended); permanent rules now #62-#67.

============================================================
ADDENDUM v11.16.1 (2026-08-16)
============================================================

- Remote incident: GitHub main was replaced by one manual commit
  "پروژه اولیه" (11.15.3 content). Repair tool: PUSH_FRESH_GITHUB.bat
  (merge --allow-unrelated-histories -X ours, then push). Rule: if the
  user says "GitHub didn't update", FIRST fetch and inspect origin/main.
- GitLab tokens are disabled on his account → RAHNAMA_GITLAB.txt now has
  a token-free SSH path; SYNC_ALL skips gitlab gracefully until then.

# END OF ARENA AI MASTER HANDOFF PROMPT
## Addendum — v11.17.0
- Never re-enable `mirrorPharmacyOrderToOrders`: it is intentionally a no-op to preserve field identity/layout across releases.
- v20 owns local order match/autofill, entity cascade manager, share-field lock, visit GPS/metrics/routes, route search/export and version badge.
- v9 visiblePharmacies/Doctors/Orders return reversed copies (newest first).
- GitHub workflow is pure Node/zero-dependency; do not restore Next commands.

## Addendum — v11.17.1
- Never restore `|| 1` in order quantity collection. New orders set `quantityValidated: true`; old obvious bug-pattern rows are cleaned only for sharing.
- Share fields are dynamic (`dynamicShareFields`), not a hardcoded visible subset.
- Entity manager must remain search-only (2 chars, max 50); never render 10k names.
- Legacy direct children of addTabPanel stay hidden; v20 manager owns full width and filters IDs by entity prefix/custom ownership.
- Product layout persistence is reinforced in v20; orderDate is always exempt from grey lock.

## Addendum — v11.18.0
- Never store the credential pasted in turn 19; it was intentionally redacted. Tell user to rotate it.
- Do not automate CAPTCHA. Full daily automation requires an official Snapp API.
- Snapp import supports CSV/text XLS and modern XLSX; test against the user's real pair before claiming browser verification.
- Selected source columns are zero-based [0,1,4,8,11,14,17,18,23]; import dedupes paired formats.
- Excel wrapper now downloads only XLS (do not restore orig CSV call).

## Addendum — v11.19.0
- Never restore Snapp delete UI/permission. Both rows and topups are archival and included in full-state backups.
- New imports must stay `fresh.concat(old)` and deduped.
- Share items format is `name = تعداد کالا: N / تعداد جایزه: G`; order date output is DD/MM/YYYY.
- Real user spreadsheet was not attached to workspace and production /api/state returned empty; do not claim exact real-file verification until browser feedback/sample arrives.
