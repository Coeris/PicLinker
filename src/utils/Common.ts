/**
 * 公共工具函数
 */

/** 安全的 Base64 编码，支持非 ASCII 字符（如中文用户名/密码） */
export function safeBtoa(str: string): string {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(str);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/** 图片文件扩展名 */
export const IMAGE_EXTENSIONS = new Set([
	"png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "tiff", "tif", "avif",
]);

/**
 * 清除不可见字符（零宽空格等，从网页复制密钥时可能混入）
 * 字符说明：
 *   \u200B - 零宽空格 (Zero Width Space)
 *   \u200C - 零宽非连接符 (Zero Width Non-Joiner)
 *   \u200D - 零宽连接符 (Zero Width Joiner)
 *   \uFEFF - 字节顺序标记 / 零宽不换行空格 (BOM / Zero Width No-Break Space)
 *   \u00A0 - 不换行空格 (No-Break Space)
 */
export function cleanInvisible(s: string): string {
	return s.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");
}

/** 正则表达式特殊字符转义 */
export function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 图床配置字段列表（用于 WebDAV 同步和加密） */
export const BED_SETTINGS_KEYS = [
	"githubToken", "githubOwner", "githubRepo", "githubBranch", "githubPath",
	"aliyunEndpoint", "aliyunBucket", "aliyunAccessKeyId", "aliyunAccessKeySecret",
	"tencentSecretId", "tencentSecretKey", "tencentBucket", "tencentRegion",
	"smmsToken",
	"otherBedName", "otherBedUrl", "otherBedUsername", "otherBedPassword", "otherBedPath",
] as const;

/** XML 解析结果 */
export interface ParsedXmlResult {
	/** 解析后的 XML 文档 */
	doc: Document;
	/** 错误信息（如果有） */
	error?: { code: string; message: string };
}

/**
 * 解析 XML 文档
 * @param xmlText XML 文本
 * @returns 解析结果，包含文档和可能的错误
 */
export function parseXml(xmlText: string): ParsedXmlResult {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xmlText, "application/xml");

	// 检查错误
	const errorCode = doc.querySelector("Code");
	if (errorCode) {
		const message = doc.querySelector("Message")?.textContent || "";
		return { doc, error: { code: errorCode.textContent || "", message } };
	}

	return { doc };
}

/**
 * 从 XML 文档中解析文件列表（Contents 元素）
 * @param doc XML 文档
 * @param baseUrl 基础 URL
 * @returns 文件列表
 */
export function parseXmlFileList(doc: Document, baseUrl: string): Array<{ name: string; url: string; prefix: string }> {
	const files: Array<{ name: string; url: string; prefix: string }> = [];

	const contents = Array.from(doc.querySelectorAll("Contents"));
	for (const content of contents) {
		const key = decodeURIComponent(content.querySelector("Key")?.textContent || "");
		if (!key || key.endsWith("/")) continue;

		const name = key.split("/").pop() || key;
		files.push({ name, url: `${baseUrl}/${key}`, prefix: key });
	}

	return files;
}
