/**
 * BatchOperations — 批量复制/下载操作
 * 从 PicLinkerView 提取：genericBatchCopy / genericBatchDownload / 6个 wrapper
 */

import { Notice, requestUrl } from "obsidian";
import { SelectionManager, SelectionSection } from "../SelectionManager";

export interface BatchCopyContext {
	selection: SelectionManager;
}

export class BatchOperations {
	private ctx: BatchCopyContext;

	constructor(ctx: BatchCopyContext) {
		this.ctx = ctx;
	}

	/** 通用批量复制到剪贴板 */
	async genericBatchCopy<T>(
		section: SelectionSection,
		items: T[],
		getKey: (item: T) => string,
		getUrl: (item: T) => string,
		getName: (item: T) => string,
		format: "markdown" | "html",
	) {
		const { selection } = this.ctx;
		const selected = items.filter(item => selection.isSelected(section, getKey(item)));
		if (selected.length === 0) { new Notice("请先选择要复制的项目"); return; }
		const lines = selected.map(item => {
			const name = getName(item);
			const url = getUrl(item);
			return format === "markdown" ? `![${name}](${url})` : `<img src="${url}" alt="${name}">`;
		});
		await navigator.clipboard.writeText(lines.join("\n"));
		new Notice(`已复制 ${lines.length} 个 ${format === "markdown" ? "Markdown" : "HTML"} 链接`);
	}

	/** 通用批量下载 */
	async genericBatchDownload<T>(
		section: SelectionSection,
		items: T[],
		getKey: (item: T) => string,
		getUrl: (item: T) => string,
		getName: (item: T) => string,
		onAfter?: () => void,
	) {
		const { selection } = this.ctx;
		const selected = items.filter(item => selection.isSelected(section, getKey(item)));
		if (selected.length === 0) { new Notice("请先选择要下载的文件"); return; }
		let success = 0;
		let fail = 0;
		for (const item of selected) {
			const imageUrl = getUrl(item);
			const fileName = getName(item) || "image";
			try {
				const resp = await requestUrl(imageUrl);
				if (resp.status >= 400) {
					fail++;
					continue;
				}
				const blob = new Blob([resp.arrayBuffer]);
				const blobUrl = URL.createObjectURL(blob);
				const a = activeDocument.createElement("a");
				a.href = blobUrl;
				a.download = fileName;
				activeDocument.body.appendChild(a);
				a.click();
				activeDocument.body.removeChild(a);
				URL.revokeObjectURL(blobUrl);
				success++;
			} catch {
				fail++;
			}
		}
		new Notice(`下载完成：成功 ${success} 个，失败 ${fail} 个`);
		selection.clear(section);
		onAfter?.();
	}
}
