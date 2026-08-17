# AI PROJECT CONTEXT
# Namayande Elmi

> This document is the persistent context for AI coding agents working on this project.
>
> IMPORTANT:
> This is an existing production project.
> It is NOT a new project.
>
> The AI agent MUST understand the existing architecture before modifying code.

---

# 1. PROJECT IDENTITY

Project name:

Namayande Elmi

Repository:

https://github.com/javadalamdarmehraeen-rgb/namayandeelmi-javad

Production:

https://namayandeelmi-javad.onrender.com

Current project version reported by package.json:

11.14.0

Current project state:

Existing production application with a hybrid architecture.

---

# 2. CRITICAL WARNING

DO NOT assume this is a simple Next.js application.

The project contains multiple architectural layers that have evolved over time.

The current project includes:

- Node/server.js runtime
- Public HTML/JavaScript CRM application
- Next.js App Router
- Next.js API routes
- PostgreSQL
- Drizzle ORM
- PWA / Service Worker
- Mobile application
- Synchronization system
- Maps/GPS functionality
- Backup/restore functionality
- Messaging functionality
- Role and permission system

These layers may depend on each other.

DO NOT simplify or rewrite the architecture without explicit approval.

---

# 3. CURRENT RUNTIME

package.json currently defines:

npm start
    -> node server.js

Therefore the current Render runtime must NOT automatically be assumed to be:

next start

The repository also contains scripts/start.mjs and Next.js build/start infrastructure.

There is therefore an architectural/runtime distinction that must be preserved until fully verified.

DO NOT change package.json, server.js, render.yaml, or scripts/start.mjs merely to make the architecture look cleaner.

Before changing runtime behavior, trace the complete deployment path.

---

# 4. PRIMARY UI

The current root Next.js page does NOT directly implement the primary CRM interface.

src/app/page.tsx embeds:

/index.html

through an iframe.

Therefore the actual CRM interface is heavily dependent on:

public/index.html

and its JavaScript dependencies.

IMPORTANT:

Do NOT assume that modifying React components automatically modifies the primary CRM interface.

Always determine which UI layer owns the requested feature.

---

# 5. PUBLIC CRM APPLICATION

public/index.html is a critical active file.

It contains the primary CRM interface and loads the following JavaScript files.

Important load order includes:

- crm-data.js
- crm-app.js
- crm-features-v9.js
- iran-facilities.js
- crm-features-v10.js
- crm-features-v11.js
- crm-features-v12.js
- crm-features-v13.js
- crm-jalali.js
- crm-features-v14.js
- crm-features-v15.js
- crm-features-v16.js
- crm-features-v17.js
- crm-features-v18.js

IMPORTANT:

crm-features-v9.js through crm-features-v18.js are currently loaded by public/index.html.

Therefore they MUST NOT be treated as unused files without verifying their dependencies.

Do NOT delete them.

---

# 6. LEGACY FILES

The repository contains historical CRM JavaScript versions.

Older versions such as v1-v8 appear in the project's historical/extra-file management context.

However:

v9-v18 are currently part of the official loaded CRM application.

Therefore:

v1-v8:
    Historical/legacy status requires care.

v9-v18:
    Currently active/official according to public/index.html and the project file structure.

Never delete versioned CRM files simply because they look old.

---

# 7. NEXT.JS LAYER

The project contains a substantial Next.js App Router implementation.

Important areas include:

src/app
src/components
src/db
src/lib

src/app contains areas including:

- admin
- login
- panel
- diagnostics
- install
- offline
- API routes
- map-related functionality
- screenshots
- icons

The Next.js layer must be treated as a real part of the application.

However, it must not be assumed to be the only frontend layer.

---

# 8. COMPONENT ARCHITECTURE

The project contains React components including concepts such as:

- SessionProvider
- Shell
- MapBox
- RecordScreen
- NotificationBell
- ServiceWorker
- ConnectionStatus
- FileUploader

It also contains screen-level components including:

- HomeScreen
- MapExplorer
- ReportScreen
- TargetPanel
- NotificationScreen
- OptionsScreen

Before modifying a component, determine whether the requested behavior is actually used by the production UI.

---

# 9. API ARCHITECTURE

The project contains a substantial Next.js API layer.

Important API areas include:

/api/auth
/api/backup
/api/mobile
/api/records
/api/sync
/api/trips
/api/map
/api/tiles
/api/attachments
/api/messengers
/api/activity
/api/targets
/api/users
/api/settings
/api/options
/api/notifications

Important authentication endpoints include concepts such as:

/api/auth/login
/api/auth/logout
/api/auth/me
/api/auth/otp
/api/auth/forgot
/api/auth/check-username

Important synchronization endpoints include:

/api/sync/pull
/api/sync/push
/api/sync/run
/api/sync/status

Important mobile endpoints include:

/api/mobile/login-with-phone
/api/mobile/nonce

Do not change an API without inspecting all known callers and consumers.

---

# 10. SERVER.JS API

server.js also exposes application endpoints.

Known endpoints include:

/api/state
/api/backup
/api/health

The /api/state mechanism interacts with server-db.json.

This means the project contains both:

1. Legacy/server state storage mechanisms
2. Modern PostgreSQL/Drizzle database mechanisms

Do not assume that server-db.json is unused without tracing its consumers.

---

# 11. DATABASE

The modern database layer uses:

PostgreSQL
+
Drizzle ORM

The main schema is:

src/db/schema.ts

Database configuration is provided through Drizzle configuration.

The DB layer includes retry and transaction-related logic.

Do not bypass the existing DB abstraction without understanding why it exists.

---

# 12. IMPORTANT DATABASE ENTITIES

The current source indicates entities including:

- users
- roles
- settings
- options
- pharmacies
- doctors
- orders
- homes
- leaves
- trips
- tripPoints
- messengers
- notifications
- activityLogs
- attachments

There may be additional entities.

Do not assume this list is exhaustive.

When changing database structures, inspect:

- schema
- migrations
- queries
- API consumers
- backup/restore
- synchronization logic

---

# 13. AUTHENTICATION

The project contains a modern authentication API layer.

Known concepts include:

- login
- logout
- current session
- OTP
- forgot/reset functionality
- username checking

The public CRM UI also uses sessionStorage-based login state.

Therefore authentication exists across multiple architectural layers.

Do NOT replace authentication with a new system without explicit approval.

---

# 14. AUTHORIZATION

The project contains:

- users
- roles
- permissions
- role-related API functionality

The application has a significant permission system.

The exact final permission matrix is:

UNKNOWN / REQUIRES VERIFICATION

Do not invent or simplify permission behavior.

Before changing authorization:

1. Inspect role definitions.
2. Inspect permission checks.
3. Inspect API authorization.
4. Inspect frontend permission handling.
5. Inspect administrator functionality.

---

# 15. SYNCHRONIZATION

Synchronization is a major architectural feature.

Known environment/configuration concepts include:

- NODE_NAME
- SYNC_SECRET
- SYNC_PEERS
- SYNC_INTERVAL_MINUTES
- NEXT_PUBLIC_ENDPOINTS
- PUBLIC_BASE_URL
- MOBILE_APP_SECRET

Known synchronization endpoints include:

/api/sync/pull
/api/sync/push
/api/sync/run
/api/sync/status

There are also deployment/automation scripts that interact with synchronization endpoints.

IMPORTANT:

Synchronization must be treated as production-critical functionality.

Do not modify database schemas, IDs, timestamps, record structures, or APIs without analyzing synchronization implications.

---

# 16. PWA / OFFLINE

The project contains PWA/offline functionality.

Relevant concepts/files include:

- manifest.json
- manifest.webmanifest
- service worker
- service worker template
- offline session
- ServiceWorker React component
- diagnostics for offline/cache/queue state

Do not remove or replace Service Worker functionality without understanding:

- cache behavior
- offline behavior
- queued operations
- authentication/session behavior
- deployment behavior

---

# 17. MAP / GEOLOCATION

The application contains map/GPS functionality.

Relevant technologies/files include:

- Leaflet
- map components
- GeoJSON data
- map/tile API functionality
- location/trip related data

Relevant concepts include:

- Iran provinces
- facilities
- map explorer
- trips
- trip points
- live location

Do not replace the mapping system simply because another library may appear easier.

---

# 18. MOBILE APPLICATION

The repository contains a mobile application layer.

Important area:

mobile/

There are mobile authentication concepts including phone login and OTP/nonce-related functionality.

Do not remove or restructure mobile code without checking mobile API dependencies.

---

# 19. MESSAGING

The project contains messaging functionality.

Relevant concepts include:

- messengers
- messenger settings
- message logs
- notifications
- record sending

There is also Telegram/messaging-related functionality.

IMPORTANT:

Never expose, hard-code, or regenerate real production tokens or API secrets.

---

# 20. BACKUP / RESTORE

The project contains backup and restore functionality.

Backup/restore interacts with multiple application entities.

Because the database contains many interconnected entities, backup/restore must be treated as a critical subsystem.

Do not change entity names or schema relationships without checking backup/restore compatibility.

---

# 21. DEPLOYMENT

Production deployment uses Render.

The repository contains:

render.yaml

and deployment-related scripts/workflows.

Do not modify deployment configuration unless the requested task explicitly concerns deployment.

Before changing deployment:

1. Inspect build command.
2. Inspect start command.
3. Inspect environment variables.
4. Inspect health checks.
5. Inspect sync behavior.
6. Inspect current production behavior.

---

# 22. IMPORTANT ARCHITECTURAL CONTRADICTION

There is an apparent distinction between:

package.json:
    start -> node server.js

and:

scripts/start.mjs:
    Next.js start logic

and Render configuration:

    build -> npm run build
    start -> npm run start

This must NOT automatically be classified as a bug.

It is a historical/architectural fact that requires verification.

Do not "fix" this without tracing the production execution path first.

---

# 23. SOURCE OF TRUTH RULE

When sources disagree, use this priority:

1. Actual production behavior
2. Current source code used by production
3. Database/schema and migrations
4. API consumers and dependencies
5. Deployment configuration
6. Documentation
7. Historical comments

Do not blindly trust README files.

Do not blindly trust old documentation.

Do not blindly trust assumptions about which files are active.

Verify before modifying.

---

# 24. CODE CHANGE RULE

The project already contains working functionality.

The default strategy is:

SMALLEST SAFE CHANGE.

Do NOT:

- rewrite working modules
- refactor unrelated code
- replace architecture
- rename files unnecessarily
- delete old-looking files
- replace APIs unnecessarily
- replace libraries unnecessarily
- redesign database structures unnecessarily

Every change must be directly connected to the requested task.

---

# 25. DEPENDENCY RULE

Before changing any important file:

1. Read the file.
2. Search for its imports/usages.
3. Determine whether it is loaded dynamically.
4. Determine whether production uses it.
5. Determine whether another subsystem depends on it.
6. Check whether backup/sync/mobile/PWA depend on it.

Only then modify it.

---

# 26. DO NOT DELETE

Do not delete any of the following without explicit approval:

- server.js
- public/index.html
- crm-app.js
- crm-data.js
- crm-features-v9.js
- crm-features-v10.js
- crm-features-v11.js
- crm-features-v12.js
- crm-features-v13.js
- crm-features-v14.js
- crm-features-v15.js
- crm-features-v16.js
- crm-features-v17.js
- crm-features-v18.js
- src/db/*
- src/app/api/*
- mobile/*
- sync-related code
- service-worker code
- backup/restore code

---

# 27. SECURITY RULE

Never place real secrets in source code.

Potential sensitive values include:

- database URLs
- passwords
- API keys
- Telegram tokens
- sync secrets
- mobile secrets
- authentication secrets
- deployment credentials

If an existing repository contains a value that appears to be a real secret:

DO NOT publish it elsewhere.

DO NOT copy it into documentation.

Recommend rotation/revocation when appropriate.

---

# 28. CHANGE VERIFICATION

After modifying code:

1. Inspect git diff.
2. Verify only intended files changed.
3. Run relevant tests.
4. Run build/lint/type checks where applicable.
5. Verify API compatibility.
6. Verify database compatibility.
7. Verify sync compatibility if relevant.
8. Verify production UI path if relevant.

Never claim success without verification.

---

# 29. GIT SAFETY

Do not:

- reset the repository
- force push
- rewrite history
- delete branches
- revert unrelated commits
- overwrite production code

unless explicitly requested.

Before significant changes, inspect:

git status
git diff
git log

Prefer a separate branch for changes.

---

# 30. HISTORICAL CONTEXT

This project has evolved through multiple versions and multiple architectural layers.

Some implementation decisions were made during previous AI-assisted development sessions.

The complete historical reasoning from those conversations is not yet fully recovered.

Therefore:

UNKNOWN:
    Historical reasons behind some architectural decisions.

UNKNOWN:
    Why certain duplicate/parallel mechanisms were retained.

UNKNOWN:
    Which previous approaches were tried and rejected.

These items must NOT be invented.

They will be added to this document after the historical conversation is recovered or reconstructed.

---

# 31. CURRENT AUDIT STATUS

CONFIRMED FROM SOURCE:

- Hybrid architecture exists.
- server.js exists and is the current package start target.
- public/index.html is a critical active UI entry.
- crm-features-v9 through v18 are loaded.
- Next.js App Router exists.
- Next.js API routes exist.
- PostgreSQL/Drizzle exists.
- Mobile layer exists.
- PWA/offline layer exists.
- Sync layer exists.
- Map/GPS layer exists.
- Backup/restore exists.
- Messaging exists.

REQUIRES FURTHER VERIFICATION:

- Exact production runtime path on Render.
- Exact relationship between server.js APIs and Next.js APIs.
- Exact migration path from legacy state to PostgreSQL.
- Complete permission matrix.
- Complete synchronization conflict strategy.
- Historical reasons for architecture decisions.
- Which modules are still actively used by all production workflows.

---

# 32. CURRENT DEVELOPMENT RULE

The next AI agent must NOT start coding immediately.

First perform a READ-ONLY audit.

The agent must report:

1. Current runtime path
2. Current UI path
3. Backend/API path
4. Database path
5. Authentication path
6. Authorization path
7. Sync path
8. PWA/offline path
9. Mobile path
10. Map/GPS path
11. Backup/restore path
12. Messaging path
13. Relevant files for the requested task
14. Potential side effects
15. Any uncertainty

Then WAIT for approval before making changes.

---

---

# CURRENT DELIVERY STATE (2026-08-16)

App version 11.16.2 (user-verification fix pack on v20: grid combo cards,
uniform grey engine + combo lock, always-active order product section,
field-order mirror pharmacy→orders, header-docked change-password button,
duplicate false-positive fix with autosave signature suppression).
GitHub remote was found replaced by a single manual commit "پروژه اولیه"
(11.15.3); one-time repair script PUSH_FRESH_GITHUB.bat delivered
(unrelated-histories merge, his files win). GitLab token page disabled on
his account → token-free SSH method documented (RAHNAMA_GITLAB.txt);
SYNC_ALL skips gitlab gracefully. New last layer remains
crm-features-v20.js; knowledge graph PROJECT_GRAPH.md is read-first
(rule #66). Permanent rules: #62-#68.

# END OF AI PROJECT CONTEXT
## افزونه وضعیت نسخه ۱۱.۱۷.۰ (2026-08-17)
آخرین نسخه فعال 11.17.0 است. لایه نهایی v20 اکنون تثبیت جای فیلد، جایگذاری محلی سفارش، مدیریت وابسته نام‌ها، قفل محتوای پیام‌رسان، GPS/رصد تردد کامل، نسخه هدر و آدرس دقیق را پوشش می‌دهد. CI گیت‌هاب با معماری Node صفر-وابستگی هماهنگ شد.

## افزونه وضعیت نسخه ۱۱.۱۷.۱ (2026-08-17)
نسخه فعال 11.17.1 است. quantityValidated مرز داده سفارش جدید است؛ اقلام qty<=0 ذخیره نمی‌شوند. اشتراک پویا از ستون‌های فعلی ساخته می‌شود. مدیر نام‌های بزرگ فقط با جستجو کار می‌کند. v20 مالک نهایی نمایش افزودن‌ها، پاکسازی سفارش، نسخه فقط مدیر و اعمال تنظیمات کالا است.

## افزونه وضعیت نسخه ۱۱.۱۸.۰ (2026-08-17)
نسخه فعال 11.18.0 است. تب tab-snapp-corporate فقط مدیر/دسترسی صریح، بدون credential، گزارش‌ها را از CSV/XLSX وارد و در state.snappCorporate نگه می‌دارد. CAPTCHA هرگز خودکار حل نمی‌شود. موقعیت زنده اکنون حالت همه نمایندگان و textAddress کش‌شده دارد.

## افزونه وضعیت نسخه ۱۱.۱۹.۰ (2026-08-17)
نسخه فعال 11.19.0 است. اسنپ دو آرشیو rows/topups دارد که فقط prepend+dedupe می‌شوند و حذف UI ندارند؛ backup کل state را می‌گیرد. پیام‌رسان همه unified fields را با v20ShareOrder مرتب می‌کند. تارگت مالی از قیمت‌های product مشتق می‌شود.

## افزونه وضعیت نسخه ۱۱.۲۰.۰ (2026-08-17)
نسخه فعال 11.20.0 است. schema سفر و شارژ اسنپ صریح است؛ نمایندگان از users غیرمدیر می‌آیند. email backup endpoint به Resend متصل است ولی بدون env عمداً 503 می‌دهد. جزئیات سفارش و share متن یک منبع دارند.
