/**
 * Frontmatter 解析工具
 * 从 Markdown 文件头部提取 YAML 配置
 */

import { IMAGE_EXTENSIONS } from "./Common";

export interface FrontmatterConfig {
	/** 指定该文件使用的图床（覆盖全局默认） */
	imageBed?: string;
	/** 是否启用自动上传（粘贴即上传等场景） */
	autoUpload?: boolean;
	/** 该文件图片的云端路径前缀 */
	imagePath?: string;
}

/** 图床别名映射：前端显示名 → ImageBedType 枚举值 */
const BED_ALIASES: Record<string, string> = {
	"github": "GitHub",
	"gh": "GitHub",
	"aliyun": "阿里云 OSS",
	"ali": "阿里云 OSS",
	"oss": "阿里云 OSS",
	"tencent": "腾讯云 COS",
	"cos": "腾讯云 COS",
	"tx": "腾讯云 COS",
	"other": "其他图床",
	"smms": "其他图床",
	"sm.ms": "其他图床",
};

/**
 * 解析图床类型值，支持引号包裹和别名映射
 */
function parseBedValue(raw: string): string {
	// 去除引号
	const value = raw.trim().replace(/^["']|["']$/g, "");

	// 尝试别名映射（不区分大小写）
	const lower = value.toLowerCase();
	if (BED_ALIASES[lower]) {
		return BED_ALIASES[lower];
	}

	// 直接匹配 ImageBedType 枚举值
	if (value === "GitHub" || value === "阿里云 OSS" || value === "腾讯云 COS" || value === "其他图床") {
		return value;
	}

	// 返回原始值，让调用方处理
	return value;
}

/**
 * 从文件内容中提取 YAML frontmatter
 * 支持标准 --- 包围的格式
 */
export function parseFrontmatter(content: string): FrontmatterConfig | null {
	// P1#20: 按行解析，确保只有配对的末尾 --- 行才被识别为结束分隔符
	// 避免 YAML frontmatter 内容中包含 --- 行时被提前截断
	const lines = content.split("\n");
	// 必须以 --- 开头（去掉 \r）
	if (lines.length < 2 || lines[0].replace(/\r$/, "").trim() !== "---") return null;

	// 从第2行开始，逐行查找末尾的 ---
	const yamlLines: string[] = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		// 当遇到单独一行 --- 时（只包含 --- 和可选空白），视为 frontmatter 结束
		if (line.replace(/\r$/, "").trim() === "---") {
			const yaml = yamlLines.join("\n");
			if (!yaml.trim()) return null;
			const config: FrontmatterConfig = {};

			// image-bed 或 imageBed
			const bedMatch = yaml.match(/^(?:image[-_]?bed)\s*:\s*(.+)$/im);
			if (bedMatch) config.imageBed = parseBedValue(bedMatch[1]);

			// auto-upload 或 autoUpload
			const autoMatch = yaml.match(/^(?:auto[-_]?upload)\s*:\s*(true|false)$/im);
			if (autoMatch) config.autoUpload = autoMatch[1] === "true";

			// image-path 或 imagePath
			const pathMatch = yaml.match(/^(?:image[-_]?path)\s*:\s*(.+)$/im);
			if (pathMatch) config.imagePath = pathMatch[1].trim().replace(/^["']|["']$/g, "");

			// 如果没有任何有效字段，返回 null
			if (config.imageBed === undefined &&
				config.autoUpload === undefined &&
				config.imagePath === undefined) {
				return null;
			}

			return config;
		}
		yamlLines.push(line);
	}
	// 未找到闭合的 ---
	return null;
}

/**
 * Frontmatter 中扫描到的裸路径图片引用
 * （如 `cover: a.png`、`banner: photo.jpg` 这种值为图片路径的标量字段）
 */
export interface FrontmatterImageRef {
	/** 字段名（如 cover / banner） */
	key: string;
	/** 字段值（去掉引号后的图片路径） */
	value: string;
	/** 该字段在文件中的行号（1-based，frontmatter 位于文件头部） */
	line: number;
}

const FRONTMATTER_IMAGE_DENYLIST = new Set([
	"image-bed", "imagebed", "image_bed",
	"auto-upload", "autoupload", "auto_upload",
	"image-path", "imagepath", "image_path",
]);

/**
 * 扫描 frontmatter 中的「裸路径图片字段」
 *
 * 仅当字段值以已知图片扩展名结尾（见 IMAGE_EXTENSIONS）时才视为图片引用，
 * 避免仅凭 key 名猜测造成的误报（如 `author: alice.jpg` 之类）。
 * 同时排除 PicLinker 自身的 frontmatter 配置键（image-bed/auto-upload/image-path 等），
 * 这些键是图床指令或路径前缀，并非真实图片引用。
 * 返回的每个引用都带正确的行号，供上层扫描器聚合时使用。
 *
 * 注意：仅处理标量字段（按行匹配 `key: value`），嵌套/列表子项不纳入，
 * 以免与 YAML 复杂结构冲突或重复计数。
 */
export function parseFrontmatterImages(content: string): FrontmatterImageRef[] {
	const result: FrontmatterImageRef[] = [];
	const lines = content.split("\n");
	// 必须以 --- 开头（去掉 \r）
	if (lines.length < 2 || lines[0].replace(/\r$/, "").trim() !== "---") return result;

	// 从第2行开始，逐行扫描直到遇到闭合的 ---
	for (let i = 1; i < lines.length; i++) {
		const rawLine = lines[i].replace(/\r$/, "");
		// 单独的 --- 视为 frontmatter 结束
		if (rawLine.trim() === "---") break;

		// 匹配标量字段：key: value（value 至少 1 个字符）
		const m = rawLine.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.+?)\s*$/);
		if (!m) continue;

		const key = m[1];
		// 排除 PicLinker 自身配置键（非真实图片引用）
		if (FRONTMATTER_IMAGE_DENYLIST.has(key.toLowerCase())) continue;

		let value = m[2].trim();
		// 去除包裹的引号
		value = value.replace(/^["']|["']$/g, "");
		if (!value) continue;

		// 仅当值以图片扩展名结尾才纳入
		const ext = value.split(".").pop()?.toLowerCase() || "";
		if (!IMAGE_EXTENSIONS.has(ext)) continue;

		result.push({ key, value, line: i + 1 });
	}

	return result;
}
