/**
 * Markdown 链接编辑服务
 * 从 main.ts 提取的链接替换/移除逻辑
 */

import { App, Notice, TFile, normalizePath } from "obsidian";
import { ImageLink } from "../types";
import { escapeRegex, IMAGE_EXTENSIONS } from "../utils/Common";
import { parseFrontmatterImages } from "../utils/FrontmatterParser";

/** 去掉文件扩展名（保留点号前的名字） */
function stripExt(name: string): string {
	const i = name.lastIndexOf(".");
	return i > 0 ? name.substring(0, i) : name;
}
/** 取文件名（含扩展名） */
function basename(p: string): string {
	const i = p.lastIndexOf("/");
	return i >= 0 ? p.substring(i + 1) : p;
}
/** 取目录部分 */
function dirOf(p: string): string {
	const i = p.lastIndexOf("/");
	return i >= 0 ? p.substring(0, i) : "";
}

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
			let newContent: string = content;

			if (img.raw.startsWith("![[")) {
				// Wiki 链接格式: ![[pure|params]] -> ![[newPure|params]]
				const newWikiLink = img.params
					? `![[${newPure}|${img.params}]]`
					: `![[${newPure}]]`;
				const escaped = escapeRegex(img.raw);
				newContent = content.replace(new RegExp(escaped, "g"), newWikiLink);
			} else if (img.raw.startsWith("<img")) {
				// HTML img 标签: <img src="pure"> -> <img src="newPure">
				const escapedPure = escapeRegex(img.pure);
				const safeNew = newPure.replace(/\$/g, "$$$$");
				const htmlRegex = new RegExp(
					`(<img[^>]*src=["'])${escapedPure}(["'][^>]*/?>)`,
					"g",
				);
				newContent = content.replace(htmlRegex, `$1${safeNew}$2`);
			} else {
				// Markdown 链接格式: ![alt](pure) -> ![alt](newPure)
				// 同时保留可选的 "title"（单/双引号）
				const escapedPure = escapeRegex(img.pure);
				// 转义替换字符串中的 $ 防止被当作反向引用
				const safeNew = newPure.replace(/\$/g, "$$$$");
				const mdRegex = new RegExp(
					`(!\\[[^\\]]*\\]\\()${escapedPure}((?:\\s+"[^"]*"|\\s+'[^']*')?)(\\))`,
					"g",
				);
				newContent = content.replace(mdRegex, `$1${safeNew}$2$3`);
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
		const wikiRegex = new RegExp(`(!?\\[\\[)${escaped}((?:\\|[^\\]]*)?)(\\]\\])`, "g");
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
			newContent = newContent.replace(wikiRegex, (_match, p1: string, p2: string, p3: string) => `${p1}${escapedNew}${p2 || ""}${p3}`);
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
		// Frontmatter 裸路径: key: path → key:（清空值，保留字段名）
		result = result.replace(
			new RegExp(`^(\s*[A-Za-z0-9_-]+\s*:\s*["']?)${escapeRegex(imgPath)}(["']?\s*)$`, "g"),
			"$1$2",
		);
		return result;
	}

	/**
	 * 图片被重命名后，扫描全库 markdown 笔记，把引用了旧路径/旧文件名的图片链接
	 * 更新为新路径/新文件名。覆盖三种形态：
	 *   - Markdown 标准链接 `![](path)`（含 `./` `../` 相对、绝对 `/`、vault 相对）
	 *   - Wikilink `![[name]]` / `![[name|alias]]`（含无扩展名形态，LinkParser 默认会跳过）
	 *   - Frontmatter 裸路径字段（如 `cover: a.png`，由 FrontmatterParser 解析）
	 * 匹配基于「该引用在重命名前解析到的旧路径」精确比对，避免同名不同路径误伤；
	 * wikilink 无扩展名时若库内存放同名（无扩展名）的其他文件则跳过以消解歧义。
	 * @returns 被修改的笔记文件数量
	 */
	async replaceImageReferencesOnRename(oldPath: string, newPath: string): Promise<number> {
		const oldName = basename(oldPath);
		const newName = basename(newPath);
		const oldNameNoExt = stripExt(oldName);
		const newNameNoExt = stripExt(newName);

		// 同名（无扩展名）文件并存检测，仅用于消解「无扩展名 wikilink」歧义
		const ambiguous = new Set<string>();
		for (const f of this.app.vault.getFiles()) {
			if (f.path === newPath) continue;
			const n = stripExt(f.name).toLowerCase();
			if (n === oldNameNoExt.toLowerCase()) ambiguous.add(n);
		}

		let modifiedFiles = 0;
		const mdFiles = this.app.vault.getMarkdownFiles();

		for (const mdFile of mdFiles) {
			const content = await this.app.vault.read(mdFile);
			// 快速预筛：内容完全不包含旧路径/旧文件名才可能是引用方
			if (!content.includes(oldPath) && !content.includes(oldName) && !content.includes(oldNameNoExt)) {
				continue;
			}
			const noteDir = dirOf(mdFile.path);
			let fileTouched = false;
			let m: RegExpExecArray | null;

			// 1) Markdown 标准链接
			const mdRe = /!\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
			const mdMatches: { img: ImageLink; newPure: string }[] = [];
			while ((m = mdRe.exec(content)) !== null) {
				const full = m[0];
				const alt = m[1];
				let pure = m[2];
				const tm = pure.match(/^(.+?)\s+"([^"]*)"$/);
				let title = "";
				let altText = alt;
				if (tm) {
					pure = tm[1].trim();
					title = tm[2];
				}
				if (pure.startsWith("<") && pure.endsWith(">")) pure = pure.slice(1, -1);
				if (!pure) continue;
				// 仅本地引用需要跟随重命名（http/https/data 不受影响）
				if (/^(https?:)?\/\//i.test(pure) || pure.startsWith("data:")) continue;
				const newPure = this.resolveMdOrFmNewRef(pure, noteDir, oldPath, newPath);
				if (newPure === null) continue;
				mdMatches.push({
					img: { raw: full, pure, params: title, type: "local", count: 1, files: [mdFile.path] },
					newPure,
				});
			}
			for (const mm of mdMatches) {
				await this.replaceLink(mm.img, mm.newPure);
				fileTouched = true;
			}

			// 2) Wikilink（含无扩展名；LinkParser 默认跳过无扩展名，这里自行扫描）
			const wikiRe = /(!?)\[\[([^\]|]+?)(?:\|([^\]]*))?]]/g;
			const wikiMatches: { img: ImageLink; newPure: string }[] = [];
			while ((m = wikiRe.exec(content)) !== null) {
				const name = m[2];
				const params = m[3] || "";
				const lastDot = name.lastIndexOf(".");
				const ext = lastDot >= 0 ? name.substring(lastDot + 1).toLowerCase() : "";
				const hasExt = lastDot >= 0;
				const isImage = IMAGE_EXTENSIONS.has(ext) ||
					(!hasExt && !!oldNameNoExt && name.toLowerCase() === oldNameNoExt.toLowerCase());
				if (!isImage) continue;
				const newPure = this.resolveWikiNewRef(name, oldPath, oldNameNoExt, newPath, newName, newNameNoExt, ambiguous);
				if (newPure === null) continue;
				const raw = `![[${name}${params ? "|" + params : ""}]]`;
				wikiMatches.push({
					img: { raw, pure: name, params, type: "local", count: 1, files: [mdFile.path] },
					newPure,
				});
			}
			for (const wm of wikiMatches) {
				await this.replaceLink(wm.img, wm.newPure);
				fileTouched = true;
			}

			// 3) Frontmatter 裸路径字段
			const fmRefs = parseFrontmatterImages(content);
			for (const ref of fmRefs) {
				const newVal = this.resolveMdOrFmNewRef(ref.value, noteDir, oldPath, newPath);
				if (newVal === null) continue;
				await this.replaceFrontmatterImagePath(mdFile.path, ref.line, ref.value, newVal);
				fileTouched = true;
			}

			if (fileTouched) modifiedFiles++;
		}

		return modifiedFiles;
	}

	/**
	 * 计算 Markdown / Frontmatter 裸路径引用在「重命名前」解析到的目标路径，
	 * 并判定是否指向 oldPath；命中则返回应写入的新引用（vault 相对路径）。
	 * 同时支持：vault 相对（默认）、文件相对（./ ../）、绝对（/ 开头）。
	 */
	private resolveMdOrFmNewRef(pure: string, noteDir: string, oldPath: string, newPath: string): string | null {
		let cand: string;
		if (pure.startsWith("/")) {
			cand = normalizePath(pure.slice(1));
		} else if (pure.startsWith("./") || pure.startsWith("../")) {
			cand = normalizePath((noteDir ? noteDir + "/" : "") + pure);
		} else {
			cand = normalizePath(pure);
		}
		if (cand === oldPath) {
			return (pure.startsWith("/") ? "/" : "") + newPath;
		}
		return null;
	}

	/**
	 * 计算 Wikilink 引用是否指向 oldPath，返回应写入的新 wikilink 目标名。
	 * - 含路径（`folder/name.png`）：按 vault 路径精确比较 oldPath。
	 * - 仅文件名：按「去扩展名后是否等于旧图名」判定；无扩展名且库内存在同名
	 *   （无扩展名）的其他文件时跳过以消解歧义。
	 */
	private resolveWikiNewRef(
		name: string,
		oldPath: string,
		oldNameNoExt: string,
		newPath: string,
		newName: string,
		newNameNoExt: string,
		ambiguous: Set<string>,
	): string | null {
		if (name.includes("/")) {
			const cand = normalizePath(name.startsWith("/") ? name.slice(1) : name);
			if (cand === oldPath) return (name.startsWith("/") ? "/" : "") + newPath;
			return null;
		}
		const tNoExt = stripExt(name);
		if (tNoExt.toLowerCase() !== oldNameNoExt.toLowerCase()) return null;
		const hasExt = name.includes(".");
		if (!hasExt && ambiguous.has(tNoExt.toLowerCase())) return null;
		return hasExt ? newName : newNameNoExt;
	}

	/**
	 * 替换单个 markdown 文件 frontmatter 中某个裸路径图片字段的值（保留原有引号风格）。
	 */
	async replaceFrontmatterImagePath(filePath: string, line: number, oldValue: string, newValue: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) return;
		const content = await this.app.vault.read(file);
		const lines = content.split("\n");
		const idx = line - 1;
		if (idx < 0 || idx >= lines.length) return;
		const l = lines[idx];
		const keyM = l.match(/^\s*([A-Za-z0-9_-]+)\s*:/);
		if (!keyM) return;
		const key = keyM[1];
		const re = new RegExp(
			"^(\\s*" + escapeRegex(key) + "\\s*:\\s*[\"']?)" + escapeRegex(oldValue) + "([\"']?\\s*)$",
		);
		if (re.test(l)) {
			lines[idx] = l.replace(re, "$1" + newValue.replace(/\$/g, "$$$$") + "$2");
			await this.app.vault.modify(file, lines.join("\n"));
		}
	}
}
