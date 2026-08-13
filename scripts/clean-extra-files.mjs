#!/usr/bin/env node
/**
 * Deletes leftover files that are NOT part of the official tree.
 * Does not touch .git, .env, node_modules, editor folders, or user backups.
 *
 * Usage:
 *   node scripts/clean-extra-files.mjs --root /path/to/project
 *   node scripts/clean-extra-files.mjs --root /path --apply
 *   node scripts/clean-extra-files.mjs --write-list
 *   node scripts/clean-extra-files.mjs --root TARGET --sync-from SOURCE --apply
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const PROTECTED_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".next",
  ".cache",
  ".vscode",
  ".idea",
  ".arena",
]);

const PROTECTED_FILE_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.ndcohub",
  ".env.production",
  ".env.development",
]);

const PROTECTED_PREFIXES = [
  "crm-backup",
];

const KNOWN_EXTRAS = [
  "__rzi_4828.46476.rartemp",
  "CHANGELOG_ENHANCEMENTS.md",
  "public/crm-enhancements.js",
  "public/data/iran-provinces.geojson",
  "public/icon.svg",
  "public/logo.svg",
  "public/src-svg/brand-1280x720.svg",
  "public/src-svg/desktop-1280x720.svg",
  "public/src-svg/mobile-720x1280.svg",
  "src/app/api/messengers/test/route.ts",
  "app.js",
  "data.js",
  "index.html",
  "style.css",
  "sw.js",
  "manifest.json",
  "crm-app-all-in-one.html",
  "crm-app-complete.zip",
  "README_FA_NEXTJS.md",
  "add_calendar_logic.py",
  "add_missing_funcs.py",
  "add_modals_and_search.py",
  "add_products_tab.py",
  "add_save_handlers.py",
  "apply_html_v9.py",
  "check_all_js.py",
  "expand_cities.py",
  "fix_syntax.py",
  "fix_tabs_and_cards.py",
  "public/app.js",
  "public/data.js",
  "public/crm-features.js",
  "public/crm-features-v1.js",
  "public/crm-features-v2.js",
  "public/crm-features-v3.js",
  "public/crm-features-v4.js",
  "public/crm-features-v5.js",
  "public/crm-features-v6.js",
  "public/crm-features-v7.js",
  "public/crm-features-v8.js",
];

function parseArgs(argv) {
  const out = { root: REPO_ROOT, apply: false, writeList: false, syncFrom: "" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") out.apply = true;
    else if (a === "--write-list") out.writeList = true;
    else if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--sync-from") out.syncFrom = path.resolve(argv[++i] || "");
  }
  return out;
}

function norm(p) {
  return p.split(path.sep).join("/");
}

function isProtectedRel(rel) {
  const n = norm(rel);
  if (!n || n === ".") return true;
  const parts = n.split("/");
  if (parts.some((p) => PROTECTED_DIR_NAMES.has(p))) return true;
  if (PROTECTED_FILE_NAMES.has(parts[parts.length - 1])) return true;
  const base = parts[parts.length - 1];
  if (base.startsWith(".env") && !base.endsWith(".example")) return true;
  if (PROTECTED_PREFIXES.some((pre) => base.startsWith(pre))) return true;
  return false;
}

function walkFiles(root) {
  const out = [];
  function rec(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const abs = path.join(dir, ent.name);
      const rel = norm(path.relative(root, abs));
      if (isProtectedRel(rel)) continue;
      if (ent.isDirectory()) rec(abs);
      else if (ent.isFile() || ent.isSymbolicLink()) out.push(rel);
    }
  }
  rec(root);
  return out.sort();
}

function walkDirs(root) {
  const out = [];
  function rec(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const abs = path.join(dir, ent.name);
      const rel = norm(path.relative(root, abs));
      if (isProtectedRel(rel)) continue;
      rec(abs);
      out.push(rel);
    }
  }
  rec(root);
  return out.sort((a, b) => b.length - a.length);
}

function writeOfficialList(root) {
  const files = walkFiles(root).filter((f) => f !== "OFFICIAL_FILELIST.txt");
  const dest = path.join(root, "OFFICIAL_FILELIST.txt");
  fs.writeFileSync(dest, files.join("\n") + "\n", "utf8");
  return { dest, count: files.length };
}

function readOfficialList(fromRoot) {
  const p = path.join(fromRoot, "OFFICIAL_FILELIST.txt");
  if (!fs.existsSync(p)) {
    throw new Error("OFFICIAL_FILELIST.txt پیدا نشد: " + p);
  }
  return new Set(
    fs.readFileSync(p, "utf8")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(norm)
  );
}

function shouldDelete(rel, official) {
  const n = norm(rel);
  if (n === "OFFICIAL_FILELIST.txt") return false;
  if (isProtectedRel(n)) return false;
  if (KNOWN_EXTRAS.includes(n)) return true;
  if (n.endsWith(".rartemp") || n.includes("__rzi_")) return true;
  if (!official.has(n)) return true;
  return false;
}

function rmEmptyDirs(root) {
  const removed = [];
  for (const rel of walkDirs(root)) {
    const abs = path.join(root, rel);
    try {
      const left = fs.readdirSync(abs);
      if (left.length === 0) {
        fs.rmdirSync(abs);
        removed.push(rel);
      }
    } catch {
      /* ignore */
    }
  }
  return removed;
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.writeList) {
    const r = writeOfficialList(REPO_ROOT);
    console.log("wrote", r.dest, "files=", r.count);
    return;
  }

  if (!fs.existsSync(args.root)) {
    console.error("مسیر وجود ندارد:", args.root);
    process.exit(1);
  }

  const listRoot = args.syncFrom || REPO_ROOT;
  let official;
  try {
    official = readOfficialList(listRoot);
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }

  const existing = walkFiles(args.root);
  const toDelete = existing.filter((rel) => shouldDelete(rel, official));

  console.log("root:", args.root);
  console.log("official files:", official.size);
  console.log("present files:", existing.length);
  console.log("extra files:", toDelete.length);
  for (const rel of toDelete) console.log("  DEL", rel);

  if (args.syncFrom) {
    const srcFiles = walkFiles(args.syncFrom).filter((f) => official.has(f) || f === "OFFICIAL_FILELIST.txt");
    console.log("copy from:", args.syncFrom, "count=", srcFiles.length);
    if (args.apply) {
      for (const rel of srcFiles) {
        copyFile(path.join(args.syncFrom, rel), path.join(args.root, rel));
      }
      copyFile(path.join(args.syncFrom, "OFFICIAL_FILELIST.txt"), path.join(args.root, "OFFICIAL_FILELIST.txt"));
    }
  }

  if (!args.apply) {
    console.log("\ndry-run. برای حذف واقعی: --apply");
    return;
  }

  for (const rel of toDelete) {
    const abs = path.join(args.root, rel);
    try {
      fs.unlinkSync(abs);
    } catch (e) {
      console.warn("نتوانست حذف شود:", rel, e.message);
    }
  }
  const dirs = rmEmptyDirs(args.root);
  for (const d of dirs) console.log("  RMDIR", d);
  console.log("done. deleted files=", toDelete.length, "empty dirs=", dirs.length);
}

main();
