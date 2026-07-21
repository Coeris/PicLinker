# PicLinker 开发指南

> 🧭 **文档导航：** [中文说明](README.zh.md) · [English](README.md) · [配置指南](CONFIG.md) · **开发指南**

## 项目结构

```
src/
  main.ts                    — 插件入口（生命周期、模块协调）
  types.ts                   — 核心类型定义
  icons.ts                   — SVG 图标与图床识别

  editor/
    LinkEditor.ts            — Markdown 链接编辑（替换/移除/全库更新）

  sync/
    WebDAVSync.ts            — WebDAV 同步（上传/下载/冲突检测）

  imagebed/
    ImageBedManager.ts       — 图床注册表
    GitHubImageBed.ts        — GitHub API 实现
    AliyunOssImageBed.ts     — 阿里云 OSS（V4 签名）
    TencentCosImageBed.ts    — 腾讯云 COS（V1 签名）
    SmmsImageBed.ts          — SM.MS API 实现

  comparator/
    CloudComparator.ts       — 本地-云端比对（HEAD 请求 + 文件名匹配）

  parser/
    LinkParser.ts            — 图片链接解析（Markdown/Wiki/HTML，跳过代码块）

  scanner/
    VaultScanner.ts          — 全库扫描（mtime 增量缓存 + 版本号控制）

  settings/
    SettingTab.ts            — 设置面板（折叠式布局）

  view/
    PicLinkerView.ts         — 主视图（八区布局 + 批量操作）
    SelectionManager.ts      — 12 区域统一选中状态管理
    DedupService.ts          — 去重/同名文件 localStorage 持久化
    ImagePreview.ts          — 图片预览 Modal（滚轮缩放）
    components/
      ActionsRenderer.ts     — 八区按钮渲染与显隐联动
      ItemRenderer.ts        — 条目/缩略图/标签渲染
      TreeRenderer.ts        — 目录树与折叠逻辑
    operations/
      BatchOperations.ts     — 批量复制/下载
      DeleteOperations.ts    — 批量删除（9 个 delete wrapper）
    utils/
      ViewUtils.ts           — 格式化/路径/计数/tagKey 解析

  utils/
    Common.ts                — 共享工具函数
    http.ts                  — 统一 HTTP 请求（桌面 Node.js 层 / 移动端 requestUrl 双层绕过 CORS）
    OssV4Signer.ts           — 阿里云 V4 签名
    CosV1Signer.ts           — 腾讯云 V1 签名
    HashCache.ts             — 上传哈希缓存
    DedupCache.ts            — 去重哈希缓存
    FrontmatterParser.ts     — YAML Frontmatter 解析
    SecureStorage.ts         — AES-GCM 加密存储（v1/v2 密钥迁移）
```

## 开发环境

### 前置依赖

- [Node.js](https://nodejs.org/)（>= 18.x）
- npm（随 Node.js 自带）

### 快速开始

```bash
# 安装依赖
npm install

# 开发模式：监听文件变化自动重编译
npm run dev

# 生产构建
npm run build
```

### 构建说明

构建使用 [esbuild](https://esbuild.github.io/)，配置见 `esbuild.config.mjs`。

- 输出文件：`main.js`
- 支持 TypeScript + Obsidian API 类型

### 发布

1. 确认 `manifest.json` 中的版本号
2. 更新 `versions.json`（如有 minAppVersion 变更）
3. 运行 `npm run build` 生成 `main.js`
4. 提交代码并打 tag
5. 创建 GitHub Release，附上 `main.js`、`manifest.json`、`styles.css`

### 技术栈

- **语言**：TypeScript（约 35 个模块）
- **构建**：esbuild（产物约 360KB）
- **运行时**：Obsidian API（Plugin / ItemView / Notice / requestUrl）
- **加密**：Web Crypto API（AES-GCM / PBKDF2 / SHA-256）
- **网络**：Node.js HTTP/HTTPS（桌面端）+ requestUrl（移动端回退）
- **存储**：localStorage + WebDAV

## 常见问题

### main.js 需要编译吗？

是的。插件核心代码在 `src/` 目录中，开发时运行 `npm run dev` 或 `npm run build` 编译出 `main.js` 才能运行。

### 添加新图床的步骤

1. 在 `src/types.ts` 的 `ImageBedType` 枚举中新增图床类型（如尚无该枚举，可复用 `string` 字面量联合类型并在调用处收敛）
2. 在 `src/types.ts` 中定义并实现 `ImageBed` 接口（含 `listFiles` / `delete` / `testConnection` 等方法）
3. 在 `src/imagebed/` 下创建新的图床文件
4. 在 `src/imagebed/ImageBedManager.ts` 中注册
5. 在 `src/settings/SettingTab.ts` 中添加配置项
6. 在 `CONFIG.md` 中添加配置说明

### 自定义样式

样式文件为 `styles.css`。插件自建了一套 `--pic-*` CSS 变量层（背景三档、文字、边框、状态色等），所有组件统一引用该层而非直接依赖 Obsidian 原生变量，并通过 `currentColor` / `var(--pic-*)` 让图标、工具栏、设置页原生控件（开关、输入框、按钮）跟随 Obsidian 浅色 / 深色主题自动切换。

已包含移动端适配（768px 断点、触屏 `hover:none + pointer:coarse` 适配）。
