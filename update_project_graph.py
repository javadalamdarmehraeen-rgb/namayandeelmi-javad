#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================
#  سازنده «گراف دانش پروژه» — PROJECT_GRAPH.md
#  دستور کاربر (نوبت ۱۳): به‌جای خواندن کل فایل‌ها در هر نوبت، فقط این
#  فایل خوانده شود؛ پس باید هر بار خودکار بازسازی شود.
#  اجرا:  python update_project_graph.py
# ============================================================
import os
import re
import json

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "PROJECT_GRAPH.md")

RE_FUNC = re.compile(r"^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(", re.M)
RE_CONST_FN = re.compile(r"^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()", re.M)
RE_WINDOW = re.compile(r"window\.([A-Za-z_$][\w$]*)\s*=", re.M)
RE_DOMID = re.compile(r"(?:getElementById|\$)\(\s*[\"'`]([A-Za-z][\w-]*)[\"'`]\s*\)")
RE_STORAGE = re.compile(r"(localStorage|sessionStorage)\.(?:get|set|remove)Item\(\s*[\"'`]([^\"'`]+)[\"'`]")
RE_FETCH = re.compile(r"fetch\(\s*[\"'`]([^\"'`]+)[\"'`]")
RE_API = re.compile(r"pathname\s*===\s*[\"'](/api/[^\"'`]+)[\"'`]\s*&&\s*req\.method\s*===\s*[\"'`]([A-Z]+)[\"'`]")

JS_FILES = []


def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, "/")


def list_targets():
    files = [os.path.join(ROOT, "server.js")]
    for base in ("scripts", "public"):
        d = os.path.join(ROOT, base)
        if not os.path.isdir(d):
            continue
        for dp, _, names in os.walk(d):
            for n in sorted(names):
                if n.endswith((".js", ".mjs")):
                    files.append(os.path.join(dp, n))
    return [f for f in files if os.path.isfile(f)]


def script_order():
    """ترتیب لود اسکریپت‌ها از index.html"""
    idx = os.path.join(ROOT, "public", "index.html")
    order = []
    if os.path.isfile(idx):
        html = open(idx, encoding="utf-8").read()
        for m in re.finditer(r'<script[^>]+src="([^"?]+)[^"]*"[^>]*>', html):
            order.append(m.group(1))
    return order


def tab_map():
    """نقشه تب‌ها: id → عنوان فارسی (از دکمه‌های ناوبری)"""
    idx = os.path.join(ROOT, "public", "index.html")
    out = {}
    if os.path.isfile(idx):
        html = open(idx, encoding="utf-8").read()
        for m in re.finditer(r'data-target="(tab-[\w-]+)"[^>]*>\s*<span>([^<]+)</span>', html):
            out.setdefault(m.group(1), m.group(2).strip())
    return out


def parse_js(path):
    txt = open(path, encoding="utf-8", errors="replace").read()
    first_comment = ""
    for line in txt.splitlines()[:6]:
        line = line.strip().lstrip("/ ").strip()
        if line:
            first_comment = line[:120]
            break
    return {
        "path": rel(path),
        "size": os.path.getsize(path),
        "role": first_comment,
        "funcs": sorted(set(RE_FUNC.findall(txt) + RE_CONST_FN.findall(txt))),
        "window_assigns": sorted(set(RE_WINDOW.findall(txt))),
        "dom_ids": sorted(set(RE_DOMID.findall(txt))),
        "storage": sorted(set((a, b) for a, b in RE_STORAGE.findall(txt))),
        "fetches": sorted(set(RE_FETCH.findall(txt))),
        "apis": sorted(set(RE_API.findall(txt))),
    }


def build():
    order = script_order()
    order_rank = {src: i for i, src in enumerate(order)}
    tabs = tab_map()
    infos = [parse_js(p) for p in list_targets()]

    # گراف بازنویسی window: مرتب بر اساس ترتیب لود
    win_owner = {}
    for inf in sorted(infos, key=lambda x: order_rank.get(x["path"].replace("public/", ""), 999)):
        for name in inf["window_assigns"]:
            win_owner.setdefault(name, []).append(inf["path"])

    # گراف API: endpoint → (متد، سرور، مصرف‌کننده‌های کلاینت)
    api_edges = {}
    for inf in infos:
        for ep, method in inf["apis"]:
            api_edges.setdefault(ep, {"server": method, "clients": set()})
    for inf in infos:
        for f in inf["fetches"]:
            if f.startswith("/api/"):
                api_edges.setdefault(f, {"server": "؟", "clients": set()})
                api_edges[f]["clients"].add(inf["path"])

    # گراف ذخیره‌سازی
    store_edges = {}
    for inf in infos:
        for area, key in inf["storage"]:
            store_edges.setdefault(key, {}).setdefault(area, set()).add(inf["path"])

    # گراف تب‌ها: هر تب → فایل‌هایی که به idهایش دست می‌زنند
    tab_of_id = {}
    idx_html = open(os.path.join(ROOT, "public", "index.html"), encoding="utf-8").read()
    for m in re.finditer(r'<section id="(tab-[\w-]+)"([\s\S]*?)(?=<section id="tab-|$)', idx_html):
        pane, body = m.group(1), m.group(2)
        for im in re.finditer(r'id="([\w-]+)"', body):
            tab_of_id[im.group(1)] = pane
    tab_files = {}
    for inf in infos:
        for did in inf["dom_ids"]:
            pane = tab_of_id.get(did)
            if pane:
                tab_files.setdefault(pane, {}).setdefault(inf["path"], set()).add(did)

    # توابع تکراری در چند فایل (احتمال بازنویسی لایه‌ای)
    fn_files = {}
    for inf in infos:
        for fn in inf["funcs"]:
            fn_files.setdefault(fn, []).append(inf["path"])
    dup_fns = {k: v for k, v in fn_files.items() if len(v) > 1 and not k.startswith("_")}

    L = []
    L.append("# 🕸️ گراف دانش پروژه «نماینده علمی» (PROJECT_GRAPH.md)")
    L.append("")
    L.append("> این فایل **خودکار** ساخته می‌شود — با دستور `python update_project_graph.py`")
    L.append("> و در پایان هر تحویل، قبل از بازسازی chat.arena، تازه می‌شود (قانون ۶۶ AI_RULES).")
    L.append("> **قانون برای هوش مصنوعی: به‌جای خواندن کل سورس، اول این فایل را بخوان؛**")
    L.append("> جزئیات متن کامل فایل‌ها در بخش ۹ chat.arena است.")
    L.append("")
    L.append("## الف) زنجیره لود اسکریپت‌ها (ترتیب اجرا در مرورگر)")
    L.append("")
    for i, src in enumerate(order):
        L.append("{}. `{}`".format(i + 1, src))
    L.append("")
    L.append("## ب) کارت فایل‌ها (نقش + توابع + نام‌های window که می‌سازد)")
    L.append("")
    for inf in infos:
        L.append("### `{}` ({} بایت)".format(inf["path"], inf["size"]))
        if inf["role"]:
            L.append("- نقش: {}".format(inf["role"]))
        L.append("- تعداد توابع داخلی: {}".format(len(inf["funcs"])))
        if inf["window_assigns"]:
            L.append("- نام‌های window که تعریف/بازنویسی می‌کند: `{}`".format("`, `".join(inf["window_assigns"][:40])))
        if inf["apis"]:
            L.append("- endpointهای سرور: `{}`".format("`, `".join(a for a, _ in inf["apis"])))
        L.append("")
    L.append("## ج) گراف بازنویسی نام‌های window (چه فایلی روی چه فایلی سوار می‌شود)")
    L.append("")
    any_ov = False
    for name, files in sorted(win_owner.items()):
        if len(files) > 1:
            any_ov = True
            L.append("- `{}`: تعریف/بازنویسی به ترتیب لود → {}".format(name, " ← ".join("`" + f + "`" for f in files)))
    if not any_ov:
        L.append("- موردی یافت نشد.")
    L.append("")
    L.append("## د) گراف API (سرویس api ↔ مصرف‌کننده‌ها)")
    L.append("")
    if api_edges:
        for ep, ed in sorted(api_edges.items()):
            cl = ", ".join("`" + c + "`" for c in sorted(ed["clients"])) or "—"
            L.append("- `{}` [{}] — مصرف‌کننده: {}".format(ep, ed["server"], cl))
    else:
        L.append("- موردی یافت نشد.")
    L.append("")
    L.append("## هـ) گراف حافظه مرورگر (کلید ↔ فایل‌های دست‌زننده)")
    L.append("")
    for key, areas in sorted(store_edges.items()):
        parts = []
        for area, files in sorted(areas.items()):
            parts.append(area + ": " + ", ".join("`" + f + "`" for f in sorted(files)))
        L.append("- `{}` ← {}".format(key, " | ".join(parts)))
    L.append("")
    L.append("## و) گراف تب‌ها (تب ↔ فایل‌هایی که با المان‌هایش کار می‌کنند)")
    L.append("")
    for pane, files in sorted(tab_files.items()):
        title = tabs.get(pane, "")
        L.append("### {} «{}»".format(pane, title))
        for f, ids in sorted(files.items()):
            L.append("- `{}` → {} شناسه (مثل: `{}`)".format(f, len(ids), "`, `".join(sorted(ids)[:8])))
        L.append("")
    L.append("## ز) نام‌های تابع تکراری در چند فایل (نقاط حساس بازنویسی)")
    L.append("")
    if dup_fns:
        for fn, files in sorted(dup_fns.items()):
            L.append("- `{}` ← {}".format(fn, ", ".join("`" + f + "`" for f in files)))
    else:
        L.append("- موردی یافت نشد.")
    L.append("")
    L.append("## ح) هشدارهای دائمی معماری")
    L.append("")
    L.append("- `public/crm-app.js` دو نسل کد فرم دارد؛ هر تغییر رفتاری فرم باید در هر دو نسل + مسیر فعال v9 جفت شود.")
    L.append("- آخرین لایه (crm-features-v20.js) برنده نهایی بازنویسی‌هاست؛ اسکریپت‌های بعد از آن نباید بیایند مگر با افزودن به انتهای زنجیره.")
    L.append("- اسکلت Next.js در `src/` خفته است؛ ورودی اصلی `server.js` + `public/` است.")
    L.append("")
    open(OUT, "w", encoding="utf-8").write("\n".join(L))
    print("PROJECT_GRAPH.md written: {} bytes, {} files analyzed, {} window names, {} tabs".format(
        os.path.getsize(OUT), len(infos), len(win_owner), len(tab_files)))


if __name__ == "__main__":
    build()
