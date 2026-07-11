/**
 * 链接解析器
 * 解析 Markdown 中的三种图片链接格式：![]()、![[]]、<img>
 * 自动排除代码块中的链接
 */

import { ImageLink } from "../types";
import { IMAGE_EXTENSIONS } from "../utils/Common";

export { IMAGE_EXTENSIONS };

/** Markdown 图片链接: ![alt](url "title") — 支持 URL 中含一层括号 */
const MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;

/** Wiki 链接: ![[path]] / [[path]]（! 可选，靠扩展名白名单过滤非图片） */
const WIKI_IMAGE_REGEX = /!?\[\[([^\]|]+?)(?:\|([^\]]*))?]]/g;

/** HTML img 标签: <img src="url" ...> */
const HTML_IMG_REGEX = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;

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

		// 解析 HTML <img> 标签
		HTML_IMG_REGEX.lastIndex = 0;
		while ((match = HTML_IMG_REGEX.exec(content)) !== null) {
			if (this.isInCodeBlock(match.index, codeRanges)) continue;
			const pure = match[1].trim();
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
	 * 获取所有代码块的范围（围栏代码块 + 行内代码）
	 */
	private getCodeBlockRanges(content: string): [number, number][] {
		const ranges: [number, number][] = [];

		// 围栏代码块: ``` 或 ~~~
		const fenceRegex = /(^|\n)(```|~~~)/g;
		let fenceMatch: RegExpExecArray | null;
		let fenceStart = -1;
		let fenceChar: string = "";
		while ((fenceMatch = fenceRegex.exec(content)) !== null) {
			if (fenceStart === -1) {
				fenceStart = fenceMatch.index + fenceMatch[1].length;
				// 存储首字符判断 fence 类型："`" 或 "~"
				fenceChar = fenceMatch[2][0];
			} else if (fenceMatch[2][0] === fenceChar) {
				// 只比对首字符类型（不要求 marker 完全匹配，``` 可闭合 ~~~ 反之亦然）
				ranges.push([fenceStart, fenceMatch.index + fenceMatch[0].length]);
				fenceStart = -1;
				fenceChar = "";
			}
		}

		// 行内代码: `...` 或 ``...``
		const inlineRegex = new RegExp("(`+)([\\s\\S]+?)\\1", "g");
		let inlineMatch: RegExpExecArray | null;
		while ((inlineMatch = inlineRegex.exec(content)) !== null) {
			ranges.push([inlineMatch.index, inlineMatch.index + inlineMatch[0].length]);
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
	private detectLinkType(pure: string): "local" | "https" | "http" {
		if (pure.startsWith("https://")) return "https";
		if (pure.startsWith("http://")) return "http";
		// 协议相对 URL: //cdn.example.com/img.png
		if (pure.startsWith("//")) return "http";
		return "local";
	}

	/**
	 * 根据 offset 计算行号（1-based）
	 */
	private getLineNumber(content: string, offset: number): number {
		return content.substring(0, offset).split("\n").length;
	}
}
