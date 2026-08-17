# AI ARCHITECTURE
# Namayande Elmi — v11.14.0

This document describes the currently confirmed architecture of the project.

IMPORTANT:

This is an architecture map, not a redesign proposal.

The architecture described here reflects the existing repository.

Do not replace, simplify, merge, or refactor architectural layers
unless explicitly requested and fully analyzed.

---

# 1. SYSTEM OVERVIEW

Namayande Elmi is a hybrid CRM/PWA system for:

- Medical representatives
- Pharmacies
- Doctors
- Visits
- Orders
- Products
- Targets
- Maps/GPS
- Trips
- Notifications
- Messaging
- Administration
- Synchronization
- Mobile access

The current repository contains multiple application/runtime layers.

High-level architecture:

Browser
   |
   +-----------------------------+
   |                             |
   v                             v
Next.js App Router          Legacy/Public CRM
   |                             |
   |                         public/index.html
   |                             |
   |                    crm-app.js + crm-data.js
   |                             |
   |                    crm-features-v9 ... v18
   |
   +---- Next.js Pages
   |
   +---- Next.js API Routes
   |
   +---- Components
   |
   +---- DB / Drizzle
   |
   +---- Lib / Services
   |
   +---- PWA / Offline

Backend/runtime also contains:

server.js
   |
   +---- HTTP server
   +---- public static files
   +---- health/ping
   +---- legacy/static CRM behavior
   +---- geocode-related behavior
   +---- server-db.json related behavior

Database:

PostgreSQL
   |
   +---- Drizzle ORM
   |
   +---- schema
   |
   +---- migrations
   |
   +---- application data

Other major subsystems:

   Sync
   Mobile
   Maps/GPS
   Messaging
   Backup/Restore
   Authentication
   Authorization
   PWA/Offline

---

# 2. IMPORTANT ARCHITECTURAL PRINCIPLE

The project is NOT a simple single-layer Next.js application.

The repository currently contains:

- Next.js
- server.js
- public CRM
- versioned CRM feature files
- PostgreSQL
- Drizzle
- PWA/offline
- mobile
- synchronization
- maps/GPS
- messaging
- backup/restore

Therefore:

DO NOT assume that replacing one layer with another is safe.

---

# 3. REPOSITORY STRUCTURE

Important top-level directories:

.github/
mobile/
public/
scripts/
src/

Important top-level files:

package.json
server.js
render.yaml
next.config.ts
drizzle.config.json
AI_PROJECT_CONTEXT.md
AI_RULES.md
AI_TASKS.md
AI_DECISION_LOG.md
AI_ARCHITECTURE.md
README.md
README_FA_COMPLETE.md
CHANGES_V9.md
CHANGES_V10.md
CHANGES_V11.md

---

# 4. NEXT.JS APPLICATION LAYER

The repository contains a Next.js App Router application.

Main area:

src/app/

This layer contains application routes/pages and API routes.

Known functional areas include:

- login
- panel
- admin
- reports
- records
- map
- trips
- users
- notifications
- sync
- backup
- settings
- diagnostics
- offline
- authentication APIs
- mobile APIs

Next.js is therefore a major application layer.

---

# 5. NEXT.JS API LAYER

API routes are located under:

src/app/api/

Known API groups include concepts such as:

/api/auth/*
/api/mobile/*
/api/sync/*
/api/records/*
/api/targets
/api/geocode
/api/health
/api/ping

The exact endpoint list must be inspected from source before modifying APIs.

Do not infer an endpoint's behavior from its name alone.

---

# 6. SERVER.JS LAYER

server.js is a separate runtime component.

It currently:

- creates an HTTP server
- serves public files
- provides health/ping behavior
- handles static assets
- handles compression
- provides some legacy/static application behavior
- references server-db.json
- contains rate-limiting behavior
- contains geocode-related behavior

Current package.json defines:

main:
server.js

start:
node server.js

dev:
node server.js

Therefore server.js must be treated as an active runtime component.

Do not replace it with `next start` merely because Next.js exists.

---

# 7. PUBLIC CRM LAYER

The project contains a substantial public CRM application.

Important entry:

public/index.html

Important files:

public/crm-app.js
public/crm-data.js

Versioned feature files include:

public/crm-features-v9.js
public/crm-features-v10.js
public/crm-features-v11.js
public/crm-features-v12.js
public/crm-features-v13.js
public/crm-features-v14.js
public/crm-features-v15.js
public/crm-features-v16.js
public/crm-features-v17.js
public/crm-features-v18.js

The versioned files are part of the existing CRM architecture.

Do not delete them based only on their filenames.

---

# 8. CRM SCRIPT DEPENDENCY MODEL

The public CRM uses multiple JavaScript files.

The approximate architecture is:

index.html
    |
    +--> crm-data.js
    |
    +--> crm-app.js
    |
    +--> crm-features-v9.js
    |
    +--> iran-facilities.js
    |
    +--> crm-features-v10.js
    |
    +--> crm-features-v11.js
    |
    +--> crm-features-v12.js
    |
    +--> crm-features-v13.js
    |
    +--> crm-jalali.js
    |
    +--> crm-features-v14.js
    |
    +--> crm-features-v15.js
    |
    +--> crm-features-v16.js
    |
    +--> crm-features-v17.js
    |
    +--> crm-features-v18.js

IMPORTANT:

Script load order may matter.

Before changing the order:

1. Inspect global variables.
2. Inspect function dependencies.
3. Search usages.
4. Check runtime initialization.
5. Test production behavior.

---

# 9. CRM FEATURE VERSIONING

The project has evolved through versioned CRM feature files.

Current known chain:

v9
v10
v11
v12
v13
v14
v15
v16
v17
v18

This does NOT mean that each file is an independent application.

They form a historical/feature layering system.

Some functionality may depend on globals or functions defined by earlier files.

Never rewrite the entire chain simply to make the structure look cleaner.

---

# 10. FORM / LIST / MANUAL DESIGNER SUBSYSTEM

The current CRM has a highly customized form/list system.

Known historical functionality includes:

- field ordering
- field sizing
- show/hide in form
- show/hide in list
- row/stack layout
- boxes
- widgets
- tabs
- manual tab designer
- searchable selects
- freeze headers
- required fields
- product/order fields
- edit/delete behavior
- row restoration
- scroll restoration
- selective copy
- manual designer locking

This subsystem is HIGH RISK.

Before changing it:

1. Identify which versioned CRM file owns the behavior.
2. Search all related functions.
3. Inspect configuration/state.
4. Inspect Form and List rendering.
5. Check edit/delete flows.
6. Check admin/manual designer behavior.
7. Test existing records.

Do not replace it with a new generic form library without explicit approval.

---

# 11. DATABASE ARCHITECTURE

Primary database:

PostgreSQL

ORM:

Drizzle

Main database areas:

src/db/

Important concepts:

schema
migrations
database connection
transactions
retry logic
backup/restore

The database is used by the modern application layer.

---

# 12. DATABASE / LEGACY STORAGE RELATIONSHIP

The repository also contains:

server-db.json

server.js references this file.

At the same time the project contains PostgreSQL/Drizzle.

Therefore there are at least two storage mechanisms present in the repository.

IMPORTANT:

The exact historical relationship between:

server-db.json
and
PostgreSQL

has NOT been fully reconstructed.

Do not assume that one can safely be deleted.

Status:

REQUIRES AUDIT

---

# 13. DATABASE ENTITIES

Known database entities include concepts such as:

users
roles
settings
options
pharmacies
doctors
orders
homes
leaves
trips
tripPoints
messengers
notifications
activityLogs
attachments

This is not guaranteed to be the complete schema.

Always inspect:

src/db/schema.ts

before database changes.

---

# 14. AUTHENTICATION ARCHITECTURE

Authentication exists across the application.

Known API areas include:

/api/auth/login
/api/auth/logout
/api/auth/me
/api/auth/otp
/api/auth/forgot
/api/auth/check-username

There are also session/authentication mechanisms used by the application UI.

Authentication must be analyzed end-to-end before changes.

---

# 15. AUTHORIZATION ARCHITECTURE

The system has roles and permissions.

Known role concepts include:

admin
supervisor
rep

Authorization may exist at:

- UI level
- API level
- database/service level

Do not rely on frontend permission checks as the only security boundary.

The complete permission matrix requires further audit.

---

# 16. SYNCHRONIZATION ARCHITECTURE

Synchronization is a core subsystem.

Known concepts:

uid
updated_at
origin

Known APIs:

POST /api/sync/pull
POST /api/sync/push
POST /api/sync/run
GET /api/sync/status

Known configuration concepts:

NODE_NAME
SYNC_SECRET
SYNC_PEERS
SYNC_INTERVAL_MINUTES

Known deployment topology:

Render
    |
    | sync
    v
NdcoHub

The repository documents two-way synchronization.

---

# 17. SYNC CONFLICT MODEL

The repository documents:

uid
updated_at
origin

and a Last-Write-Wins style model based on updated_at.

This is production-critical.

Do not modify:

- uid generation
- updated_at behavior
- origin
- push payloads
- pull payloads
- conflict handling

without analyzing both sides of synchronization.

---

# 18. MOBILE ARCHITECTURE

The repository contains:

mobile/

The mobile application has its own source code and authentication-related functionality.

Known API concepts:

/api/mobile/nonce
/api/mobile/login-with-phone

Mobile authentication uses a security flow involving:

- nonce
- timestamp
- device ID
- phone
- SIM-related fingerprint
- HMAC-SHA256
- MOBILE_APP_SECRET

Do not change mobile authentication without analyzing:

mobile/
server API
authentication
database
deployment secrets

---

# 19. PWA / OFFLINE ARCHITECTURE

The application contains PWA/offline functionality.

Known components include:

Service Worker
manifest
offline session
IndexedDB
cache behavior
online/offline state
background sync
offline route

The PWA layer interacts with the application and browser storage.

Do not remove or disable service-worker behavior without checking:

- cache invalidation
- authentication
- offline records
- background sync
- API behavior

---

# 20. MAP / GPS ARCHITECTURE

The application contains mapping and location functionality.

Known components include:

Leaflet
GeoJSON
geocoding
GPS
trips
trip points
live location
MapExplorer
map pages

Known areas include:

src/lib/geo.ts
src/components/screens/MapExplorer.tsx
src/app/panel/map
src/app/admin/map

Do not replace the mapping stack without explicit approval.

---

# 21. MESSAGING ARCHITECTURE

The system contains messaging infrastructure.

Supported platform concepts include:

Telegram
Bale
Eitaa
WhatsApp

Important service:

src/lib/messaging.ts

Known concepts:

formatOrderMessage()
sendOne()
dispatchText()
dispatchOrder()
fetchUpdates()

Messaging may involve external providers.

Never expose provider tokens or API credentials.

---

# 22. BACKUP / RESTORE ARCHITECTURE

The project contains database backup/restore functionality.

Backup/restore must be considered together with:

- schema
- migrations
- relationships
- IDs
- attachments
- synchronization
- production data

Never change database entities without considering restore compatibility.

---

# 23. DEPLOYMENT ARCHITECTURE

Deployment platform:

Render

Database:

Neon/PostgreSQL

Important deployment configuration:

render.yaml

Current package start target:

npm run start
    |
    v
node server.js

Do not change this runtime path without verifying actual production behavior.

---

# 24. CI/CD ARCHITECTURE

The repository contains:

.github/workflows/
.gitlab-ci.yml

There are references to deployment automation and external deployment hooks.

Do not modify CI/CD configuration casually.

Before changing deployment:

- inspect workflow
- inspect environment variables
- inspect Render
- inspect GitLab integration
- verify rollback

---

# 25. DATA FLOW — MODERN APPLICATION

General modern flow:

Browser
   |
   v
Next.js App Router
   |
   +--> React Components
   |
   +--> Next.js API
              |
              v
          Service / Lib
              |
              v
          Drizzle ORM
              |
              v
          PostgreSQL

Supporting services:

API
 |
 +--> Authentication
 +--> Authorization
 +--> Sync
 +--> Messaging
 +--> Maps/Geo
 +--> Backup
 +--> Mobile

---

# 26. DATA FLOW — PUBLIC CRM

General public CRM flow:

Browser
   |
   v
public/index.html
   |
   +--> crm-data.js
   |
   +--> crm-app.js
   |
   +--> versioned feature files
   |
   v
CRM UI / Forms / Lists / Maps / Widgets
   |
   v
Existing APIs / storage / services

IMPORTANT:

The exact request/data flow for every feature has not yet been fully mapped.

When working on a feature:

TRACE THE ACTUAL FLOW.

Do not assume the generic diagram is sufficient.

---

# 27. DATA FLOW — SYNCHRONIZATION

Render
   |
   | pull / push
   v
NdcoHub
   |
   v
Database

and the reverse direction:

NdcoHub
   |
   | pull / push
   v
Render

Sync behavior uses:

uid
updated_at
origin

Any change affecting records must consider this flow.

---

# 28. DATA FLOW — MOBILE

Mobile App
   |
   v
Mobile Authentication
   |
   v
/api/mobile/*
   |
   v
Application services
   |
   v
Database

Authentication must be treated as a security boundary.

---

# 29. DATA FLOW — PWA

Browser
   |
   +--> Service Worker
   |
   +--> Cache
   |
   +--> IndexedDB
   |
   +--> Online API
   |
   +--> Background Sync

Offline behavior must not be broken by changing normal API behavior.

---

# 30. CRITICAL SUBSYSTEMS

The following should be considered HIGH RISK:

1. Authentication
2. Authorization
3. Database schema
4. Synchronization
5. Mobile authentication
6. Backup/restore
7. PWA/offline
8. Form/List Designer
9. Manual Tab Designer
10. Production runtime
11. Deployment configuration
12. Public CRM script loading

---

# 31. SAFE CHANGE PRINCIPLE

For every requested feature:

User request
    |
    v
Identify subsystem
    |
    v
Trace actual implementation
    |
    v
Find dependencies
    |
    v
Identify affected files
    |
    v
Assess risks
    |
    v
Propose minimal change
    |
    v
Get approval if required
    |
    v
Implement
    |
    v
Test
    |
    v
Inspect git diff
    |
    v
Verify production behavior

---

# 32. DO NOT CONFUSE ARCHITECTURE WITH HISTORY

This document describes the current architecture.

It does NOT claim to know:

- why every architectural decision was made
- why duplicate systems exist
- which historical implementation was rejected
- which AI prompt originally caused a feature
- why a specific file was preserved

Those belong in:

AI_DECISION_LOG.md

Only verified historical facts should be added there.

---

# 33. UNKNOWN / REQUIRES AUDIT

The following architecture details remain incomplete:

1. Exact request routing between server.js and Next.js.
2. Exact ownership of every public CRM API call.
3. Complete dependency graph of crm-features-v9 through v18.
4. Exact relationship between server-db.json and PostgreSQL.
5. Complete authorization matrix.
6. Complete sync conflict handling.
7. Complete mobile/database dependency graph.
8. Complete backup/restore dependency graph.
9. Complete deployment execution path.
10. Complete historical migration path.

Do not guess these.

---

# 34. ARCHITECTURE CHANGE POLICY

Any proposed change involving:

- replacing server.js
- replacing the public CRM
- removing versioned CRM files
- changing database technology
- changing PostgreSQL schema
- changing sync
- changing authentication
- changing mobile authentication
- changing PWA
- replacing maps
- changing deployment
- changing CI/CD

requires:

1. Architecture impact report
2. Affected files
3. Dependency analysis
4. Risk analysis
5. Migration plan
6. Rollback plan
7. Explicit approval

---

# 35. AGENT READ-ONLY AUDIT

Before coding, the AI agent must be able to answer:

1. What starts the application?
2. What serves the public CRM?
3. What serves the Next.js application?
4. Which APIs are used?
5. Which database is authoritative for the requested feature?
6. Which files implement the feature?
7. Which versioned CRM files affect it?
8. Does sync affect it?
9. Does mobile affect it?
10. Does PWA/offline affect it?
11. Does authentication affect it?
12. Does authorization affect it?
13. Does backup/restore affect it?
14. What can break?
15. What remains uncertain?

If the agent cannot answer these:

STOP.

Do not code.

---

# 36. FINAL ARCHITECTURE RULE

The existing architecture is the source of truth.

Do not redesign it from assumptions.

Inspect.

Trace.

Understand.

Then change only what is requested.

---

# REPO OPERATIONS TOOLING (v11.15.3)

- Runtime is ZERO-DEPENDENCY: `server.js` and all `scripts/*.mjs` use only
  Node built-ins. `server-db.json` is runtime-written local data (gitignored).
- Sync: `SYNC_ALL.bat` / `sync_all.sh` → pull origin (+gitlab) → commit →
  push origin (+gitlab). GitLab remote is added once by the user
  (`RAHNAMA_GITLAB.txt`). `.gitlab-ci.yml` mirrors GitLab→GitHub only if
  GITHUB_TOKEN/GITHUB_REPO_URL CI vars exist (optional path).
- Portability: `.gitattributes` enforces CRLF for `.bat/.ps1`, LF for
  `.sh/.py`, binary for media — safe folder moves between the user's two PCs.
- Whitelist: `OFFICIAL_FILELIST.txt` (239 entries) is consumed by
  CLEAN_EXTRA_FILES.bat / scripts/clean-extra-files.* — every new repo file
  must be registered there immediately.

# END OF AI ARCHITECTURE

## معماری افزوده v11.18.0 — Snapp Corporate
- UI: `tab-snapp-corporate` در index، منو در MENU_SECTIONS_LIST، موتور در آخرین لایه v20.
- Data: `state.snappCorporate = {headers, rows, files, lastImport}`؛ dedupe با امضای کامل ردیف.
- Import: CSV/TSV parser + XLSX ZIP/XML browser parser؛ بدون npm dependency.
- Security boundary: no credentials, no CAPTCHA solving; official site opens in a separate secure tab.
- Live map: option empty means all reps; reverse endpoint populates `rep.textAddress`.

## معماری افزوده v11.19.0
- Snapp archive: `rows` and `topups`, each immutable from UI, newest imports prepended, full-row signatures dedupe.
- Header detection scans first 25 rows; trip and topup schemas are separated.
- Share ordering: `settings.v20ShareOrder[entity][fieldId]`; rendering sorts before composing text.
- Target report derives distributor/pharmacy unit and total prices from `state.products`.
