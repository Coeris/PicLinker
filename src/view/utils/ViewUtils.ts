import { sanitizeHTMLToDom, App } from "obsidian";
import { ImageBedType, LazyRenderableElement } from "../../types";
import { extractFileName } from "../../comparator/CloudComparator";
import { detectBedTypeFromUrl, getBedFaviconSvg } from "../../icons";

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
/**
 * 同步分区标题条的边框状态。
 * 关键设计：边框完全由 CSS class 驱动（.pic-part-header--collapsed / --stuck / 组合），
 * JS 只负责确保 class 与“是否吸顶”一致，绝不写内联 border。
 *
 * 为什么不能写内联 border：
 * 折叠时 toggleSection 会调 scrollIntoView，触发吸顶滚动 handler 再次进入本函数；
 * 内联 style.border / border-bottom 是非原子写入，滚动竞态中旧状态的残留内联值会
 * 盖住新状态，导致“点一下边框不对、刷新后才对”。改为纯 class 驱动后无残留、无竞态。
 *
 * @param header 分区标题条元素
 * @param content 分区内容元素（当前未直接用于边框计算，保留以备扩展）
 */
export function syncHeaderBorder(header: HTMLElement, content: HTMLElement): void {
	const collapsed = header.classList.contains("pic-part-header--collapsed");
	const stuck = header.classList.contains("pic-part-header--stuck");
	// 仅对齐吸顶态 class（吸顶由滚动检测决定，需 JS 同步）；收起态由点击 handler 直接 toggle。
	// 边框样式本身交给 CSS，见 styles.css 中 .pic-part-header / --collapsed / --stuck 规则。
	if (stuck && collapsed) {
		header.addClass("pic-part-header--stuck");
	} else if (!stuck && header.classList.contains("pic-part-header--stuck")) {
		header.removeClass("pic-part-header--stuck");
	}
	// collapsed 态的 class 已由点击 handler 维护，此处不触碰，避免与滚动 handler 竞态。
}

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

/**
 * 图床显示名：有明确图床类型时直接返回（如「阿里云 OSS」）；
 * 未识别（bedType 为 null，例如豆瓣等未在 DOMAIN_BED_MAP 登记的图床）
 * 时回退到 URL 域名（如 doubanio.com），避免一律显示「未知」。
 */
export function bedTypeLabel(bedType: ImageBedType | undefined | null, url?: string): string {
	if (bedType) return bedType;
	if (url) {
		try {
			let host = new URL(url).hostname.toLowerCase();
			// 去掉常见图片 CDN 前缀（www./img1./cdn./i. 等），显示主域名更直观；
			// 仅当主机名含 ≥3 段时才剥离首段，避免误伤 imgur.com 这类两段域名。
			const parts = host.split(".");
			if (parts.length >= 3 && /^(www|img\d*|cdn\d*|i\d*|pic\d*|photo\d*|res\d*|static|assets)$/.test(parts[0])) {
				host = parts.slice(1).join(".");
			}
			if (host) return host;
		} catch { /* 无效 URL，回退未知 */ }
	}
	return "未知";
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
