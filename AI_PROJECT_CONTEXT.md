/*
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

# END OF AI PROJECT CONTEXT