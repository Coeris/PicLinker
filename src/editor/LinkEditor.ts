/**
 * Markdown 链接编辑服务
 * 从 main.ts 提取的链接替换/移除逻辑
 */

import { App, Notice, TFile } from "obsidian";
import { ImageLink } from "../types";
import { escapeRegex } from "../utils/Common";

export class LinkEditor {
	constructor(private app: App) {}

	/**
	 * 替换本地链接为云端链接（保留 params）
	 * 遍历 img.files 中所有引用文件，逐个替换
	 */
	async replaceLink(img: ImageLink, newPure: string): Promise<void> {
		// P1#17: img.files 为空时不回退到 activeFile，避免误改用户正在编辑的文件
		if (img.files.length === 0) {
			new Notice("无法确定图片引用的文件，跳过替换");
			return;
		}
		const targetFiles: string[] = img.files;

		for (const filePath of targetFiles) {
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) continue;

			const content = await this.app.vault.read(file);
			let newContent: string;

			if (img.raw.startsWith("![[") && img.raw.endsWith("]]")) {
				// Wiki 链接格式: ![[pure|params]] -> ![[newPure|params]]
				const newWikiLink = img.params
					? `![[${newPure}|${img.params}]]`
					: `![[${newPure}]]`;
				const escaped = escapeRegex(img.raw);
				newContent = content.replace(new RegExp(escaped, "g"), newWikiLink);
			} else {
				// Markdown 链接格式: ![alt](pure) -> ![alt](newPure)
				const escapedPure = escapeRegex(img.pure);
				// 转义替换字符串中的 $ 防止被当作反向引用
				const safeReplacement = `$1${newPure.replace(/\$/g, "$$$$")}$2`;
				newContent = content.replace(
					new RegExp(`(!\\[[^\\]]*\\]\\()${escapedPure}(\\))`, "g"),
					safeReplacement,
				);
			}

			if (newContent !== content) {
				await this.app.vault.modify(file, newContent);
			}
		}
	}

	/**
	 * 从单个 Markdown 文件中移除图片引用
	 * 移除后如果行变为空，则删除该行
	 * @returns 修改的行数（含删除的空行）
	 */
	async removeImageFromMdFile(filePath: string, imagePaths: string[]): Promise<number> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) return 0;

		const content = await this.app.vault.read(file);
		const lines = content.split("\n");
		const linesToDelete = new Set<number>();
		let modifiedCount = 0;

		for (let i = 0; i < lines.length; i++) {
			for (const imgPath of imagePaths) {
				const cleaned = this.removeImageFromLine(lines[i], imgPath);
				if (cleaned !== lines[i]) {
					lines[i] = cleaned;
					modifiedCount++;
					if (!lines[i].trim()) linesToDelete.add(i);
				}
			}
		}

		const newLines = lines.filter((_, idx) => !linesToDelete.has(idx));
		if (newLines.length < lines.length || content !== newLines.join("\n")) {
			await this.app.vault.modify(file, newLines.join("\n"));
		}
		return modifiedCount;
	}

	/**
	 * 在 Markdown 文件中替换图片路径（用于去重合并）
	 * @param candidates 可选的候选文件路径列表（来自 VaultScanner 的反向索引），有值时只扫描这些文件；无值时回退全库扫描
	 * @returns 被修改的文件数
	 */
	async replaceImageInMdFiles(oldPath: string, newPath: string, candidates?: string[]): Promise<number> {
		const escaped = escapeRegex(oldPath);
		const escapedNew = newPath.replace(/\$/g, "$$$$");
		// P1#18: 三个独立正则分别处理 Markdown/Wiki/HTML，替代脆弱的多捕获组合并正则
		const mdRegex = new RegExp(`(!\\[[^\\]]*\\]\\()${escaped}(\\))`, "g");
		const wikiRegex = new RegExp(`(!?\\[\\[)${escaped}(\\|[^\\]]*)?(\\]\\])`, "g");
		const htmlRegex = new RegExp(`(<img[^>]*src=["'])${escaped}(["'][^>]*/?>)`, "g");
		let count = 0;
		// 优先使用候选文件列表，避免全库遍历
		const filesToScan = candidates && candidates.length > 0
			? candidates.map(p => this.app.vault.getAbstractFileByPath(p)).filter((f): f is TFile => f instanceof TFile)
			: this.app.vault.getMarkdownFiles();
		for (const mdFile of filesToScan) {
			const content = await this.app.vault.cachedRead(mdFile);
			if (!content.includes(oldPath)) continue;
			let newContent = content;
			newContent = newContent.replace(mdRegex, `$1${escapedNew}$2`);
			newContent = newContent.replace(wikiRegex, `$1${escapedNew}$2$3`);
			newContent = newContent.replace(htmlRegex, `$1${escapedNew}$2`);
			if (newContent !== content) {
				await this.app.vault.modify(mdFile, newContent);
				count++;
			}
		}
		return count;
	}

	/**
	 * 从所有 Markdown 文件中移除图片引用
	 * @returns 被修改的文件数
	 */
	async removeImageFromAllMdFiles(imagePaths: string[]): Promise<number> {
		let count = 0;
		for (const mdFile of this.app.vault.getMarkdownFiles()) {
			const modified = await this.removeImageFromMdFile(mdFile.path, imagePaths);
			if (modified > 0) count++;
		}
		return count;
	}

	/** 智能移除行中的图片引用，保留行中其他内容 */
	removeImageFromLine(line: string, imgPath: string): string {
		// Markdown 格式: ![alt](url)
		let result = line.replace(
			new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegex(imgPath)}\\)`, "g"),
			"",
		);
		// Wiki 格式: ![[path]] / [[path]]（! 可选）
		result = result.replace(
			new RegExp(`!?\\[\\[${escapeRegex(imgPath)}(\\|[^\\]]*)?\\]\\]`, "g"),
			"",
		);
		// HTML 格式: <img src="url">
		result = result.replace(
			new RegExp(`<img[^>]*src=["']${escapeRegex(imgPath)}["'][^>]*/?>`, "g"),
			"",
		);
		return result;
	}
}
