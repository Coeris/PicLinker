/**
 * DeleteOperations — 批量删除操作
 * 从 PicLinkerView 提取：
 *   batchDeleteWithCleanup, batchDeleteLocalUnref, batchDeleteLocalFiles,
 *   batchDeleteReferenceLines, batchDeleteNotFoundImages, batchDeleteNotFoundTags, batchDeleteCloudImages,
 *   batchDeleteEmptyFolders
 *
 * dedupDeleteSelected / deleteSelectedSameName 留在主类（需直接修改 Group 结构）
 */

import { Notice, TFile, App } from "obsidian";
import { ImageLink, ImageBedType, CloudFile } from "../../types";
import { extractFileName } from "../../comparator/CloudComparator";
import { detectBedTypeFromUrl } from "../../icons";
import { SelectionManager, SelectionSection } from "../SelectionManager";
import { expandRefs, parseTagKey, resolveImageFromTagKey } from "../utils/ViewUtils";
import { confirmAsync } from "../../utils/DangerConfirmModal";

export interface BatchDeleteResult {
	referencesDeleted: number;
	referencesFailed: number;
	filesDeleted: number;
	filesFailed: number;
}

export interface DeleteOperationsContext {
	selection: SelectionManager;
	app: App;
	localImages: () => ImageLink[];
	cloudFiles: () => CloudFile[];
	compareResult: () => Map<string, { exists: boolean; url?: string; bedType?: ImageBedType }>;
	selectedBed: () => ImageBedType;
	removeImageFromMdFile: (filePath: string, urls: string[]) => Promise<number>;
	removeImageFromLine: (line: string, url: string) => string;
	deleteCloudFile: (fileKey: string, bedType: ImageBedType) => Promise<{ success: boolean; error?: string }>;
	refresh: () => Promise<void>;
}

export class DeleteOperations {
	private ctx: DeleteOperationsContext;

	constructor(ctx: DeleteOperationsContext) {
		this.ctx = ctx;
	}

	/** 3) 统一的删除结果汇总 Notice（替代各处零散的“X 行已删除”格式，保持一致） */
	private showDeleteSummary(label: string, success: number, fail: number) {
		if (success === 0 && fail === 0) return;
		const parts: string[] = [];
		if (success > 0) parts.push(`${success} ${label}已删除`);
		if (fail > 0) parts.push(`${fail} ${label}失败`);
		new Notice(parts.join("，"));
	}

	/**
	 * 通用批量删除方法
	 * @param options.section 选中区域
	 * @param options.confirmMessage 确认对话框消息
	 * @param options.items 要删除的项目列表
	 * @param options.deleteReferences 是否删除笔记引用
	 * @param options.onDeleteLocal 删除本地文件的回调
	 * @param options.onDeleteCloud 删除云端文件的回调
	 * @param options.onAfterDelete 删除完成后的回调（用于清理数据）
	 */
	async batchDeleteWithCleanup(options: {
		section: SelectionSection;
		confirmMessage: string;
		/**
		 * key: 删除身份标识（用于 onAfterDelete 的 deletedKeys 集合）
		 * path: 实际删除目标（本地=vault 路径，云端=URL/fileKey）
		 * refText: 可选，该项在笔记正文中真实出现的链接文本（即 ImageLink.pure），
		 *          用于引用清理匹配。未提供时回退到 key（兼容旧调用方，key 即 pure）。
		 */
		items: Array<{ key: string; type: 'local' | 'cloud'; path: string; bedType?: ImageBedType; refText?: string }>;
		deleteReferences: boolean;
		onDeleteLocal?: (path: string) => Promise<boolean>;
		onDeleteCloud?: (path: string, bedType: ImageBedType) => Promise<boolean>;
		onAfterDelete?: (deletedKeys: Set<string>) => Promise<void>;
	}): Promise<BatchDeleteResult> {
		const result: BatchDeleteResult = { referencesDeleted: 0, referencesFailed: 0, filesDeleted: 0, filesFailed: 0 };
		const { selection, localImages, removeImageFromMdFile, refresh } = this.ctx;

		if (options.items.length === 0) {
			new Notice("无项目需要删除");
			return result;
		}

		if (!(await confirmAsync(this.ctx.app, { message: options.confirmMessage }))) return result;

		// 第一步：删除文件（先删文件，成功后再清引用，避免「引用已删、文件还在」的不一致态）
		const deletedKeys = new Set<string>(); // 记录成功删除的项 key
		const total = options.items.length;
		// 进度反馈：仅在批量较大时提示，避免单条删除刷屏
		const showProgress = total > 5;
		if (showProgress) new Notice(`正在删除（文件阶段）：${result.filesDeleted}/${total}`);
		for (let idx = 0; idx < options.items.length; idx++) {
			const item = options.items[idx];
			try {
				if (item.type === 'local' && options.onDeleteLocal) {
					const success = await options.onDeleteLocal(item.path);
					if (success) { result.filesDeleted++; deletedKeys.add(item.key); }
					else result.filesFailed++;
				} else if (item.type === 'cloud' && options.onDeleteCloud) {
					const success = await options.onDeleteCloud(item.path, item.bedType || ImageBedType.Other);
					if (success) { result.filesDeleted++; deletedKeys.add(item.key); }
					else result.filesFailed++;
				}
			} catch {
				result.filesFailed++;
			}
			// 每 10 个或最后一项更新一次进度（避免频繁刷新 Notice）
			if (showProgress && ((idx + 1) % 10 === 0 || idx + 1 === total)) {
				new Notice(`正在删除（文件阶段）：${result.filesDeleted}/${total}`);
			}
		}

		// 第二步：仅对「成功删除文件」的项清理笔记引用
		// 目的：若文件删除失败，保留笔记引用，避免「引用已删、文件还在」的脏态
		if (options.deleteReferences) {
			const fileImageMap = new Map<string, string[]>();
			for (const item of options.items) {
				if (!deletedKeys.has(item.key)) continue; // 仅清理已成功删除的项
				// 优先用显式传入的正文链接文本 refText 定位图片；
				// 否则回退到 key（旧调用方 key 即 img.pure）。
				// 再回退到用 vault 路径 path 反查（resolvedPath 或 pure 匹配），保障本地项也能命中。
				const refText = item.refText;
				const img = localImages().find(i => i.pure === (refText ?? item.key))
					?? localImages().find(i => (i.resolvedPath || i.pure) === item.path);
				if (img) {
					for (const fp of img.files) {
						if (!fileImageMap.has(fp)) fileImageMap.set(fp, []);
						fileImageMap.get(fp)!.push(img.pure);
					}
				}
			}
			for (const [fp, imagePaths] of fileImageMap) {
				try {
					const count = await removeImageFromMdFile(fp, imagePaths);
					if (count > 0) result.referencesDeleted += count;
					else result.referencesFailed++;
				} catch {
					result.referencesFailed++;
				}
			}
		}

		// 第三步：清理选中状态
		selection.clear(options.section);
		if (options.section === SelectionSection.LocalImages || options.section === SelectionSection.NotFound) {
			selection.clear(SelectionSection.LocalTags);
		} else if (options.section === SelectionSection.CloudImages) {
			selection.clear(SelectionSection.CloudTags);
		} else if (options.section === SelectionSection.SameName) {
			selection.clear(SelectionSection.SameNameTags);
		} else if (options.section === SelectionSection.Dedup) {
			selection.clear(SelectionSection.DedupTags);
		}

		// 第四步：删除后回调
		if (options.onAfterDelete) {
			await options.onAfterDelete(deletedKeys);
		}

		// 第五步：刷新视图
		await refresh();

		// 第六步：显示通知
		const parts: string[] = [];
		if (result.referencesDeleted > 0) parts.push(`${result.referencesDeleted} 行引用已清理`);
		if (result.filesDeleted > 0) parts.push(`${result.filesDeleted} 个文件已删除`);
		if (result.referencesFailed > 0) parts.push(`${result.referencesFailed} 行引用清理失败`);
		if (result.filesFailed > 0) parts.push(`${result.filesFailed} 个文件删除失败`);
		if (parts.length > 0) new Notice(`批量删除完成：${parts.join("，")}`);

		return result;
	}

	/** 批量删除选中的本地未引用图片 */
	async batchDeleteLocalUnref(localUnreferenced: TFile[]) {
		const { selection, app } = this.ctx;
		if (selection.getCount(SelectionSection.LocalUnref) === 0) { new Notice("请先选择要删除的图片"); return; }
		const toDelete = localUnreferenced.filter(f => selection.isSelected(SelectionSection.LocalUnref, f.path));
		if (toDelete.length === 0) { new Notice("无图片需要删除"); return; }

		await this.batchDeleteWithCleanup({
			section: SelectionSection.LocalUnref,
			confirmMessage: `确定要删除选中的 ${toDelete.length} 个本地未引用图片吗？（将移入回收站）`,
			items: toDelete.map(f => ({ key: f.path, type: "local" as const, path: f.path })),
			deleteReferences: false,
			onDeleteLocal: async (path: string) => {
				const file = app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile) { await app.fileManager.trashFile(file); return true; }
				return false;
			},
		});
	}

	/** 批量删除选中的本地图片文件 */
	async batchDeleteLocalFiles(localImages: ImageLink[]) {
		const { selection, app } = this.ctx;
		if (selection.getCount(SelectionSection.LocalImages) === 0) { new Notice("请先选择要删除的图片"); return; }
		const toDelete = localImages.filter(img => selection.isSelected(SelectionSection.LocalImages, img.pure));
		if (toDelete.length === 0) { new Notice("无图片需要删除"); return; }

		await this.batchDeleteWithCleanup({
			section: SelectionSection.LocalImages,
			confirmMessage: `确定要删除选中的 ${toDelete.length} 个图片文件吗？\n将移入系统回收站并清理笔记中的引用行。`,
			items: toDelete.map(img => ({
				key: img.pure,
				type: 'local' as const,
				path: img.resolvedPath || img.pure,
			})),
			deleteReferences: true,
			onDeleteLocal: async (path: string) => {
				const file = app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile) { await app.fileManager.trashFile(file); return true; }
				return false;
			},
		});
	}

	/** 批量删除引用行（删除笔记中引用选中图片的行） */
	/** 删除顶部工具栏「删除行」—— 清除所有标签对应的引用行 */
	async batchDeleteReferenceLines() {
		return this.deleteReferenceLinesForSections([
			SelectionSection.LocalTags,
			SelectionSection.CloudTags,
			SelectionSection.SameNameTags,
			SelectionSection.DedupTags,
		]);
	}

	/** 删除当前区域标签对应的引用行 —— 供区域标题栏按钮调用 */
	async deleteReferenceLinesForSections(tagSections: SelectionSection[]) {
		const { selection, localImages, app, removeImageFromLine, refresh } = this.ctx;

		const refsToDelete: { img: ImageLink; file: string; line: number }[] = [];
		const allTagKeys: string[] = [];
		for (const section of tagSections) {
			allTagKeys.push(...selection.getSelected(section));
		}
		for (const tagKey of allTagKeys) {
			const parsed = parseTagKey(tagKey);
			if (!parsed) continue;
			const img = resolveImageFromTagKey(parsed.keyPrefix, localImages());
			if (!img) continue;

			const expandedRefs = expandRefs(img);
			if (parsed.index < expandedRefs.length) {
				refsToDelete.push({ img, file: expandedRefs[parsed.index].file, line: expandedRefs[parsed.index].line });
			}
		}

		if (refsToDelete.length === 0) { new Notice("请先选择要删除的引用行"); return; }
		if (!(await confirmAsync(this.ctx.app, { message: `确定要删除 ${refsToDelete.length} 个引用行吗？` }))) return;

		const fileGroups = new Map<string, typeof refsToDelete>();
		for (const ref of refsToDelete) {
			if (!fileGroups.has(ref.file)) fileGroups.set(ref.file, []);
			fileGroups.get(ref.file)!.push(ref);
		}

		let successCount = 0;
		let failCount = 0;

		for (const [filePath, refs] of fileGroups) {
			const abstractFile = app.vault.getAbstractFileByPath(filePath);
			if (!(abstractFile instanceof TFile)) { failCount += refs.length; continue; }

			try {
				const content = await app.vault.read(abstractFile);
				const lines = content.split("\n");
				const linesToModify = new Map<number, string>();
				const linesToDelete = new Set<number>();
				for (const ref of refs) {
					if (ref.line > 0) {
						const lineIdx = ref.line - 1;
						if (lineIdx >= lines.length) continue;
						const originalLine = lines[lineIdx];
						if (originalLine !== undefined) {
							const cleaned = removeImageFromLine(originalLine, ref.img.pure);
							if (!cleaned.trim()) linesToDelete.add(lineIdx);
							else if (cleaned !== originalLine) linesToModify.set(lineIdx, cleaned);
						}
					} else {
						for (let i = 0; i < lines.length; i++) {
							if (lines[i].includes(ref.img.pure)) {
								const cleaned = removeImageFromLine(lines[i], ref.img.pure);
								if (!cleaned.trim()) linesToDelete.add(i);
								else if (cleaned !== lines[i]) linesToModify.set(i, cleaned);
								break;
							}
						}
					}
				}
				const newLines = lines.map((line, idx) => linesToModify.has(idx) ? linesToModify.get(idx)! : line)
					.filter((_, idx) => !linesToDelete.has(idx));
				if (newLines.length < lines.length || linesToModify.size > 0) {
					await app.vault.modify(abstractFile, newLines.join("\n"));
					successCount += linesToModify.size + linesToDelete.size;
				}
			} catch {
				failCount += refs.length;
			}
		}

		for (const section of tagSections) {
			selection.clear(section);
		}
		await refresh();
		this.showDeleteSummary("行", successCount, failCount);
	}

	/** 批量删除未找到图片（图片级选中：删除整条图片的所有引用行） */
	async batchDeleteNotFoundImages() {
		const { selection, localImages, removeImageFromMdFile, refresh } = this.ctx;
		const selectedKeys = selection.getSelected(SelectionSection.NotFound);
		const imageKeys = selectedKeys.filter(k => !k.includes("::"));
		if (imageKeys.length === 0) { new Notice("请先选择要删除的图片"); return; }
		const images = localImages().filter(img => img.found === false);
		const imageMap = new Map<string, ImageLink>();
		for (const img of images) imageMap.set(img.pure, img);
		if (!(await confirmAsync(this.ctx.app, { message: `确定要删除选中的 ${imageKeys.length} 个断链图片的所有引用行吗？` }))) return;

		let successCount = 0;
		let failCount = 0;
		for (const pure of imageKeys) {
			const img = imageMap.get(pure);
			if (!img) { failCount++; continue; }
			for (const fp of img.files) {
				selection.deselect(SelectionSection.NotFound, pure);
				try {
					const count = await removeImageFromMdFile(fp, [pure]);
					if (count > 0) successCount += count;
					else failCount++;
				} catch { failCount++; }
			}
		}

		await refresh();
		this.showDeleteSummary("行", successCount, failCount);
	}

	/** 批量删除未找到图片标签引用行（标签级选中：只删选中的行） */
	async batchDeleteNotFoundTags() {
		const { selection, localImages, app, removeImageFromLine, refresh } = this.ctx;
		const selectedKeys = selection.getSelected(SelectionSection.NotFound);
		const tagKeys = selectedKeys.filter(k => k.includes("::"));
		if (tagKeys.length === 0) { new Notice("请先选择要删除的引用标签"); return; }
		if (!(await confirmAsync(this.ctx.app, { message: `确定要删除选中的 ${tagKeys.length} 个引用行吗？` }))) return;

		const images = localImages().filter(img => img.found === false);

		// 收集按文件分组的行号
		const perFile = new Map<string, { pure: string; lines: Set<number> }>();
		for (const tagKey of tagKeys) {
			const parsed = parseTagKey(tagKey);
			if (!parsed) continue;
			const img = resolveImageFromTagKey(parsed.keyPrefix, images);
			if (!img) continue;
			const expandedRefs = expandRefs(img);
			if (parsed.index < expandedRefs.length) {
				const ref = expandedRefs[parsed.index];
				if (!perFile.has(ref.file)) perFile.set(ref.file, { pure: img.pure, lines: new Set() });
				perFile.get(ref.file)!.lines.add(ref.line);
			}
		}

		let successCount = 0;
		let failCount = 0;
		for (const [filePath, info] of perFile) {
			const abstractFile = app.vault.getAbstractFileByPath(filePath);
			if (!(abstractFile instanceof TFile)) { failCount += info.lines.size; continue; }
			try {
				const content = await app.vault.read(abstractFile);
				const contentLines = content.split("\n");
				const linesToDelete = new Set<number>();
				const linesToModify = new Map<number, string>();
				for (const lineNum of info.lines) {
					if (lineNum > 0) {
						const idx = lineNum - 1;
						const orig = contentLines[idx];
						if (orig !== undefined) {
							const cleaned = removeImageFromLine(orig, info.pure);
							if (!cleaned.trim()) linesToDelete.add(idx);
							else if (cleaned !== orig) linesToModify.set(idx, cleaned);
						}
					}
				}
				const newLines = contentLines.map((l, i) => linesToModify.has(i) ? linesToModify.get(i)! : l)
					.filter((_, i) => !linesToDelete.has(i));
				if (newLines.length !== contentLines.length || linesToModify.size > 0) {
					await app.vault.modify(abstractFile, newLines.join("\n"));
					successCount += linesToModify.size + linesToDelete.size;
				}
			} catch { failCount += info.lines.size; }
		}

		selection.clear(SelectionSection.NotFound);
		await refresh();
		this.showDeleteSummary("行", successCount, failCount);
	}

	/** 批量删除选中的云端图片（删除引用行 + 删除云端文件） */
	async batchDeleteCloudImages() {
		const { selection, localImages, cloudFiles, compareResult, selectedBed, deleteCloudFile } = this.ctx;
		if (selection.getCount(SelectionSection.CloudImages) === 0) { new Notice("请先选择要删除的图片"); return; }
		const selected = localImages().filter(img => selection.isSelected(SelectionSection.CloudImages, img.pure));
		if (selected.length === 0) { new Notice("无图片需要删除"); return; }

		const urlToCloudFile = new Map<string, CloudFile>();
		for (const cf of cloudFiles()) {
			if (cf.url) urlToCloudFile.set(cf.url, cf);
		}

		await this.batchDeleteWithCleanup({
			section: SelectionSection.CloudImages,
			confirmMessage: `确定要删除选中的 ${selected.length} 个云端图片吗？\n将同时删除笔记中的引用行和云端文件。`,
			items: selected.map(img => {
				const result = compareResult().get(img.pure);
				const bedType = result?.bedType || detectBedTypeFromUrl(img.pure) || selectedBed();
				return { key: img.pure, type: 'cloud' as const, path: img.pure, bedType };
			}),
			deleteReferences: true,
			onDeleteCloud: async (path: string, bedType: ImageBedType) => {
				const cloudFile = urlToCloudFile.get(path);
				const fileKey = cloudFile?.prefix || cloudFile?.name || extractFileName(path) || path;
				const deleteResult = await deleteCloudFile(fileKey, bedType);
				if (!deleteResult.success) {
					console.warn(`[PicLinker] 删除云端文件失败: ${path}`, deleteResult.error);
				}
				return deleteResult.success;
			},
		});
	}

	/** 批量删除空白文件夹 */
	async batchDeleteEmptyFolders(
		parseEmptyFolder: (folderPath: string) => { isCloud: boolean; path: string; bedType?: ImageBedType },
	) {
		const { selection, app, deleteCloudFile, refresh } = this.ctx;
		if (selection.getCount(SelectionSection.EmptyFolders) === 0) { new Notice("请先选择要删除的文件夹"); return; }
		if (!(await confirmAsync(this.ctx.app, { message: `确定要删除选中的 ${selection.getCount(SelectionSection.EmptyFolders)} 个空白文件夹吗？` }))) return;

		let successCount = 0;
		let failCount = 0;
		const failedFolders: string[] = [];
		for (const folderPath of selection.getSelected(SelectionSection.EmptyFolders)) {
			try {
				const info = parseEmptyFolder(folderPath);
				if (info.isCloud && info.bedType) {
					const result = await deleteCloudFile(info.path, info.bedType);
					if (result.success) successCount++;
					else { failCount++; failedFolders.push(folderPath); }
				} else {
					try {
						await app.vault.adapter.rmdir(folderPath, false);
						successCount++;
					} catch {
						failCount++; failedFolders.push(folderPath);
					}
				}
			} catch {
				failCount++; failedFolders.push(folderPath);
			}
		}

		selection.clear(SelectionSection.EmptyFolders);
		await refresh();
		const parts: string[] = [];
		if (successCount > 0) parts.push(`${successCount} 个已删除`);
		if (failCount > 0) parts.push(`${failCount} 个删除失败`);
		new Notice(`删除完成：${parts.join("，")}`);
		// 汇总失败信息，避免循环内逐个 Notice 刷屏
		if (failedFolders.length > 0) {
			const names = failedFolders.map(f => f.split("/").pop() || f);
			console.warn(`[PicLinker] ${failCount} 个文件夹删除失败:`, failedFolders);
			new Notice(`${failCount} 个文件夹删除失败（如非空文件夹）：${names.join("、")}`, 8000);
		}
}
}
