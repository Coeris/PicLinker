import { sanitizeHTMLToDom, App } from "obsidian";
import { ImageBedType, LazyRenderableElement } from "../../types";

/**
 * 统一同步分区标题条的边框（内联样式直接生效，绕过 CSS 级联与 !important 冲突）。
 * 边框状态只取决于两个 class：
 *   - pic-part-header--collapsed：收起态，四边完整 1px 边框
 *   - pic-part-header--stuck：吸顶态（展开时），只留底边分隔线
 * 之前把边框交给 CSS class + !important 级联，--stuck 的 border:none 没有 !important，
 * 会被 --collapsed 的 border:1px !important 压掉，且 !important 又压制 JS 内联样式，
 * 导致展开/收起、吸顶切换时边框视觉不刷新。改为 JS 内联统一管理后彻底解决。
 * @param header 分区标题条元素
 * @param content 分区内容元素（当前未直接用于边框计算，保留以备扩展）
 */
export function syncHeaderBorder(header: HTMLElement, content: HTMLElement): void {
	const collapsed = header.classList.contains("pic-part-header--collapsed");
	const stuck = header.classList.contains("pic-part-header--stuck");
	if (collapsed) {
		header.setCssStyles({ border: "1px solid var(--background-modifier-border)", borderBottom: "" });
	} else if (stuck) {
		header.setCssStyles({ border: "none", borderBottom: "1px solid var(--background-modifier-border)" });
	} else {
		header.setCssStyles({ border: "1px solid var(--background-modifier-border)", borderBottom: "none" });
	}
}
import { extractFileName } from "../../comparator/CloudComparator";
import { detectBedTypeFromUrl, getBedFaviconSvg } from "../../icons";

/**
 * 安全的 HTML 注入：使用 Obsidian 内置 sanitizeHTMLToDom。
 * 输入必须为插件自身受信任的 SVG/HTML 片段（图标、指南文本等），不含任何用户数据。
 */
/**
 * 判断元素当前是否处于隐藏状态（用于折叠/展开切换）。
 */
export function isHidden(el: HTMLElement): boolean {
	return el.style.display === "none";
}

/**
 * 点击防抖：标记元素，200ms 后自动清除。
 * 用于阻断 checkbox change 误触发行级 click handler。
 */
export function ignoreNextClick(el: HTMLElement): void {
	const le = el as LazyRenderableElement;
	le._ignoreNextClick = true;
	window.setTimeout(() => { delete le._ignoreNextClick; }, 200);
}

/** 触发懒渲染（如尚未渲染且存在渲染函数） */
export function ensureLazyRendered(el: HTMLElement): void {
	const le = el as LazyRenderableElement;
	if (!le._lazyRendered && le._lazyRenderFn) {
		le._lazyRenderFn();
		le._lazyRendered = true;
	}
}

/** 设置懒渲染函数 */
export function setLazyRenderFn(el: HTMLElement, fn: () => void): void {
	(el as LazyRenderableElement)._lazyRenderFn = fn;
}

/** 设置懒渲染完成标记 */
export function setLazyRendered(el: HTMLElement, value: boolean): void {
	(el as LazyRenderableElement)._lazyRendered = value;
}

export function setSafeHTML(el: HTMLElement, html: string): void {
	const frag = sanitizeHTMLToDom(html);
	el.empty();
	el.appendChild(frag);
}

/** 从 app localStorage 安全解析 JSON 数组 */
export function safeParseArray(app: App, key: string): string[] {
	try {
		const raw = app.loadLocalStorage(key) as string | null;
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as string[]) : [];
	} catch (e) {
		console.warn("[PicLinker] 展开状态数据损坏，已重置", e);
		return [];
	}
}

/** 从 app localStorage 安全解析 JSON 对象 */
export function safeParseObject(app: App, key: string): Record<string, unknown> | null {
	try {
		const raw = app.loadLocalStorage(key) as string | null;
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;
		return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}

/** 格式化显示路径（截断过长路径，确保输出不超过 MAX_LEN） */
export function formatDisplayPath(fullPath: string): string {
	const MAX_LEN = 60;
	if (fullPath.length <= MAX_LEN) return fullPath;
	const parts = fullPath.split("/");
	// 仅一段或两段（无中间目录可折叠）时，直接尾部截断
	if (parts.length <= 2) {
		return "..." + fullPath.slice(-(MAX_LEN - 3));
	}
	// 优先：「首段 /.../ 末两段」的折叠形态
	const head = parts[0];
	const tail = parts.slice(-2).join("/");
	const candidate = `${head}/.../${tail}`;
	if (candidate.length <= MAX_LEN) return candidate;
	// 退化：末两段本身已超长时整体尾部截断，保证不超过 MAX_LEN
	// （title 仍持有完整路径，本函数仅做长度兜底，不与 CSS ellipsis 重复冲突）
	return "..." + fullPath.slice(-(MAX_LEN - 3));
}

/** 获取 URL 列表中最多的图床图标 */
export function getTopBedIcon(urls: string[], gray = false): string {
	const bedCounts = new Map<ImageBedType, number>();
	for (const url of urls) {
		const bt = detectBedTypeFromUrl(url) || ImageBedType.Other;
		bedCounts.set(bt, (bedCounts.get(bt) || 0) + 1);
	}
	let topBed: ImageBedType = ImageBedType.Other;
	let maxCount = 0;
	for (const [bt, count] of bedCounts) {
		if (count > maxCount) {
			maxCount = count;
			topBed = bt;
		}
	}
	const icon = getBedFaviconSvg(topBed);
	return gray ? icon.replace(/fill="[^"]*"/g, 'fill="currentColor"') : icon;
}

/** 获取文件扩展名 */
export function getFileExtension(filename: string): string {
	const parts = filename.split(".");
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * 标签引用行条目
 */
export interface TagRef { file: string; line: number }

/**
 * 从 ImageLink 展开所有引用行（优先 fileLines，回退 files）
 * 集中处理，避免 ItemRenderer 和 restoreSelectionState 中各写一份。
 */
export function expandRefs(img: { files: string[]; fileLines?: Map<string, number[]> }): TagRef[] {
	const refs: TagRef[] = [];
	if (img.fileLines) {
		for (const [filePath, lines] of img.fileLines.entries()) {
			for (const line of lines) refs.push({ file: filePath, line });
		}
	}
	if (refs.length === 0) {
		for (const f of img.files) refs.push({ file: f, line: 0 });
	}
	return refs;
}

/**
 * 解析 tagKey 格式 `{keyPrefix}::{index}`，返回 keyPrefix 与 index。
 * 使用 lastIndexOf("::") 是安全的，因为 Obsidian 库内路径不含 "::"。
 */
export function parseTagKey(tagKey: string): { keyPrefix: string; index: number } | null {
	const sepIdx = tagKey.lastIndexOf("::");
	if (sepIdx === -1) return null;
	const idx = parseInt(tagKey.substring(sepIdx + 2), 10);
	if (isNaN(idx)) return null;
	return { keyPrefix: tagKey.substring(0, sepIdx), index: idx };
}

/**
 * 从 tagKey 的 keyPrefix 反查对应的 ImageLink。
 *
 * 兼容 4 种 keyPrefix 格式：
 * - LocalTags/CloudTags:   keyPrefix = ImageLink.pure
 * - SameNameTags:          keyPrefix = "{source}:{path}"
 * - DedupTags:             keyPrefix = "{path}"
 */
export function resolveImageFromTagKey<T extends { pure: string; resolvedPath?: string; files: string[]; fileLines?: Map<string, number[]> }>(keyPrefix: string, localImages: T[]): T | undefined {
	// 优先精确匹配 pure
	let img = localImages.find(i => i.pure === keyPrefix);
	if (img) return img;
	// 再匹配 resolvedPath
	img = localImages.find(i => i.resolvedPath === keyPrefix);
	if (img) return img;
	// SameName/Dedup：{source}:{path}
	if (keyPrefix.startsWith("local:") || keyPrefix.startsWith("cloud:")) {
		const colonIdx = keyPrefix.indexOf(":");
		const rawPath = keyPrefix.substring(colonIdx + 1);
		img = localImages.find(i => i.resolvedPath === rawPath || i.pure === rawPath);
		if (img) return img;
	}
	return undefined;
}

/** 构建文件名引用计数映射 */
export function buildFileNameRefCount(localImages: Array<{ pure: string }>): Map<string, number> {
	const map = new Map<string, number>();
	for (const img of localImages) {
		const fileName = extractFileName(img.pure);
		if (fileName) {
			map.set(fileName, (map.get(fileName) || 0) + 1);
		}
	}
	return map;
}
