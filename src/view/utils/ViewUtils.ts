import { sanitizeHTMLToDom, App } from "obsidian";
import { ImageBedType, LazyRenderableElement } from "../../types";
import { extractFileName } from "../../comparator/CloudComparator";
import { detectBedTypeFromUrl, getBedFaviconSvg } from "../../icons";

/**
 * 仅对齐分区标题的吸顶态 class（吸顶由滚动检测决定，需 JS 同步）。
 * 收起态由点击 handler 直接 toggle，本函数不触碰，避免与滚动 handler 竞态。
 * 边框样式本身交给 CSS，见 styles.css 中 .pic-part-header / --collapsed / --stuck 规则。
 *
 * 为什么不能写内联 border：
 * 折叠时 toggleSection 会调 scrollIntoView，触发吸顶滚动 handler 再次进入本函数；
 * 内联 style.border / border-bottom 是非原子写入，滚动竞态中旧状态的残留内联值会
 * 盖住新状态，导致“点一下边框不对、刷新后才对”。改为纯 class 驱动后无残留、无竞态。
 *
 * @param header 分区标题条元素
 */
export function syncHeaderStuckClass(header: HTMLElement, isStuck: boolean): void {
	if (isStuck) {
		header.addClass("pic-part-header--stuck");
	} else {
		header.removeClass("pic-part-header--stuck");
	}
	// collapsed 态的 class 已由点击 handler 维护，此处不触碰，避免与滚动 handler 竞态。
}

/**
 * 安全的 HTML 注入：使用 Obsidian 内置 sanitizeHTMLToDom。
 * 输入必须为插件自身受信任的 SVG/HTML 片段（图标、指南文本等），不含任何用户数据。
 */
/**
 * 判断元素是否处于折叠状态。统一依据 CSS class，不依赖内联 style.display。
 * 折叠态 class 在 styles.css 中以 --collapsed 后缀定义为 display:none。
 */
export function isHidden(el: HTMLElement): boolean {
	if (el.classList.contains("pic-part-content--collapsed")) return true;
	if (el.classList.contains("pic-dir-content--collapsed")) return true;
	if (el.classList.contains("pic-part-actions--hidden")) return true;
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

/**
 * 创建缩略图加载失败时的占位元素。
 * 默认跟随 .pic-thumb 的 32×32 尺寸（mobile 28×28），套用 --pic-text-muted 颜色。
 * 原有 img 需调用方手动隐藏。
 */
export function createThumbBrokenPlaceholder(parent: HTMLElement, title = "图片缺失 / 加载失败"): HTMLDivElement {
	const placeholder = parent.createDiv({ cls: "pic-thumb pic-thumb-broken", attr: { title } });
	// 与「未找到」区域一致的红色断链图标（方框 + 圆点 + 斜线），确保断链缩略图在各区域视觉统一
	setSafeHTML(placeholder, '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="var(--pic-error)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>');
	return placeholder;
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
