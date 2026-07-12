# PicLinker — Obsidian 图片资产管理插件

> 🧭 **文档导航：** 中文说明 · **English** · 配置指南 · 开发指南

PicLinker is an Obsidian plugin for managing all your image assets across the vault — covering scanning, deduplication, comparison, and batch operations.
## Features

- **Full-vault scan** — Recognizes `![]()`, `![[path]]`, and `<img>` references (code blocks skipped); incremental caching for fast startup and live updates on vault changes.
- **Eight-zone view** — Images are auto-grouped by status: local referenced / cloud referenced / local unreferenced / cloud unreferenced / broken links / same-name files / duplicates (SHA-256) / empty folders; each zone folds and filters independently.
- **Four image beds** — Aliyun OSS (V4 signing), Tencent COS (V1 signing), GitHub, and SM.MS, cross-checked against actual references.
- **Smart dedup** — SHA-256 content hashing across local×local, cloud×cloud, and local×cloud. Cloud-first retention keeps the cloud copy and rewrites note links, with zero broken links.
- **Batch operations** — Batch delete (to system trash, recoverable), delete cloud files, remove reference lines, copy Markdown/HTML links, download; a confirmation dialog lists affected notes before any deletion.
- **Security** — AES-GCM + PBKDF2 encrypted credentials with auto-migration (v1→v2); `directFetch` uses the Node.js request layer on desktop and falls back to `requestUrl` on mobile, bypassing CORS.
- **WebDAV sync** — Share image-bed config across devices with three-way conflict detection (local / remote mtime + last sync time); supports Nutstore and NextCloud.

## Install

**Community plugin store (recommended)**

Open Obsidian → **Settings → Community plugins → Browse**, search for **PicLinker**, then install and enable it.

**Manual install**

Download `main.js`, `manifest.json`, and `styles.css` from [Releases](https://github.com/Coeris/PicLinker/releases), place them in your vault's `.obsidian/plugins/PicLinker/` folder, and enable the plugin.
