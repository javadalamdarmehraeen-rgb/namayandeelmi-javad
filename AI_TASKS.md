# AI TASKS
# Namayande Elmi
# Current Project Status & Work Tracking

This file is the operational task memory for the project.

It tells an AI agent:

- What has already been done
- What is currently being worked on
- What is known to be important
- What must be verified
- What remains unfinished
- What the next task should be

IMPORTANT:

This file must NOT be treated as a replacement for the source code.

The actual source code remains the final source of truth.

---

# 1. CURRENT PROJECT

Project:
Namayande Elmi

Repository:
https://github.com/javadalamdarmehraeen-rgb/namayandeelmi-javad

Production:
https://namayandeelmi-javad.onrender.com

Primary branch:
main

---

# 2. PROJECT STATUS

Status:

ACTIVE DEVELOPMENT

The project is a large evolving CRM / field-representative / pharmacy /
doctor / order-management system with:

- Web application
- Admin panel
- Representative panel
- CRM
- Forms
- Lists
- Manual Designer
- Maps
- GPS
- Orders
- Products
- Pharmacies
- Doctors
- Messaging
- PWA
- Mobile application
- Synchronization
- PostgreSQL
- Render deployment
- NdcoHub integration

The project has a long Git history and must NOT be treated as a new project.

---

# 3. CURRENT DEVELOPMENT PRINCIPLE

The project is being developed incrementally.

Existing functionality must be preserved unless the current task explicitly
requires changing it.

The next AI agent must continue the existing project rather than rebuilding it.

---

# 4. COMPLETED FOUNDATION

The following project-memory files have been created:

- AI_PROJECT_CONTEXT.md
- AI_ARCHITECTURE.md
- AI_DECISION_LOG.md
- AI_RULES.md
- AI_TASKS.md

These files exist to restore project context when starting a new AI chat.

Before implementation, the AI agent must read them.

---

# 5. CURRENT SYSTEM AREAS

The project currently contains or documents the following major areas:

## Core application

- Next.js
- App Router
- TypeScript
- PostgreSQL
- Drizzle ORM

## CRM

- CRM main application
- CRM feature modules
- versioned CRM feature files
- forms
- lists
- fields
- field ordering
- field sizing
- row/stack layouts
- boxes
- widgets
- tabs
- manual designer

## Users / Roles

- Admin
- Representatives
- other application users

## Business entities

- Pharmacies
- Doctors
- Products
- Orders
- Targets
- Visits
- Records

## Geography

- Provinces
- Cities
- Map
- GPS
- Geocoding
- Distance calculation

## Communication

- Telegram
- Bale
- Eitaa
- WhatsApp
- SMS

## Mobile

- React Native / mobile application
- mobile authentication
- device authentication
- SIM-related authentication

## PWA

- Service Worker
- IndexedDB
- Offline support
- Cache
- Background Sync

## Synchronization

- Render
- NdcoHub
- pull
- push
- sync run
- sync status

## Deployment

- GitHub
- GitLab
- Render
- NdcoHub

---

# 6. RECENT DEVELOPMENT HISTORY

The Git repository contains many iterative commits.

Recent history includes development around:

- CRM navigation
- CRM forms
- CRM lists
- fields
- field order
- field width
- row/stack layout
- boxes
- widgets
- manual designer
- searchable selects
- geography
- pharmacy matching
- freeze headers
- login/password
- visit tracking
- notification behavior
- product display
- order fields
- product editing
- default list behavior

The exact implementation must always be confirmed from Git and source code.

Do NOT assume that a commit title completely describes the current behavior.

---

# 7. CURRENT HIGH-RISK AREAS

The following areas must be considered HIGH RISK:

1. Authentication
2. Mobile authentication
3. Database schema
4. Database migrations
5. Synchronization
6. CRM core
7. Manual Designer
8. PWA / Service Worker
9. Offline storage
10. Deployment configuration
11. Messaging providers
12. Production data
13. API contracts

Any change in these areas requires extra inspection and testing.

---

# 8. CURRENT LOW-RISK CHANGE EXAMPLES

The following may usually be treated as localized changes,
provided dependency analysis confirms this:

- isolated text change
- isolated label change
- small CSS adjustment
- small visual spacing adjustment
- isolated UI wording
- small non-breaking display change

Even low-risk changes must be verified.

---

# 9. TASK STATUS SYSTEM

Use these statuses:

TODO
IN_PROGRESS
BLOCKED
NEEDS_REVIEW
TESTING
DONE
CANCELLED

---

# 10. CURRENT TASK

Current task:

RESTORE AI PROJECT CONTEXT FOR CONTINUED DEVELOPMENT

Status:

IN_PROGRESS

Goal:

Create a persistent project-memory system so a new AI agent can continue
development without relying on the broken historical chat.

---

# 11. CONTEXT RESTORATION TASKS

## TASK-001

Create AI_PROJECT_CONTEXT.md

Status:
DONE

Purpose:
Store high-level project context and historical knowledge.

---

## TASK-002

Create AI_ARCHITECTURE.md

Status:
DONE

Purpose:
Document system architecture and major dependencies.

---

## TASK-003

Create AI_DECISION_LOG.md

Status:
DONE

Purpose:
Preserve important historical decisions and implementation reasoning.

---

## TASK-004

Create AI_RULES.md

Status:
DONE

Purpose:
Prevent unsafe AI modifications, unnecessary refactoring,
deletion of important files and architectural damage.

---

## TASK-005

Create AI_TASKS.md

Status:
IN_PROGRESS

Purpose:
Track current development state and future tasks.

---

## TASK-006

Create ARENA_HANDOFF_PROMPT.md

Status:
DONE

Note:
ARENA_HANDOFF_PROMPT.md exists in the repository root and fulfils these
requirements; verified present in the current working tree.

Purpose:

Provide a single prompt that can be pasted into a new Arena AI Agent Mode
conversation.

The prompt must force the new agent to:

1. Read the project memory files.
2. Inspect the GitHub repository.
3. Inspect the current source code.
4. Inspect recent Git history.
5. Inspect the production application.
6. Reconstruct the current architecture.
7. Report its understanding.
8. Identify uncertainties.
9. NOT modify code immediately.

---

## TASK-007

Apply the 14-point user change request as version v11.15.0

Status:
DONE

Scope summary:

1. Old default required-star behaviour removed; only pharmacyName and
   doctorName stay required (one-time state migration in v19 `fixRequiredDefaults`).
2. Additions tab (افزودن‌ها) compacted; the "compact list of all selects" and
   "field info" boxes removed; typed add-option inside combos; small colored
   "add option" button removed (v19 + index.html markup removal).
3. All delete buttons iconified 🗑️ and all edit buttons ✏️ (v19 `iconifyButtons`).
4. "Instant add option" (افزودن لحظه‌ای) toggle available and persisted for
   every field type incl. builtins (v11 save branch + getUnifiedFieldList).
5. Real per-field list ordering; row number + rep name as first columns
   (v19 list reorder engine).
6. Routing column rendered as a GPS icon per row (v19 `paintRouteIcons`).
7. "پاک کردن" (clear) button added to pharmacies / doctors / orders forms.
8. Field delete in field-info table now deletes completely; delete button no
   longer morphs into "نمایش مجدد" (v11 `deleteAnyField` / `renderColFieldList`).
9. Edit ✏️ button next to delete on each order-item row opens the matching
   catalog product for editing. NOTE: the user's sentence for this item was
   ambiguous/typo'd; this interpretation must be confirmed by the user.
10. Box info (اطلاعات کادرها) and key info (اطلاعات کلیدها) shown only in
    their own sections, removed from the fields-info table.
11. Products mega-fix (add-field bar labels, real box/list ordering, info
    panel under the bar, working per-row edit, تعداد کالا renames, gift image
    removed, row total = qty × unit price, VAT% admin-only, two readonly
    totals, admin-editable formula, combo arrow fixed, default 0 cleared on
    typing, thousands separators, correct order total).
12. Backup page excluded from auto layout; auto backup actually runs; manual
    backup lands in the admin-chosen folder/file (File System Access API with
    persisted handle in IndexedDB when available).
13. Granular diagnostics (v19 `runDetailedDiagnostics`); fake
    `testServerConnectivity` replaced by the real granular check.
14. PERMANENT RULE: every added/removed/changed capability must be reflected
    in permissions; new permission group "ابزارهای مدیریت (نسخه ۱۱.۱۵)" added
    in crm-data.js; AI_RULES.md #62 records the rule.

Implementation:
Single new versioned file public/crm-features-v19.js (loaded after v18) plus
small surgical edits in index.html, crm-app.js, crm-features-v11.js,
crm-data.js, sw.js, server.js, package.json. Project skeleton and the
versioned-file pattern were kept unchanged.

Verification status:
- `node --check` passes for all JS files (VERIFIED).
- `node server.js` smoke test: /api/health reports 11.15.0, / serves
  index.html including the v19 script tag, /crm-features-v19.js serves 200
  (VERIFIED).
- In-browser behaviour of the 14 items must be verified by the user in
  Chrome/Edge (PENDING USER VERIFICATION).

---

## TASK-008

Create and maintain chat.arena as the full session/project memory file

Status:
DONE

Scope summary:

1. chat.arena created at repository root (user-requested permanent artifact).
2. It contains: project summary, architecture explanation, full ordered
   user/AI chat log (verbatim where available), permanent rules, delivery
   workflow, risk map, and the full embedded source of all text files in the
   repository.
3. AI_RULES.md #63 created: chat.arena must be updated after every chat and
   every delivered version, and must be included in every delivered ZIP.

---

## TASK-009

v11.15.1 hotfix — remove hardcoded required-field saves (star-respecting saves)

Status:
DONE

User report: after v11.15.0, with only pharmacyName starred, saving a
pharmacy still raised a forced-field warning for province/city/district/
address.

Root cause (VERIFIED): 9 hardcoded empty-field alert blocks in entity save
paths (3 active handlers in crm-features-v9.js; 6 duplicated in two code
generations of crm-app.js), independent of the star system.

Fix (VERIFIED): all 9 replaced with calls to the star-aware
`window.validateRequiredFields(tabId)`; only admin-starred fields can block
saving now, app-wide. Order "minimum one item" rule kept (business rule).
Version bumped to 11.15.1 everywhere (package.json, server.js, sw.js,
index.html ?v=). node --check green; server smoke green (11.15.1).

PENDING USER VERIFICATION in browser on all three forms (pharmacy/doctor/
order) with only their chosen starred fields.

---

# 12. NEXT IMMEDIATE TASK

No pending coding task.

Awaiting user in-browser verification of v11.15.0 (TASK-007), especially:

1. List column ordering after setting «شماره ترتیب در لیست».
2. Typed add-option rows appearing as children of the same combo.
3. Backup to a chosen folder (requires Chrome/Edge and secure context).
4. Granular diagnostics output in the troubleshooting tab.
5. Order item totals, VAT, and the admin-only formula box.

After user confirmation, the next task is whatever new change request the
user issues following their verification pass.

---

# 13. ARENA AGENT INITIALIZATION REQUIREMENT

When a new Arena AI conversation starts, the agent must NOT immediately modify
code.

First perform:

PHASE 1
Read project memory.

PHASE 2
Inspect repository.

PHASE 3
Inspect architecture.

PHASE 4
Inspect recent Git history.

PHASE 5
Inspect relevant source code.

PHASE 6
Inspect production application.

PHASE 7
Generate a Project Understanding Report.

PHASE 8
Wait for the user's actual development request.

---

# 14. PROJECT UNDERSTANDING REPORT

Before the first code modification, the AI agent should be able to explain:

## Application

What the application does.

## Architecture

How frontend, backend, database and deployment interact.

## CRM

How CRM features are structured.

## Database

Where schema and database access live.

## Authentication

How users authenticate.

## Mobile

How mobile authentication and APIs work.

## PWA

How offline/cache/service-worker behavior works.

## Sync

How Render and NdcoHub synchronize.

## Deployment

How GitHub/GitLab/Render/NdcoHub are connected.

## High-risk files

Which files must not be modified casually.

## Current Git state

Which commit is currently at the top of main.

---

# 15. UNCERTAINTY REGISTER

If the new AI agent discovers something it cannot verify,
it must record it here or report it.

Format:

### UNKNOWN-001

Question:
...

Why it matters:
...

How to verify:
...

Status:
OPEN

Do not convert guesses into facts.

---

# 16. BUG REGISTER

Known bugs should be recorded here.

Format:

### BUG-001

Title:
...

Symptoms:
...

Expected:
...

Actual:
...

Affected files:
...

Status:
OPEN

Fix:
...

Verification:
...

---

# 17. FEATURE REGISTER

Future features should be recorded here.

Format:

### FEATURE-001

Title:
...

Purpose:
...

Requested by:
User

Status:
TODO

Affected areas:
...

Risk:
LOW / MEDIUM / HIGH

---

# 18. DO NOT MARK DONE WITHOUT TESTING

A task may only become:

DONE

after appropriate verification.

For example:

Code change
→ Build
→ Relevant test
→ Browser test
→ Production test if required
→ Git diff
→ Git status
→ Commit

---

# 19. GIT WORKFLOW

The project update workflow is:

git add -A

git status

git commit -m "DESCRIBE ACTUAL CHANGE"

git push origin main

After pushing:

1. Confirm GitHub.
2. Confirm deployment.
3. Test affected feature.

---

# 20. IMPORTANT GIT RULE

Do not automatically push code after every change.

First:

- inspect
- test
- review diff
- confirm intended files

Then push.

---

# 21. CURRENT DEPLOYMENT

Production application:

https://namayandeelmi-javad.onrender.com

GitHub:

https://github.com/javadalamdarmehraeen-rgb/namayandeelmi-javad

The current repository documentation indicates Render deployment with
Next.js production build and a health-check endpoint.

The exact current deployment configuration must be verified from:

- render.yaml
- package.json
- GitHub workflows
- GitLab CI
- current Render configuration

Do not rely only on this file.

---

# 22. CURRENT DATABASE

The project uses:

PostgreSQL

with:

Drizzle ORM

The actual database schema must be verified from:

src/db/schema.ts

and migration files.

Do not assume this file contains the complete current schema.

---

# 23. CURRENT SYNCHRONIZATION

The project includes synchronization between:

Render

and

NdcoHub

Known concepts include:

- uid
- updated_at
- origin
- pull
- push
- sync run
- sync status

The actual current implementation must be verified from source code.

---

# 24. CURRENT MOBILE SYSTEM

The repository includes a mobile application.

Known mobile-related areas include:

mobile/
src/simAuth.ts

Mobile authentication must be treated as security-sensitive.

Do not modify it without inspecting both client and server implementations.

---

# 25. CURRENT CRM SYSTEM

The CRM contains many historical iterations.

The repository includes versioned CRM feature files.

Do not assume the newest filename is automatically the only active implementation.

Always inspect:

- script loading
- imports
- references
- actual runtime behavior

---

# 26. CURRENT MANUAL DESIGNER

The Manual Designer is an important subsystem.

Known functionality includes:

- field selection
- field ordering
- field size
- form/list configuration
- row/stack layout
- widgets
- boxes
- tabs
- searchable selects
- locking
- selective copying

Changes to this subsystem require regression testing.

---

# 27. CURRENT MAP SYSTEM

Known map-related areas include:

- MapExplorer
- map pages
- geocoding
- province/city handling
- distance calculations
- GPS

Changes to geography should be tested with actual locations.

---

# 28. CURRENT MESSAGING SYSTEM

Messaging supports multiple providers/platforms.

Known platforms:

- Telegram
- Bale
- Eitaa
- WhatsApp

Never commit real credentials.

---

# 29. CURRENT PWA SYSTEM

The application contains PWA/offline behavior.

Known concepts:

- Service Worker
- IndexedDB
- Cache
- Offline route
- Background Sync
- online/offline detection

Do not disable these systems to solve unrelated UI issues.

---

# 30. PRODUCTION SAFETY

Production is considered important.

Do not:

- delete production data
- reset production database
- expose secrets
- change authentication casually
- change sync conflict rules casually
- disable security controls
- change deployment architecture casually

---

# 31. AI AGENT HANDOFF PRINCIPLE

A new AI conversation should be able to reconstruct the project from:

1. Repository
2. AI_PROJECT_CONTEXT.md
3. AI_ARCHITECTURE.md
4. AI_DECISION_LOG.md
5. AI_RULES.md
6. AI_TASKS.md
7. Git history

The historical chat is helpful but must NOT be the only source of project
knowledge.

---

# 32. CONTINUOUS MEMORY RULE

After completing a significant feature or architectural decision:

Update the appropriate memory file.

Examples:

New architecture decision
→ AI_DECISION_LOG.md

New architecture knowledge
→ AI_ARCHITECTURE.md

New general project knowledge
→ AI_PROJECT_CONTEXT.md

New safety rule
→ AI_RULES.md

New task / bug / status
→ AI_TASKS.md

---

# 33. MEMORY MAINTENANCE

The AI agent must keep these files synchronized with reality.

Do not allow them to become outdated documentation.

If source code contradicts a memory file:

SOURCE CODE WINS.

Then update the memory file.

---

# 34. FINAL PROJECT STATE

Current state:

The project is an active production-oriented CRM/application.

The immediate objective is NOT to redesign the application.

The immediate objective is:

RESTORE RELIABLE AI CONTEXT
+
PROTECT EXISTING CODE
+
CONTINUE DEVELOPMENT SAFELY

---

# END OF AI TASKS