# AI DECISION LOG
# Namayande Elmi

This document records verified historical development decisions and
important architectural changes reconstructed from the Git repository.

IMPORTANT:

This document must distinguish between:

1. VERIFIED FACT
   Confirmed directly from Git history, source code, or existing project documentation.

2. INFERENCE
   A reasonable interpretation of multiple verified facts.

3. UNKNOWN
   Information that cannot currently be recovered.

Never convert an inference or assumption into a verified fact.

---

# 1. PURPOSE

The original project was developed through multiple AI-assisted sessions.

The original conversational history is currently unavailable/incomplete.

Therefore this document reconstructs the project's historical evolution
from:

- Git commit history
- source files
- existing change logs
- AI_PROJECT_CONTEXT.md
- AI_ARCHITECTURE.md
- repository structure

The goal is to prevent future AI agents from destroying working functionality
because they do not know why previous changes were made.

---

# 2. HISTORICAL RECOVERY STATUS

Status:

PARTIALLY RECOVERED

The Git repository preserves a significant portion of the implementation
history.

However, Git commit messages do not preserve the complete reasoning behind
every decision.

Therefore:

VERIFIED:
What changed.

UNKNOWN:
Why every change was requested.

UNKNOWN:
Which previous AI prompt originally requested each change.

UNKNOWN:
Which alternatives were considered and rejected.

---

# 3. DEVELOPMENT PHASE — V5

Commit:

Deploy v5.0.0 Zero Horizontal Scroll UI with compact wrapping pills and Launchpad

Verified from Git history.

Major themes:

- Zero horizontal scroll UI
- Compact wrapping pills
- Launchpad

Interpretation:

The project was already undergoing significant UI/UX customization by V5.

---

# 4. DEVELOPMENT PHASE — V6

Commit:

Deploy v6.0.0 Ultimate CRM with all 12 historical prompt requirements

Verified from Git history.

Major theme:

The V6 release explicitly refers to 12 historical prompt requirements.

This confirms that previous AI/user conversations had already accumulated
multiple requirements that were being preserved in the implementation.

IMPORTANT:

The exact 12 historical prompts are not fully reconstructed by this document.

Status:

VERIFIED:
There were 12 historical prompt requirements referenced by the V6 commit.

UNKNOWN:
The complete original wording and reasoning of all 12 prompts.

---

# 5. DEVELOPMENT PHASE — V7

Commit:

Deploy v7.0.0 Ultimate CRM with live Gregorian date badge and all historical prompts

Verified from Git history.

Major themes:

- Ultimate CRM
- Live Gregorian date badge
- Historical prompt requirements

Interpretation:

V7 extended the previously accumulated CRM requirements rather than
starting a new independent application.

---

# 6. DEVELOPMENT PHASE — V8

Commit:

Deploy v8.0.0 Ultimate CRM matching Ultra-Professional Master Specification

Verified from Git history.

Major theme:

The CRM was being aligned with a larger master specification.

This represents an important expansion of the application's functional scope.

The V8 development included multiple CRM capabilities and supporting
functionality.

The exact original "Ultra-Professional Master Specification" document is
not currently available in the recovered conversation.

Therefore:

VERIFIED:
V8 was explicitly intended to match that specification.

UNKNOWN:
The complete original specification text.

---

# 7. DEVELOPMENT PHASE — V9

V9 is part of the versioned CRM feature architecture.

The repository contains:

public/crm-features-v9.js

The exact complete reasoning behind V9 is not yet reconstructed.

Do not remove V9 simply because newer feature files exist.

---

# 8. DEVELOPMENT PHASE — V10

V10 represents an important architectural/functional phase.

Existing repository history includes:

CHANGES_V10.md

The V10 changes include verified themes such as:

- Separate login page
- /login
- /panel
- Local Leaflet usage
- Removal of Google Font dependency
- gzip compression for JS/CSS/HTML
- Form/list behavior changes
- Location behavior
- Dashboard widget management
- Medical/facility data
- Diagnostic functionality

IMPORTANT:

V10 is not merely a visual redesign.

It introduced or consolidated multiple runtime and CRM behaviors.

---

# 9. DEVELOPMENT PHASE — V11.0

Commit:

v11.0.0 password change, visit track, bordered excel, real row numbers

Commit SHA:

b313dcd

Verified changes:

- Password change
- Visit tracking
- Bordered Excel
- Real row numbers

Interpretation:

V11 began a new phase of detailed CRM functionality and data-entry/reporting
behavior.

---

# 10. DEVELOPMENT PHASE — V11.1

Commit:

v11.1.0 columns tab picker, field order, product name visible

Commit SHA:

04439a5

Verified themes:

- Columns tab picker
- Field order
- Product name visibility

This is one of the first clearly documented steps toward the current
customizable field/form/list architecture.

---

# 11. DEVELOPMENT PHASE — V11.2

Commit:

v11.2.0 all tab fields, edit/delete on real form, products in orders with gift

Commit SHA:

de77c8d

Verified themes:

- All tab fields
- Edit/delete on real form
- Products in orders
- Gift quantity/product functionality

The CRM form system became increasingly tied to real operational data.

---

# 12. DEVELOPMENT PHASE — V11.3

Commit:

v11.3.0 row-order, move, field size, show in form/list

Commit SHA:

cf8d3c4

Verified themes:

- Row order
- Field movement
- Field size
- Show in form
- Show in list

This confirms that field configuration is not merely cosmetic.

Field placement and visibility are part of the functional CRM behavior.

---

# 13. DEVELOPMENT PHASE — V11.3.1

Commit:

v11.3.1 restore columns tab grid after missing DEFAULT_LIST_ON

Commit SHA:

6de7239

This is a critical historical fact.

A previous state involving DEFAULT_LIST_ON caused the columns-tab grid
to be missing/broken, and V11.3.1 restored it.

IMPORTANT AGENT RULE:

Do not remove DEFAULT_LIST_ON or similar configuration merely because it
appears redundant.

The Git history demonstrates that configuration related to default list
behavior has previously been important for restoring functionality.

---

# 14. DEVELOPMENT PHASE — V11.4

Commit:

v11.4.0 real field order, row/stack layout, form toggle, all selects in additions

Commit SHA:

542e363

Verified themes:

- Real field order
- Row/stack layout
- Form toggle
- Select fields in additions

This further established the custom field layout system.

---

# 15. DEVELOPMENT PHASE — V11.4.1

Commit:

v11.4.1 dedupe order item fields, product edit, real row/stack and fonts

Commit SHA:

6b97475

Verified themes:

- Deduplication of order item fields
- Product editing
- Real row/stack behavior
- Fonts

The order/product form system was being actively refined.

---

# 16. DEVELOPMENT PHASE — V11.5

Commit:

v11.5.0 split fonts, compact tabs, sticky headers, required star, boxes, no item-box dupes

Commit SHA:

6172abd

Verified themes:

- Split fonts
- Compact tabs
- Sticky headers
- Required field star
- Boxes
- Prevention of duplicate item boxes

The UI became increasingly customized around CRM-specific workflows.

---

# 17. DEVELOPMENT PHASE — V11.5.1

Commit:

v11.5.1 restore main tabs after crm-app.js syntax break

Commit SHA:

f56cb1a

CRITICAL HISTORICAL FACT:

crm-app.js experienced a syntax break during development, and the main tabs
had to be restored.

This proves that crm-app.js is a sensitive/high-impact file.

AGENT RULE:

Before modifying crm-app.js:

1. Inspect current syntax.
2. Inspect dependencies.
3. Inspect all feature files.
4. Test main navigation.
5. Check browser console.
6. Check form/list initialization.

Never rewrite crm-app.js casually.

---

# 18. DEVELOPMENT PHASE — V11.6

Commit:

v11.6.0 fields stay on main tab, box edit, widgets, admin tabs

Commit SHA:

d1955d4

Verified themes:

- Fields staying on main tab
- Box editing
- Widgets
- Admin tabs

The relationship between main tabs, boxes, widgets, and admin configuration
became an important part of the UI architecture.

---

# 19. DEVELOPMENT PHASE — V11.7

Commit:

v11.7.0 boxes with items, tab order on main nav, TENIN logo

Commit SHA:

bc7c447

Additional commits with the same release theme also exist.

Verified themes:

- Boxes with items
- Main navigation tab order
- TENIN logo

The repeated commits indicate iterative development/testing of this area.

Do not assume repeated commits mean the feature is disposable.

---

# 20. CLEANUP COMMIT

Commit:

chore: remove leftover extra files not in current version

Commit SHA:

291ab02

This proves that repository cleanup has occurred historically.

IMPORTANT:

Do not interpret every old-looking file as disposable.

Before deleting a file:

1. Search repository references.
2. Check Git history.
3. Check runtime references.
4. Check deployment references.
5. Verify whether it is intentionally retained.

---

# 21. DEVELOPMENT PHASE — V11.8

Commit:

v11.8.0 one widget per click + manual tab designer

Commit SHA:

3125f0c

Verified themes:

- One widget per click
- Manual tab designer

This is a major architectural milestone.

The project moved further toward a configurable UI/design system.

---

# 22. LOGOUT / NOTIFICATION / HEADER ITERATIONS

Multiple commits exist with the message:

Fix logout button, notification bell sound and update teal header

These commits occurred during the V11 development period.

The repeated commits show iterative debugging/refinement.

Do not assume that repeated commits represent independent features.

They may represent successive attempts at the same behavior.

---

# 23. DEVELOPMENT PHASE — V11.12

Commit:

v11.12.0 searchable selects, geo city after province, shared pharmacy names,
real freeze header, lock manual designer

Commit SHAs include:

db4eba2
358964e

Verified themes:

- Searchable selects
- City selection after province
- Shared pharmacy names
- Real freeze header
- Manual designer lock

This is another major milestone in the form/designer subsystem.

---

# 24. DEVELOPMENT PHASE — V11.13

Commit:

v11.13.0 under-row layout, field width in edit form, edit scroll restore,
delete without hiding siblings, FA labels, required star,
order pharmacy match, one-line align, locked manual design, Excel-related behavior

Commit SHA:

b90f5c6

Verified themes:

- Under-row layout
- Field width in edit form
- Edit scroll restoration
- Delete behavior without hiding siblings
- Persian/FA labels
- Required star
- Order/pharmacy matching
- One-line alignment
- Locked manual design
- Excel-related behavior

This release contains several changes that directly affect real-world
data-entry workflows.

---

# 25. DEVELOPMENT PHASE — V11.14

Commit:

v11.14.0: ستاره چسبیده، فونت جدا، ترتیب فرم/لیست، ارتفاع واقعی،
کادر/کلید، طراح دستی، کپی انتخابی

Commit SHA:

84a8c93

A subsequent commit with the same release theme is:

324c9ad

Verified themes include:

- Attached/connected required star behavior
- Separate fonts
- Form/list ordering
- Real height behavior
- Box/key behavior
- Manual designer
- Selective copy

The later V11.14 commit also added:

AI_PROJECT_CONTEXT.md

Therefore the current repository explicitly contains a machine-readable
project context intended to preserve development knowledge.

---

# 26. AI PROJECT CONTEXT DECISION

Commit:

324c9ad

The repository now contains:

AI_PROJECT_CONTEXT.md

This was created specifically to preserve project knowledge for future
AI-assisted development.

The document states that the project has evolved through multiple versions
and architectural layers and that historical reasoning is not yet fully
recovered.

This means future agents must NOT assume that Git source code alone explains
the reason behind every implementation.

---

# 27. FORM/LIST DESIGNER — HISTORICAL DEVELOPMENT CHAIN

The verified development chain is:

V11.1
    |
    +-- columns picker
    +-- field order
    |
V11.2
    |
    +-- tab fields
    +-- real form edit/delete
    |
V11.3
    |
    +-- row order
    +-- field movement
    +-- field size
    +-- form/list visibility
    |
V11.3.1
    |
    +-- DEFAULT_LIST_ON restoration
    |
V11.4
    |
    +-- real field order
    +-- row/stack
    +-- form toggle
    |
V11.4.1
    |
    +-- deduplication
    +-- product edit
    |
V11.5
    |
    +-- fonts
    +-- compact tabs
    +-- sticky headers
    +-- required star
    +-- boxes
    |
V11.5.1
    |
    +-- crm-app.js syntax recovery
    |
V11.6
    |
    +-- boxes
    +-- widgets
    +-- admin tabs
    |
V11.7
    |
    +-- boxes with items
    +-- main nav order
    |
V11.8
    |
    +-- manual tab designer
    |
V11.12
    |
    +-- searchable selects
    +-- freeze header
    +-- lock manual designer
    |
V11.13
    |
    +-- under-row
    +-- field width
    +-- edit scroll restore
    +-- delete behavior
    +-- required star
    |
V11.14
    |
    +-- form/list order
    +-- real height
    +-- manual designer
    +-- selective copy

CONCLUSION:

The current Form/List/Manual Designer subsystem is the result of a long
iterative development chain.

It must NOT be replaced casually.

---

# 28. VERIFIED SAFETY LESSONS FROM HISTORY

The Git history provides several concrete lessons.

LESSON 1:

crm-app.js can suffer syntax-level breakage that affects main navigation.

LESSON 2:

Removing or changing configuration can break the columns/list system.

LESSON 3:

Form/List behavior has been changed repeatedly across many versions.

LESSON 4:

Manual Designer functionality is deeply integrated into later versions.

LESSON 5:

Cleanup has occurred before, but cleanup must not be performed without
reference analysis.

LESSON 6:

Repeated commits may represent iterative debugging rather than unnecessary
duplication.

LESSON 7:

The project contains historical requirements that are not fully represented
by current source code alone.

---

# 29. WHAT GIT CAN TELL US

Git can reliably tell us:

- What files changed
- When a commit occurred
- Commit message
- Commit sequence
- Which version was being developed
- Some implementation evolution

---

# 30. WHAT GIT CANNOT TELL US

Git alone cannot reliably tell us:

- The exact user request
- The exact original AI prompt
- Why the user wanted a change
- Which alternatives were rejected
- Which UI behavior was considered mandatory
- Which bug originally motivated a change unless documented
- Which hidden business rule was discussed in the lost conversation

Therefore these must remain UNKNOWN until recovered from other evidence.

---

# 31. NO FABRICATION RULE

Future AI agents must never invent historical reasoning.

If the agent does not know why a feature exists:

Say:

"Historical reason not recovered."

Do not say:

"This was designed because..."

unless the repository or recovered conversation proves it.

---

# 32. DECISION CONFIDENCE LEVELS

Use these labels:

[VERIFIED]
Directly supported by Git/source/documentation.

[INFERRED]
Reasonable interpretation supported by multiple verified facts.

[UNKNOWN]
Not currently recoverable.

Example:

[VERIFIED]
V11.8 introduced the manual tab designer.

[INFERRED]
The manual designer became a core UI customization subsystem.

[UNKNOWN]
The original user requirement that caused the manual designer to be built.

---

# 33. FUTURE DECISION LOGGING RULE

Every important future change should add an entry containing:

Date:
Version:
Commit:
Request:
Reason:
Affected subsystem:
Affected files:
Decision:
Alternatives considered:
Risk:
Verification:
Rollback:

If some information is unknown:

Write UNKNOWN.

Never invent missing information.

---

# 34. FUTURE AI DEVELOPMENT RULE

Before modifying an existing subsystem:

1. Read AI_PROJECT_CONTEXT.md
2. Read AI_ARCHITECTURE.md
3. Read AI_RULES.md
4. Read relevant section of AI_DECISION_LOG.md
5. Inspect Git history
6. Inspect current source
7. Identify dependencies
8. Perform READ-ONLY analysis
9. Report findings
10. Wait for approval when required

---

# 35. CURRENT HISTORICAL BASELINE

Current recovered baseline:

V5
  ↓
V6
  ↓
V7
  ↓
V8
  ↓
V9
  ↓
V10
  ↓
V11.0
  ↓
V11.1
  ↓
V11.2
  ↓
V11.3
  ↓
V11.3.1
  ↓
V11.4
  ↓
V11.4.1
  ↓
V11.5
  ↓
V11.5.1
  ↓
V11.6
  ↓
V11.7
  ↓
V11.8
  ↓
V11.12
  ↓
V11.13
  ↓
V11.14
  ↓
V11.15

This is the currently recovered historical development path.

It is NOT claimed to be a complete list of every commit.

---

# 36. CURRENT UNKNOWN HISTORY

The following remain unrecovered:

1. Complete original AI conversation.
2. Complete original prompts.
3. Complete reasoning behind V5.
4. Complete reasoning behind V6's 12 historical prompts.
5. Complete original Ultra-Professional Master Specification.
6. Complete reasoning behind every V9 feature.
7. Complete reasoning behind V10 architecture.
8. Complete reasons for retaining parallel systems.
9. Complete reasons behind every cleanup decision.
10. Complete production incidents that motivated individual fixes.

These must remain UNKNOWN.

---

# 37. FINAL RULE

The repository is the verified implementation history.

AI_PROJECT_CONTEXT.md describes the project context.

AI_ARCHITECTURE.md describes the architecture.

AI_DECISION_LOG.md describes verified historical evolution.

None of these documents should be treated as permission to redesign the
system.

They exist to prevent loss of knowledge and accidental regressions.

---

# 38. V11.15.0 DEVELOPMENT PHASE

Date: 2026-08-16

Source of request: single user message listing 14 numbered change requests,
plus the explicit constraints: do not change the project skeleton, deliver
the complete program files for download, and supply the GitHub update
commands with the new version.

Decision 1 — keep the versioned-file pattern (VERIFIED)
A single new file `public/crm-features-v19.js` was created and loaded last
(after v18) in `index.html`. Surgical edits were made to `crm-app.js`
(order items/totals only), `crm-features-v11.js` (delete semantics, builtin
`allowAddOption`, skip `meta.deleted`), `crm-data.js` (one new
`PERMISSION_GROUPS` group), `index.html` (order-table header/totals markup,
removal of the two additions-tab boxes, version bumps), `sw.js`,
`server.js`, and `package.json`. No existing versioned file was deleted or
renamed.

Decision 2 — request #9 was ambiguous (VERIFIED as ambiguity)
The Persian sentence for item 9 contains a typo that makes the literal
meaning unclear. Implemented interpretation: an edit ✏️ button was added
NEXT TO the existing delete 🗑️ button on each order-item row, opening the
matching catalog product for editing. This interpretation is INFERRED and
must be confirmed or corrected by the user.

Decision 3 — real list ordering (VERIFIED in code)
List column ordering previously existed only as stored numbers (the v18
wrapper sorted a discarded copy — dead code). v19 now reorders actual
rendered table cells against a slot map that mirrors each list renderer's
column structure, guarded by a cell-count check; if a renderer's structure
changes the reorder silently skips instead of corrupting rows.

Decision 4 — backup target storage (VERIFIED design, PENDING browser test)
The File System Access API directory/file handle cannot be kept in
localStorage; it is persisted in IndexedDB and re-granted with
`queryPermission`/`requestPermission` on the backup page. Saving directly
into a user-chosen folder silently is only possible in Chromium-based
browsers over a secure context; other browsers get a "save as" picker or a
regular download fallback. This is a platform limitation, not a code
choice.

Decision 5 — fake connectivity test retired (VERIFIED)
`testServerConnectivity` in `crm-app.js` was a hardcoded 700 ms setTimeout
that always reported success. The troubleshooting button now runs the
granular diagnostic suite instead. The original function body was left in
place (overridden at runtime by v19) to keep `crm-app.js` edits minimal.

Decision 6 — permissions rule (VERIFIED, user-mandated)
Item 14 was recorded as a permanent rule in AI_RULES.md (#62). The new
permission group "ابزارهای مدیریت (نسخه ۱۱.۱۵)" was appended to
`PERMISSION_GROUPS`; existing users keep working because
`getDefaultPermissionsObject(true)` covers new keys and
`migratePermissions` backfills them.

UNKNOWN on purpose:

1. Whether the user's hosted production (Render) currently serves the state
   the user edits locally; deployment was not touched in this phase.
2. Whether item 9's interpretation matches the user's intent.
3. Long-term interaction between the v19 cell-reorder engine and any future
   list renderer that changes its column structure.

Verification status: `node --check` passes for every JS file; an HTTP smoke
test of `server.js` served index.html (with the v19 tag) and reported
version 11.15.0 on `/api/health` (VERIFIED). All 14 items still require
in-browser confirmation by the user (PENDING USER VERIFICATION).

---

---

# 39. CHAT.ARENA MEMORY FILE DECISION

Date: 2026-08-16

The user requested a single permanent handoff file named `chat.arena` that
must always contain: the full project summary, architecture, the complete
ordered user/AI chat, all permanent rules, and the complete source of every
text file — so that a fresh AI session can continue the project with zero
verbal explanation.

Decision:
chat.arena is created at the repository root and treated as a required
project artifact. AI_RULES.md #63 makes its continuous update and inclusion
in every delivered ZIP mandatory.

Reason:
the user explicitly wants immunity against chat loss / context breakage.

---

# 40. V11.15.1 HOTFIX — HARDCODED REQUIRED-FIELD CHECKS REMOVED

Date: 2026-08-16

User report: the star problem was not solved by v11.15.0; with only
pharmacyName starred, saving a pharmacy still raised
«لطفاً نام، استان، شهر، منطقه و آدرس/لوکیشن داروخانه را کامل کنید.»

Root cause (VERIFIED from source): 9 hardcoded `if (!field...) alert(...)`
blocks in the entity save paths, independent of the star system:
3 in the active v9 handlers (`savePharmacyV9`, `saveDoctorV9`,
`saveOrderV9` in crm-features-v9.js) and 6 in the two duplicated code
generations of crm-app.js.

Fix (VERIFIED): all 9 blocks replaced by a call to
`window.validateRequiredFields(tabId)` — the star-aware validator that only
blocks on admin-starred fields and skips hidden/deleted fields. The
"at least one order item" check was kept as a business rule (not a field).
Version bumped to 11.15.1 (package.json, server.js health/log, sw.js cache,
index.html ?v= params). node --check green; /api/health reports 11.15.1.

PENDING USER VERIFICATION in the browser: with only pharmacyName starred,
saving a pharmacy with empty province/city/district/address must now succeed
without any forced-field warning.

---

# 41. AUTOMATIC DELIVERY ZIP RULE

Date: 2026-08-16

User feedback: the ZIP they downloaded was still v11.15.0 (server logs
confirmed those downloads happened before the v11.15.1 build existed), and
they declared a new PERMANENT rule: whenever a user request is completed, a
fresh download ZIP must automatically appear next to the page.

Decision:
Recorded as AI_RULES.md #64. Delivery checklist per completed request:
rebuild ZIP → point the download preview at the new file (restart it) →
present the ZIP → verify the embedded package.json version and state the
proof in the reply.

---

# 42. V11.15.2 — DUPLICATE-SAVE WARNING BECOMES A REAL CHOICE

Date: 2026-08-16

User request: the duplicate pharmacy warning ("هشدار: داروخانه‌ای با این نام
یا تلفن قبلاً ثبت شده؛ با این حال ذخیره می‌شود.") showed only OK and always
saved. Wanted: yes/no choice; خیر must cancel the save.

Change (VERIFIED): all four duplicate-warning sites (pharmacy + doctor in
the active v9 save handlers, and the two duplicated generations in
crm-app.js) converted from one-way `alert` to `window.confirm`; cancelling
returns before the record is pushed. Version bumped to 11.15.2.

Note (stated to user honestly): the two button captions come from the
browser (تأیید/انصراف in Persian Windows); the dialog text itself spells
out which button saves and which cancels.

---

# 43. OFFICIAL_FILELIST WHITELIST REPAIR + DURABLE CHAT.ARENA GENERATOR

Date: 2026-08-16

Findings (VERIFIED):
1. OFFICIAL_FILELIST.txt — the whitelist consumed by the user's
   CLEAN_EXTRA_FILES.bat (scripts/clean-extra-files.ps1 deletes any file not
   listed) — was missing: chat.arena, public/crm-features-v17.js,
   public/crm-features-v18.js, public/crm-features-v19.js, all AI_*.md
   memory files, and ARENA_HANDOFF_PROMPT.md. Running the cleanup would
   have deleted them from the user's machine.
2. The Arena sandbox reset wiped workspace-root helpers (the old chat.arena
   generator, the download server, the zips) — only the git repo persisted.

Decisions:
- All missing files were added to OFFICIAL_FILELIST.txt (now 234 entries).
- The chat.arena generator was recreated INSIDE the repo as
  `update_chat_arena.py` (self-locating via its own path) so it ships in the
  ZIP and survives sandbox resets; rules #63/#64 remain in force — the
  file is regenerated via this script after every chat/version.
- chat.arena rule #8 added (permanent): every new project file must be
  added to OFFICIAL_FILELIST.txt immediately.

---

# 44. V11.15.3 — ZERO-DEPENDENCY RUNTIME (node_modules FULLY REMOVABLE)

Date: 2026-08-16

User request: node_modules must never enter GitHub/GitLab and, if possible,
should not need to be installed at all — plus a delete command for it.

Verification (VERIFIED):
- `server.js` requires only Node built-ins: http, fs, path, zlib, crypto.
- Every `scripts/*.mjs` imports only Node built-ins (fs/path/url/child_process).
- `git ls-files` + history: node_modules was NEVER tracked in git.
- `.gitignore` already had `/node_modules`; extended to any-depth
  `node_modules/`.

Decision: the declared `express`/`cors` dependencies in package.json were
dead weight from the dormant Next.js skeleton era. Removed them (v11.15.3)
and regenerated `package-lock.json` dependency-free (292 bytes, 0 packages,
npm audit: 0 vulnerabilities). `npm install` is now a no-op on Render
(`npm install --include=dev && npm run build` still succeeds). User delete
command: `rmdir /s /q node_modules` (Windows) / `rm -rf node_modules` (Linux/Mac).

---

# 45. GIT SECRETS AUDIT + HARDENED .gitignore (v11.15.3)

Date: 2026-08-16

User request: guarantee `.env` (tokens/passwords) never enters Git, and
delete it from GitHub if already there.

Audit result (VERIFIED): no real `.env` ever existed in git history. The
only tracked match is the template `.env.ndcohub.example`; it contained a
sample line `ADMIN_PASSWORD=admin1234` which was sanitized to `--------`.

Changes: `.gitignore` now blocks `.env`, `.env.*`, `*.env` with explicit
re-allow `!.env*.example`, plus `server-db.json`, `*.zip`, `.arena/`,
any-depth `node_modules/`. Rule recorded as AI_RULES #65 with a rotation
mandate if a real secret is ever leaked to git.

---

# 46. DUAL-REMOTE ONE-COMMAND SYNC + CROSS-SYSTEM FILES (v11.15.3)

Date: 2026-08-16

User request: every local change must update GitHub AND GitLab with ONE
command; files must work on any system (user alternates between two PCs
and moves the project folder between them).

Changes:
- `SYNC_ALL.bat` (Windows) and `sync_all.sh` (Linux/Mac): pull origin →
  pull gitlab (if remote exists) → `git add -A` → commit (message arg or
  timestamp) → push origin → push gitlab. Works immediately for GitHub
  only; GitLab activates after the one-time `git remote add gitlab ...`
  (steps in `RAHNAMA_GITLAB.txt`).
- `.gitattributes` added: `* text=auto`, `.bat/.cmd/.ps1`=CRLF,
  `.sh/.py/.mjs`=LF, images/fonts/zips binary — line endings can no longer
  break scripts when hopping between Windows and Linux.
- `.gitlab-ci.yml` build stage: removed the dormant-Next steps
  (`npx next typegen`, `npx tsc --noEmit`) so GitLab CI stays green like the
  Render echo-build. Mirror stage (GitLab→GitHub) left intact (optional).
- OFFICIAL_FILELIST.txt: added `KEEP_ONLY_GITHUB.bat` (was missing —
  cleanup would have deleted it) plus the 4 new files (239 entries).

---

# 47. PROJECT KNOWLEDGE GRAPH (PROJECT_GRAPH.md + update_project_graph.py)

Date: 2026-08-16

User request: stop re-reading the whole codebase every turn (token waste);
build ONE file that is the project's knowledge graph (all files, "classes"
/functions, and their relationships — e.g. what relates to the API service)
and keep it updated as the AI's first-stop reference.

Decision (VERIFIED): `update_project_graph.py` statically parses server.js,
scripts/*.mjs and all public/*.js and emits `PROJECT_GRAPH.md`: script load
chain (17 scripts), per-file cards (role/size/functions/window names), the
window override graph (which layer overrides which), the API consumer map,
browser-storage key map, tab↔file map and duplicated-function hotspots.
Output deterministic; rule #66 makes it regenerate before every chat.arena
build. First build: 26 files, 131 window names, 23 tabs, 36 KB.

---

# 48. V11.16.0 — crm-features-v20.js MEGA-LAYER

Date: 2026-08-16

New last-layer file `public/crm-features-v20.js` (no skeleton changes; loads
after v19 so it wins all overrides):

1. `window.state` getter (defineProperty) — the v19 diagnostics row
   «شی state در دسترس نیست» was because crm-app.js declares `state` with a
   lexical binding, invisible as window.state. Fixed; plus /api/state now
   reports a neutral OK line and the stale cloud-servers blurb in
   index.html was replaced with real guidance.
2. `window.v20DupGate(kind)` — exact-duplicate records (all normalized
   fields equal, incl. case of ANOTHER user having entered them) are HARD
   BLOCKED with "edit-only" message; near duplicates (name or phone) keep
   the 11.15.2 confirm dialog. Wired into all 4 save paths (v9 pharmacy/
   doctor + 2 duplicate generations in crm-app.js per rule #1/#62 spirit).
3. Additions-tab combo manager: per-tab selector, every combo field of the
   tab with Persian label, its options stacked UNDER the field, per-option
   ✏️/🗑️, per-field instant search, per-field add box, and live refresh
   (MutationObserver + saveState wrap). Renames/removals persist via
   state.v20Renames / state.v20HiddenOptions / state.selectExtraOptions.
4. Grey-chain engine: dependent fields disabled+grey until parent filled
   (defaults: province→city→district in pharmacy/doctor/order); master
   toggle + per-field parent selector in the combo manager
   (state.v20GreyMap, settings.v20GreyOn).
5. Order form lock: all fields grey/disabled except pharmacy name until an
   existing pharmacy is selected and auto-filled ("جایگذاری خودکار");
   afterwards descriptor fields stay grey and ONLY the product section is
   active (settings.v20OrderLock, default ON).
6. Pharmacy-name instant add ⇒ auto-save (delegated click on the ➕ add
   button inside tab-pharmacies clicks btnSavePharmacy).
7. Mirror: fields added/removed in pharmacies tab auto-add/remove in orders
   (state.customFields clone with `ordm-` prefix + deleteCustomField wrap).
8. Product-box field insertion fix: stored customFields.products are now
   rendered into the product form grid with real width/order applied.
9. List columns: post-render reorder wrapper enforcing ردیف=col#1,
   rep-name=col#2 and listOrder for mapped columns (2+ matches required).
10. Number spinners removed from order-item qty inputs (CSS).
11. "🔑 تغییر رمز" button fixed at the top of every page; writes
    CRM_USERS_AUTH + state.users so the next login uses the new password.
12. Role presets (نماینده علمی / کارشناس فروش / سرپرست) in the users tab —
    one click applies a ready-made permission bundle (admin user excluded).
    New PERMISSION_GROUPS block «ابزارهای مدیریت (نسخه ۱۱.۱۶)» in
    crm-data.js (rule #62 satisfied).

All syntax-checked (node --check) and server smoke-tested (11.16.0).
Browser confirmation by the user is pending.

---

# 49. GITHUB REMOTE HISTORY REPLACED — "پروژه اولیه" SINGLE COMMIT

Date: 2026-08-16

User report: GitHub did NOT show the updated files (still old program).

Diagnosis (VERIFIED via fetch): origin/main had been replaced by ONE manual
commit `c0abb06 «پروژه اولیه»` containing the v11.15.3 snapshot (has
SYNC_ALL.bat / chat.arena / crm-features-v19.js / update_chat_arena.py;
NO crm-features-v20.js / PROJECT_GRAPH.md). The old history (921f60d etc.)
is gone from remote, so the user's normal pushes were rejected
(unrelated/diverged histories).

Fix delivered: `PUSH_FRESH_GITHUB.bat` — commits local files, fetches,
merges with `--allow-unrelated-histories -X ours` (his files always win),
then pushes and prints the remote tip as proof. After this one-time repair,
SYNC_ALL.bat works normally again.

GitLab without token (user: token page is disabled): SSH-key method was
documented in RAHNAMA_GITLAB.txt (ssh-keygen → add public key →
remote set-url gitlab git@gitlab.com:...). GitLab support stays in the
code (SYNC_ALL auto-detects the gitlab remote and skips gracefully).

# END OF AI DECISION LOG