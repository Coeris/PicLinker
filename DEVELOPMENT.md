# PicLinker 开发指南

> 🧭 **文档导航：** [中文说明](README.zh.md) · [English](README.md) · [配置指南](CONFIG.md) · **开发指南** · [变更日志](CHANGELOG.md) · [安全](SECURITY.md) · [贡献](CONTRIBUTING.md)

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
      DeleteOperations.ts    — 批量删除（8 个 delete wrapper）
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
    AsyncHandler.ts          — 异步任务串行/防重入封装
    DangerConfirmModal.ts    — 删除确认弹窗（显示数量，单次确认）
    nodeCrypto.ts            — Node.js crypto 适配层（桌面端哈希/签名）
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
- **构建**：esbuild（产物约 400KB+）
- **运行时**：Obsidian API（Plugin / ItemView / Notice / requestUrl）
- **加密**：Web Crypto API（AES-GCM / PBKDF2 / SHA-256）
- **网络**：Node.js HTTP/HTTPS（桌面端）+ requestUrl（移动端回退）
- **存储**：localStorage + WebDAV

## 常见问题

### main.js 需要编译吗？

是的。插件核心代码在 `src/` 目录中，开发时运行 `npm run dev` 或 `npm run build` 编译出 `main.js` 才能运行。

### 添加新图床的步骤

1. 在 `src/types.ts` 的 `ImageBedType` 枚举中新增图床类型（枚举已存在，直接追加）
2. 在 `src/types.ts` 中实现已有的 `ImageBed` 接口（含 `listFiles` / `delete` / `testConnection` 等方法）
3. 在 `src/imagebed/` 下创建新的图床文件
4. 在 `src/imagebed/ImageBedManager.ts` 中注册
5. 在 `src/settings/SettingTab.ts` 中添加配置项
6. 在 `CONFIG.md` 中添加配置说明

### 为什么 minAppVersion 是 1.8.7 而不是更高？

1.3.0 曾误接入 Obsidian 1.13.0 声明式设置 API，导致设置页图床卡片消失，已回退。插件功能不依赖 1.13.0 特性，故 minAppVersion 维持 1.8.7。

### 自定义样式

样式文件为 `styles.css`。插件自建了一套 `--pic-*` CSS 变量层（背景三档、文字、边框、状态色等），所有组件统一引用该层而非直接依赖 Obsidian 原生变量，并通过 `currentColor` / `var(--pic-*)` 让图标、工具栏、设置页原生控件（开关、输入框、按钮）跟随 Obsidian 浅色 / 深色主题自动切换。

已包含移动端适配（768px 工具栏/操作区断点、600px 设置页断点、触屏 `hover:none + pointer:coarse` 适配）。

### 触控手势（ImagePreview）

图片预览支持触屏操作，统一封装在 `src/view/ImagePreview.ts`：

- **单击 overlay**：关闭预览（鼠标 click 与触屏 click 共用同一入口，拖拽后浏览器不派发 click，不会误关）
- **单指拖拽**：图片平移（`touchstart` 起始 → `touchmove` 跟踪 → `touchend` 重置起始状态）
- **双指 pinch**：以初始距离为基线动态计算缩放比例
- **快速双击**：300ms 内两次 tap 且坐标偏离 < 20px，重置缩放与位移
- **CSS 层**：`touch-action: none` 已在 `.pic-preview-img` 声明，禁止浏览器原生 pinch 缩放整个页面，让 JS 接管手势

注意：触屏设备上条目 `dblclick` 复制文件名/路径仍受浏览器 300ms 延迟影响，暂未模拟——后续可考虑封装 long-press 触发复制。

## 复选框与选中系统

八区（本地图片 / 云端图片 / 本地未引用 / 云端未引用 / 未找到图片 / 同名文件 / 重复图片 / 空白文件夹）的选中状态由 `SelectionManager` 统一管理，共 12 个 section（8 个图片/文件夹区 + 4 个标签区：LocalTags / CloudTags / SameNameTags / DedupTags）。

- **`createGroupCheckbox(opts)`**（位于 `src/view/components/ItemRenderer.ts`）：统一的「分组级复选框」helper，组头一键全选/取消，三态（☐ 全未选 / ▣ 部分选 / ☑ 全选）。内部通过 `selection.onChange` 反向同步子项 checkbox，点击时 `stopPropagation` 避免触发折叠。
- **`TreeRenderer.renderTreeNodeGeneric`** 新增 `overrideSection` 参数：目录树渲染时需显式传入正确的 section（如云端区传 `CloudImages`/`CloudFiles`、本地未引用传 `LocalUnref`），否则会误用 context 默认 section 导致选中集合串区。
- **嵌套目录勾选**：父目录 checkbox 勾选时递归选中整棵子树（叶子级 + 子目录分组级），折叠态目录懒渲染需先 `forceRender` 确保 DOM 存在再同步。
- **未找到图片区** 在 1.3.0 重构为按引用笔记分组：`renderNotFoundGroup`（组头）+ `renderNotFoundRefItem`（单行引用），选中集合独立为 `SelectionSection.NotFoundRefs`（从旧 `NotFound` 拆分）。

## 链接替换与格式转换

在去重合并 / 重命名等流程中，`LinkEditor` 负责把笔记中的旧图片引用替换为新路径。覆盖三种 Obsidian 原生格式：

- **Markdown `![alt](path)`**：直接替换路径部分，保留 alt/title。
- **Wikilink `![[path]]` / `![[path|alias]]`**：本地路径保留 wikilink 格式；**新路径是远程 URL 时自动转为 Markdown `![alias](url)`**，因为 Obsidian 的 wikilink 解析器无法识别 `http(s)://`。
- **HTML `<img src="...">`**：替换 `src` 属性。

⚠️ Frontmatter 裸路径（如 `cover: img.png`）在去重合并（`replaceImageInMdFiles`）流程中不参与替换；但重命名流程（`replaceImageReferencesOnRename`）会通过 `replaceFrontmatterImagePath` 改写该形态，需注意区分。

### Wikilink → URL 转换规则

`replaceImageInMdFiles` 和 `replaceLink` 均实现了该规则：

| 旧格式 | 新路径 | 结果 |
|---|---|---|
| `![[img.jpg]]` | `https://...` | `![](https://...)` |
| `![[img.jpg\|alt]]` | `https://...` | `![alt](https://...)` |
| `![[img.jpg]]` | `new.jpg` | `![[new.jpg]]` |
| `![[img.jpg\|alt]]` | `new.jpg` | `![[new.jpg\|alt]]` |

## 设置页实现注意

`minAppVersion` 保持 **1.8.7**，设置页走传统 `display()` 渲染。

⚠️ **不要引入 Obsidian 1.13.0+ 的 `getSettingDefinitions()` 声明式设置 API**：实测只要该方法返回非空数组，Obsidian 会改用声明式渲染并**完全跳过 `display()`**，导致 4 个图床卡片（含标题）与 WebDAV 同步/测试按钮整块消失。如需设置页搜索功能，应改为把完整 UI 全部搬进 `SettingDefinition[]`（含图床动态字段、Bucket 自动获取、测试连接），成本高风险大，当前版本未采用。
