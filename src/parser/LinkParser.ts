/**
 * 链接解析器
 * 解析 Markdown 中的三种图片链接格式：![]()、![[]]、<img>
 * 自动排除代码块中的链接
 */

import { ImageLink } from "../types";
import { IMAGE_EXTENSIONS } from "../utils/Common";
import { parseFrontmatterImages } from "../utils/FrontmatterParser";

export { IMAGE_EXTENSIONS };

/** Markdown 图片链接: ![alt](url "title") — 支持 URL 中含一层括号 */
const MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;

/** Wiki 链接: ![[path]] / [[path]]（! 可选，靠扩展名白名单过滤非图片） */
const WIKI_IMAGE_REGEX = /!?\[\[([^\]|]+?)(?:\|([^\]]*))?]]/g;

/**
 * HTML img 标签整体匹配: <img ...>
 * 提取 src/srcset 用下方单独的属性正则，避免复杂捕获组导致的边界失效。
 */
const HTML_IMG_TAG_REGEX = /<img\b[^>]*>/gi;
/** 提取 src 属性：兼容 "引号 / '引号 / 无引号 */
const HTML_IMG_SRC_ATTR_REGEX = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
/** 提取 srcset 属性（多个 URL 取第一个） */
const HTML_IMG_SRCSET_ATTR_REGEX = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

export class LinkParser {
	/**
	 * 解析文本中的所有图片链接（跳过代码块）
	 */
	parse(content: string): ImageLink[] {
		const links: ImageLink[] = [];
		const codeRanges = this.getCodeBlockRanges(content);

		// 解析 Markdown 格式 ![](url)
		MD_IMAGE_REGEX.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = MD_IMAGE_REGEX.exec(content)) !== null) {
			if (this.isInCodeBlock(match.index, codeRanges)) continue;
			const linkContent = match[2];
			const link = this.parseLinkContent(linkContent, match[0], match.index, content);
			if (link) {
				links.push(link);
			}
		}

		// 解析 Wiki 格式 ![[path|params]]（仅图片文件）
		WIKI_IMAGE_REGEX.lastIndex = 0;
		while ((match = WIKI_IMAGE_REGEX.exec(content)) !== null) {
			if (this.isInCodeBlock(match.index, codeRanges)) continue;
			const pure = match[1].trim();
			const params = match[2]?.trim() || "";

			if (!pure) continue;
			// 跳过笔记链接（无图片扩展名）
			const ext = pure.split(".").pop()?.toLowerCase() || "";
			if (!IMAGE_EXTENSIONS.has(ext)) continue;

			const type = this.detectLinkType(pure);
			const line = this.getLineNumber(content, match.index);

			links.push({
				raw: match[0],
				pure,
				params,
				type,
				count: 0,
				files: [],
				line,
			});
		}

		// 解析 HTML <img> 标签（含无引号 src / srcset / data: URI）
		HTML_IMG_TAG_REGEX.lastIndex = 0;
		while ((match = HTML_IMG_TAG_REGEX.exec(content)) !== null) {
			if (this.isInCodeBlock(match.index, codeRanges)) continue;
			const tag = match[0];
			let pure = "";
			const srcM = HTML_IMG_SRC_ATTR_REGEX.exec(tag);
			if (srcM) pure = (srcM[1] ?? srcM[2] ?? srcM[3] ?? "").trim();
			// src 缺失/为空时，回退到 srcset 的第一个 URL
			if (!pure) {
				const ssM = HTML_IMG_SRCSET_ATTR_REGEX.exec(tag);
				if (ssM) {
					const ssVal = (ssM[1] ?? ssM[2] ?? ssM[3] ?? "").trim();
					// srcset 形如 "a.png 1x, b.png 2x"，取第一个 URL
					pure = ssVal.split(/\s+|,/)[0]?.trim() || ssVal;
				}
			}
			if (!pure) continue;

			const type = this.detectLinkType(pure);
			const line = this.getLineNumber(content, match.index);

			links.push({
				raw: match[0],
				pure,
				params: "",
				type,
				count: 0,
				files: [],
				line,
			});
		}

		return links;
	}

	/**
	 * 解析 frontmatter 中的裸路径图片字段（如 `cover: a.png`）。
	 *
	 * 这些值没有 `![[...]]` 包裹，普通 wiki/markdown 解析器识别不到，
	 * 因此单独通过后置扫描补充进来。仅当值以图片扩展名结尾才纳入（见 IMAGE_EXTENSIONS），
	 * 且带正确行号。返回结果可直接合并进 parse() 的结果。
	 */
	parseFrontmatterImages(content: string): ImageLink[] {
		const refs = parseFrontmatterImages(content);
		const links: ImageLink[] = [];
		for (const ref of refs) {
			const pure = ref.value;
			if (!pure) continue;
			// 裸路径字段一定是本地文件引用（不允许 http/https/data）
			const type: ImageLink["type"] = "local";
			links.push({
				raw: `${ref.key}: ${pure}`,
				pure,
				params: "",
				type,
				count: 0,
				files: [],
				line: ref.line,
			});
		}
		return links;
	}

	/**
	 * 获取所有代码块的范围（围栏代码块 + 行内代码）
	 */
	private getCodeBlockRanges(content: string): [number, number][] {
		const ranges: [number, number][] = [];

		// 围栏代码块: ``` 或 ~~~，支持 3 个及以上同字符（如 ```` / ~~~）
		// 开/闭围栏须字符类型与长度完全一致：同为 ` 且数量相等（或同为 ~），
		// 因此 ``` 不能闭合 ````，~ 系列同理；~~~ 仍被支持。
		const fenceRegex = /(^|\n)(`{3,}|~{3,})/g;
		let fenceMatch: RegExpExecArray | null;
		let fenceStart = -1;
		let fenceMarker: string = ""; // 完整围栏标记（如 ``` / ```` / ~~~），用于精确匹配开闭
		while ((fenceMatch = fenceRegex.exec(content)) !== null) {
			const marker = fenceMatch[2]; // 连续的反引号/波浪号字符串（长度可变）
			if (fenceStart === -1) {
				fenceStart = fenceMatch.index + fenceMatch[1].length;
				// 记录完整标记：用于开/闭围栏的长度与类型精确匹配
				fenceMarker = marker;
			} else if (marker === fenceMarker) {
				// 仅当闭合围栏与开启围栏完全一致（同字符、同长度）才视为闭合
				ranges.push([fenceStart, fenceMatch.index + fenceMatch[0].length]);
				fenceStart = -1;
				fenceMarker = "";
			}
		}

		// 行内代码: `...` 或 ``...``（逐行扫描，避免整篇文档上的回溯）
		const lines = content.split("\n");
		let lineStart = 0;
		const inlineRegex = /(`+)([\s\S]+?)\1/g;
		for (const line of lines) {
			inlineRegex.lastIndex = 0;
			let inlineMatch: RegExpExecArray | null;
			while ((inlineMatch = inlineRegex.exec(line)) !== null) {
				const start = lineStart + inlineMatch.index;
				ranges.push([start, start + inlineMatch[0].length]);
			}
			// +1 跳过行间的换行符 '\n'
			lineStart += line.length + 1;
		}

		return ranges;
	}

	/**
	 * 判断偏移量是否在代码块范围内
	 */
	private isInCodeBlock(offset: number, ranges: [number, number][]): boolean {
		for (const [start, end] of ranges) {
			if (offset >= start && offset < end) return true;
		}
		return false;
	}

	/**
	 * 解析 Markdown 链接内容，拆分 pure 和 params
	 */
	private parseLinkContent(linkContent: string, fullMatch: string, matchIndex: number, content: string): ImageLink | null {
		// Markdown 格式支持 "title" 后缀: ![](url "title")
		// 先去掉末尾的 "title" 部分
		const titleMatch = linkContent.match(/^(.+?)\s+"([^"]*)"$/);
		let pure: string;
		let params: string;

		if (titleMatch) {
			pure = titleMatch[1].trim();
			params = "";
		} else {
			// 处理 | 分隔的参数: url|params
			const pipeIndex = linkContent.indexOf("|");
			if (pipeIndex === -1) {
				pure = linkContent;
				params = "";
			} else {
				pure = linkContent.substring(0, pipeIndex).trim();
				params = linkContent.substring(pipeIndex + 1).trim();
			}
		}

		if (!pure) return null;

		// 尖括号 URL：![](<a b.png>) 是 CommonMark/Obsidian 合法的「带空格链接」写法，
		// 真实目标为尖括号内容（不含 < >），需剥离，否则 pure 残留尖括号导致解析失败 / 误判。
		if (pure.startsWith("<") && pure.endsWith(">") && pure.length >= 2) {
			pure = pure.slice(1, -1);
		}

		const type = this.detectLinkType(pure);

		return {
			raw: fullMatch,
			pure,
			params,
			type,
			count: 0,
			files: [],
			line: this.getLineNumber(content, matchIndex),
		};
	}

	/**
	 * 检测链接类型
	 */
	private detectLinkType(pure: string): "local" | "https" | "http" | "data" {
		if (pure.startsWith("https://")) return "https";
		if (pure.startsWith("http://")) return "http";
		// 协议相对 URL: //cdn.example.com/img.png
		if (pure.startsWith("//")) return "http";
		// 内联 data: URI（base64 / svg），非外部文件引用，不应判为本地图片
		if (pure.startsWith("data:")) return "data";
		return "local";
	}

	/**
	 * 根据 offset 计算行号（1-based）
	 */
	private getLineNumber(content: string, offset: number): number {
		return content.substring(0, offset).split("\n").length;
	}
}
