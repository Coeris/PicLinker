/**
 * ItemRenderer — 通用条目渲染
 * 从 PicLinkerView 提取：renderLocalItem / renderCloudItem / renderTags /
 * renderCloudReferencedItem / renderNotFoundItem / renderLocalUnrefItem / addThumbnail
 */

import { Notice, TFile, App } from "obsidian";
import { ImageLink, CloudFile, ImageBedType, LazyRenderableElement } from "../../types";
import { extractFileName } from "../../comparator/CloudComparator";
import { IMAGE_EXTENSIONS } from "../../parser/LinkParser";
import { detectBedTypeFromUrl } from "../../icons";
import { showImagePreview } from "../ImagePreview";
import { SelectionManager, SelectionSection } from "../SelectionManager";
import { formatDisplayPath, getFileExtension, expandRefs, setSafeHTML } from "../utils/ViewUtils";
import { confirmAsync } from "../../utils/DangerConfirmModal";
import { onAsyncClick } from "../../utils/AsyncHandler";

export interface ItemRenderContext {
	app: App;
	selection: SelectionManager;
	compareResult: Map<string, { exists: boolean; url?: string; bedType?: ImageBedType }>;
	cloudFiles: CloudFile[];
	/** 复制图片路径 */
	copyImagePath: (img: ImageLink) => void;
	/** 跳转到文件引用位置 */
	jumpToFile: (img: ImageLink, filePath: string, lineNumber?: number) => void;
	/** 更新本地图片区域操作按钮 */
	updateLocalActions: () => void;
	/** 更新未引用图片区域操作按钮 */
	updateLocalUnrefActions: () => void;
	/** 更新目录复选框状态 */
	updateParentDirCheckboxes: () => void;
	/** 更新删除选中按钮 */
	updateDeleteSelectedBtn?: () => void;
	/** 获取 CloudFiles 的删除函数 */
	deleteCloudFile: (fileKey: string, bedType: ImageBedType) => Promise<{ success: boolean; error?: string }>;
	/** 清理引用行 */
	removeImageFromMdFile: (filePath: string, urls: string[]) => Promise<number>;
	/** 清理所有 MD 文件中的引用 */
	removeImageFromAllMdFiles: (urls: string[]) => Promise<number>;
	/** 刷新视图 */
	refresh: () => Promise<void>;
	/** 是否显示完整路径 */
	showPath: boolean;
	/** 设置“当前条目”（键盘 ↑/↓ 与鼠标点击共用，保证唯一高亮行；不改变勾选选区） */
	setCurrentItem: (item: HTMLElement) => void;
	/** 获取本地未引用文件删除回调（由调用方提供） */
	deleteLocalUnrefFile?: (file: TFile) => Promise<void>;
}

export class ItemRenderer {
	private ctx: ItemRenderContext;

	constructor(ctx: ItemRenderContext) {
		this.ctx = ctx;
	}

	/** 判断容器是否处于子目录（非顶层）层级：
	 *  其所在的 .pic-dir-content 之上仍存在 .pic-dir-content 祖先。
	 *  用于为子目录直接文件追加分组视觉标识（不依赖 styles.css 新增样式）。 */
	private isSubdirLevel(container: HTMLElement): boolean {
		const dc = container.closest(".pic-dir-content");
		if (!dc) return false;
		return !!(dc.parentElement && dc.parentElement.closest(".pic-dir-content"));
	}

	/** 为子目录层级的条目追加轻微分组视觉标识（左侧内阴影引导线）。
	 *  复用主题变量，不使用新增 CSS，且不影响 :hover 背景与折叠/点击逻辑。 */
	private applySubdirGrouping(item: HTMLElement, container: HTMLElement): void {
		// 子目录层级不再加 inset 左边阴影引导线：现在每条 item 自身带完整边框，
		// 再加 inset 左阴影会与 item 左框叠加成更粗的灰边（"多个边框合起来"）。
		// 层级仅靠文字缩进（render 时传入的 indent）体现，此处无需额外描边。
		void item;
		void container;
	}

	/** 渲染本地引用图片条目 */
	renderLocalItem(container: HTMLElement, img: ImageLink, selectedSet?: Set<string>) {
		const { selection, app, copyImagePath, updateLocalActions, updateParentDirCheckboxes } = this.ctx;
		const item = container.createDiv({ cls: "pic-item", attr: { tabindex: "0" } }) as LazyRenderableElement;
		this.applySubdirGrouping(item, container);

		if (selectedSet) {
			item.addEventListener("click", (e) => {
				const target = e.target as HTMLElement;
				if (target.closest("input, img, .pic-file-tag, button")) return;
				// 点击行 = 切换勾选 + 设为当前焦点行（保证后续 ↑/↓ 从此处开始）
				this.ctx.setCurrentItem(item);
				const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
				if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
			});
		}

		item.addEventListener("dblclick", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest("input, img, .pic-file-tag, button")) return;
			e.stopPropagation();
			const fileName = extractFileName(img.resolvedPath || img.pure);
			if (fileName) {
				navigator.clipboard.writeText(fileName).then(
					() => new Notice(`已复制文件名: ${fileName}`),
					() => new Notice("复制失败"),
				);
			}
		});

		if (selectedSet) {
			const checkbox = item.createEl("input", {
				type: "checkbox",
				cls: "pic-cloud-checkbox",
			});
			checkbox.checked = selectedSet.has(img.pure);
			checkbox.addEventListener("click", (e) => e.stopPropagation());
			checkbox.addEventListener("change", (e) => {
				e.stopPropagation();
				if (checkbox.checked) {
					selectedSet.add(img.pure);
					selection.select(SelectionSection.LocalImages, [img.pure]);
				} else {
					selectedSet.delete(img.pure);
					selection.deselect(SelectionSection.LocalImages, img.pure);
				}
				item.toggleClass("pic-item--selected", checkbox.checked);
				updateLocalActions();
				updateParentDirCheckboxes();
			});
		}

		const resolvedPath = img.resolvedPath || img.pure;
		const ext = resolvedPath.split(".").pop()?.toLowerCase() || "";
		const isImage = IMAGE_EXTENSIONS.has(ext);
		if (isImage) {
			let thumbSrc: string | undefined;
			if (img.type === "local") {
				const file = app.vault.getAbstractFileByPath(resolvedPath);
				if (file instanceof TFile) {
					thumbSrc = app.vault.getResourcePath(file);
				}
			} else {
				thumbSrc = img.pure;
			}
			if (thumbSrc) {
				const thumb = item.createEl("img", {
					cls: "pic-thumb pic-thumb-clickable",
					attr: { src: thumbSrc, loading: "lazy" },
				});
				thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); });
				thumb.addEventListener("click", (e) => {
					e.stopPropagation();
					showImagePreview(thumbSrc);
				});
			}
		}

		let displayPath = img.resolvedPath || img.pure;
		if (img.type !== "local") {
			try { displayPath = new URL(img.pure).pathname.slice(1); } catch { /* keep original */ }
		}
		const shortPath = formatDisplayPath(displayPath);
		const pathSpan = item.createSpan({ cls: "pic-path", text: shortPath, title: "双击复制完整路径" });
		pathSpan.classList.add("clickable");
		item.dataset.purePath = img.pure;

		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			copyImagePath(img);
		});

		this.renderTags(item, img, SelectionSection.LocalTags, img.pure);

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除文件并清理引用" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			if (!(await confirmAsync(this.ctx.app, { message: `确定要删除 "${img.pure}" 吗？\n将同时清理笔记中的引用行。` }))) return;
			for (const fp of img.files) {
				await this.ctx.removeImageFromMdFile(fp, [img.pure]);
			}
			const filePath = img.resolvedPath || img.pure;
			const file = app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				await app.fileManager.trashFile(file);
				new Notice(`已删除: ${extractFileName(filePath) || filePath}`);
			}
			selection.deselect(SelectionSection.LocalImages, img.pure);
			for (const tagKey of selection.getSelected(SelectionSection.LocalTags)) {
				if (tagKey.startsWith(img.pure + "::")) selection.deselect(SelectionSection.LocalTags, tagKey);
			}
			await this.ctx.refresh();
		}));
	}

	/** 渲染引用标签（多标签时换行而非横向溢出） */
	renderTags(container: HTMLElement, img: ImageLink, section: SelectionSection, keyPrefix: string): void {
		const { selection, jumpToFile } = this.ctx;
		const expandedRefs = expandRefs(img);
		if (expandedRefs.length === 0) return;
		// 用 .pic-tags 包裹容器承载多标签，借助 inline flex-wrap 在标签过多时换行，
		// 避免 .pic-item 的 overflow:hidden 直接裁剪标签造成溢出无法查看。
		const tagsWrap = container.createDiv({ cls: "pic-tags" });
		tagsWrap.setCssStyles({ display: "flex", flexWrap: "wrap", gap: "4px", minWidth: "0" });
		for (let i = 0; i < expandedRefs.length; i++) {
			const ref = expandedRefs[i];
			const tagKey = `${keyPrefix}::${i}`;
			const isSelected = selection.isSelected(section, tagKey);
			const fileName = ref.file.split("/").pop() || ref.file;
			const tagText = ref.line > 0 ? `${fileName}:${ref.line}` : fileName;
			const tag = container.createSpan({
				cls: `pic-file-tag${isSelected ? " pic-file-tag-focus" : ""}`,
				text: tagText,
			});
			tag.dataset.tagRef = tagText;
			tag.title = isSelected ? `再次单击跳转到 ${ref.file}:${ref.line}` : `单击选中`;
			tag.classList.add("clickable");
			tagsWrap.appendChild(tag);
			tag.addEventListener("click", (e) => {
				e.stopPropagation();
				if (selection.isSelected(section, tagKey)) {
					jumpToFile(img, ref.file, ref.line);
				} else {
					selection.select(section, [tagKey]);
					tag.classList.add("pic-file-tag-focus");
					tag.title = `再次单击跳转到 ${ref.file}:${ref.line}`;
				}
			});
		}
	}

	/** 云端引用图片项 */
	renderCloudReferencedItem(container: HTMLElement, img: ImageLink, selectedSet?: Set<string>) {
		const { selection, copyImagePath, deleteCloudFile, removeImageFromMdFile, updateLocalActions, updateParentDirCheckboxes } = this.ctx;
		const item = container.createDiv({ cls: "pic-item", attr: { tabindex: "0" } }) as LazyRenderableElement;
		this.applySubdirGrouping(item, container);

		if (selectedSet) {
			item.addEventListener("click", (e) => {
				const target = e.target as HTMLElement;
				if (target.closest("input, img, button")) return;
				// 点击行 = 切换勾选 + 设为当前焦点行（保证后续 ↑/↓ 从此处开始）
				this.ctx.setCurrentItem(item);
				const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
				if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
			});
		}

		item.addEventListener("dblclick", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest("input, img, button")) return;
			e.stopPropagation();
			const fileName = extractFileName(img.pure);
			if (fileName) {
				navigator.clipboard.writeText(fileName).then(
					() => new Notice(`已复制文件名: ${fileName}`),
					() => new Notice("复制失败"),
				);
			}
		});

		if (selectedSet) {
			const checkbox = item.createEl("input", {
				type: "checkbox",
				cls: "pic-cloud-checkbox",
			});
			checkbox.checked = selectedSet.has(img.pure);
			checkbox.addEventListener("click", (e) => e.stopPropagation());
			checkbox.addEventListener("change", (e) => {
				e.stopPropagation();
				if (checkbox.checked) {
					selectedSet.add(img.pure);
					selection.select(SelectionSection.CloudImages, [img.pure]);
				} else {
					selectedSet.delete(img.pure);
					selection.deselect(SelectionSection.CloudImages, img.pure);
				}
				item.toggleClass("pic-item--selected", checkbox.checked);
				updateLocalActions();
				updateParentDirCheckboxes();
			});
		}

		let thumbSrc: string | undefined;
		try { thumbSrc = img.pure; } catch { /* ignore */ }
		if (thumbSrc) {
			const thumb = item.createEl("img", {
				cls: "pic-thumb pic-thumb-clickable",
				attr: { src: thumbSrc, loading: "lazy" },
			});
			thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); });
			thumb.addEventListener("click", (e) => {
				e.stopPropagation();
				showImagePreview(thumbSrc);
			});
		}

		let displayPath: string;
		try { displayPath = new URL(img.pure).pathname.slice(1); } catch { displayPath = img.pure; }
		const shortPath = formatDisplayPath(displayPath);
		const pathSpan = item.createSpan({ cls: "pic-path", text: shortPath, title: "双击复制完整路径" });
		pathSpan.classList.add("clickable");
		item.dataset.purePath = img.pure;

		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			copyImagePath(img);
		});

		this.renderTags(item, img, SelectionSection.CloudTags, img.pure);

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除云端文件并清理引用" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			if (!(await confirmAsync(this.ctx.app, { message: `确定要删除 "${img.pure}" 吗？\n将同时清理笔记中的引用行。` }))) return;
			for (const fp of img.files) {
				await removeImageFromMdFile(fp, [img.pure]);
			}
			const bedType: ImageBedType | undefined = detectBedTypeFromUrl(img.pure) ?? undefined;
			const cloudFile = this.ctx.cloudFiles.find(cf => cf.url === img.pure);
			const fileKey = cloudFile?.prefix || cloudFile?.name || extractFileName(img.pure) || img.pure;
			if (bedType) {
				await deleteCloudFile(fileKey, bedType);
			} else {
				new Notice("无法识别图床类型，跳过云端文件删除");
			}
			new Notice(`已删除: ${extractFileName(img.pure) || img.pure}`);
			selection.deselect(SelectionSection.CloudImages, img.pure);
			await this.ctx.refresh();
		}));
	}

	/** 未找到图片项 */
	renderNotFoundItem(container: HTMLElement, img: ImageLink, selectedSet?: Set<string>) {
		const { selection, removeImageFromMdFile, updateLocalActions, updateParentDirCheckboxes, refresh } = this.ctx;
		const item = container.createDiv({ cls: "pic-item", attr: { tabindex: "0" } }) as LazyRenderableElement;
		this.applySubdirGrouping(item, container);

		const isChecked = selectedSet ? selectedSet.has(img.pure) : selection.isSelected(SelectionSection.NotFound, img.pure);
		const checkbox = item.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
		checkbox.checked = isChecked;
		checkbox.addEventListener("click", (e) => e.stopPropagation());
		checkbox.addEventListener("change", (e) => {
			e.stopPropagation();
			if (checkbox.checked) {
				if (selectedSet) selectedSet.add(img.pure);
				else selection.select(SelectionSection.NotFound, [img.pure]);
			} else {
				if (selectedSet) selectedSet.delete(img.pure);
				else selection.deselect(SelectionSection.NotFound, img.pure);
			}
			item.toggleClass("pic-item--selected", checkbox.checked);
			updateLocalActions();
			updateParentDirCheckboxes();
		});

		item.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest(".pic-file-tag, button, input")) return;
			// 点击行 = 切换勾选 + 设为当前焦点行（保证后续 ↑/↓ 从此处开始）
			this.ctx.setCurrentItem(item);
			const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
			if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
		});

		item.addEventListener("dblclick", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest(".pic-file-tag, button, input")) return;
			e.stopPropagation();
			const fileName = extractFileName(img.resolvedPath || img.pure);
			if (fileName) {
				navigator.clipboard.writeText(fileName).then(
					() => new Notice(`已复制文件名: ${fileName}`),
					() => new Notice("复制失败"),
				);
			}
		});

		const notFoundIcon = `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--text-danger, #EF4444)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;
		const iconWrapper = item.createSpan();
		setSafeHTML(iconWrapper, notFoundIcon);

		const displayPath = img.resolvedPath || img.pure;
		const shortPath = formatDisplayPath(displayPath);
		const pathSpan = item.createSpan({ cls: "pic-path", text: shortPath, title: displayPath });
		pathSpan.classList.add("clickable");
		item.dataset.purePath = img.pure;
		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			navigator.clipboard.writeText(displayPath).then(
				() => new Notice(`路径已复制`),
				() => new Notice("复制失败"),
			);
		});

		this.renderTags(item, img, SelectionSection.NotFound, img.pure);

		// 行内删除按钮
		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除该图片的所有引用行" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			if (img.files.length === 0) { new Notice("没有找到引用该图片的笔记"); return; }
			const fileList = img.files.map(f => f.split("/").pop() || f).join("、");
			if (!(await confirmAsync(this.ctx.app, { message: `确定要删除 "${displayPath}" 在 ${img.files.length} 个笔记（${fileList}）中的所有引用行吗？` }))) return;
			let successCount = 0;
			let failCount = 0;
			for (const fp of img.files) {
				try {
					const count = await removeImageFromMdFile(fp, [img.pure]);
					if (count > 0) successCount += count;
					else failCount++;
				} catch { failCount++; }
			}
			const parts: string[] = [];
			if (successCount > 0) parts.push(`${successCount} 行已删除`);
			if (failCount > 0) parts.push(`${failCount} 行失败`);
			new Notice(`删除完成：${parts.join("，")}`);
			await refresh();
		}));
	}

	/** 云端文件项 */
	renderCloudItem(container: HTMLElement, file: CloudFile, indent: string = "") {
		const { selection, deleteCloudFile, removeImageFromAllMdFiles, updateLocalUnrefActions, updateLocalActions, updateParentDirCheckboxes, updateDeleteSelectedBtn, showPath } = this.ctx;
		const item = container.createDiv({ cls: "pic-item", attr: { tabindex: "0" } }) as LazyRenderableElement;
		this.applySubdirGrouping(item, container);
		const fileKey = file.prefix || file.name;

		item.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest("input, img, .pic-file-tag, button")) return;
			// 点击行 = 切换勾选 + 设为当前焦点行（保证后续 ↑/↓ 从此处开始）
			this.ctx.setCurrentItem(item);
			const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
			if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
		});

		item.addEventListener("dblclick", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest("input, img, .pic-file-tag, button")) return;
			e.stopPropagation();
			const fileName = extractFileName(file.name);
			if (fileName) {
				navigator.clipboard.writeText(fileName).then(
					() => new Notice(`已复制文件名: ${fileName}`),
					() => new Notice("复制失败"),
				);
			}
		});

		const checkbox = item.createEl("input", {
			type: "checkbox",
			cls: "pic-cloud-checkbox",
		});
		checkbox.checked = selection.isSelected(SelectionSection.CloudFiles, fileKey);
		checkbox.addEventListener("click", (e) => e.stopPropagation());
		checkbox.addEventListener("change", (e) => {
			e.stopPropagation();
			if (checkbox.checked) {
				selection.select(SelectionSection.CloudFiles, [fileKey]);
			} else {
				selection.deselect(SelectionSection.CloudFiles, fileKey);
			}
			item.toggleClass("pic-item--selected", checkbox.checked);
			updateDeleteSelectedBtn?.();
			updateLocalUnrefActions();
			updateLocalActions();
			updateParentDirCheckboxes();
		});

		const cloudBedType = detectBedTypeFromUrl(file.url);
		const ext = getFileExtension(file.name);
		const isImage = IMAGE_EXTENSIONS.has(ext);

		if (isImage) {
			const thumb = item.createEl("img", {
				cls: "pic-thumb pic-thumb-clickable",
				attr: { src: file.url, loading: "lazy" },
			});
			thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); });
			thumb.addEventListener("click", (e) => {
				e.stopPropagation();
				showImagePreview(file.url);
			});
		} else {
			item.createSpan({ cls: "pic-cloud-file-icon", text: "📄" });
		}

		const cloudDisplayName = showPath ? (file.prefix || file.name) : (extractFileName(file.name) || file.name);
		const pathSpan = item.createSpan({ cls: "pic-path", text: `${indent}${cloudDisplayName}` });
		pathSpan.classList.add("clickable");
		item.dataset.purePath = fileKey;

		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			navigator.clipboard.writeText(file.url).then(
				() => new Notice("路径已复制"),
				() => new Notice("复制失败"),
			);
		});

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除云端文件并清理引用" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			if (!(await confirmAsync(this.ctx.app, { message: `确定要删除云端文件 "${file.name}" 吗？\n将同时清理笔记中的引用行。` }))) return;
			if (!cloudBedType) {
				new Notice("云端文件未删除（无法识别图床类型）");
				return;
			}
			await deleteCloudFile(file.prefix || file.name, cloudBedType);
			await removeImageFromAllMdFiles([file.url]);
			new Notice(`已删除: ${file.name}`);
			await this.ctx.refresh();
		}));
	}

	/** 渲染本地未引用图片项 */
	renderLocalUnrefItem(container: HTMLElement, file: TFile) {
		const { selection, app, deleteLocalUnrefFile, updateLocalUnrefActions, updateLocalActions, updateParentDirCheckboxes } = this.ctx;
		const item = container.createDiv({ cls: "pic-item", attr: { tabindex: "0" } }) as LazyRenderableElement;
		this.applySubdirGrouping(item, container);

		item.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest("input, img, .pic-file-tag, button")) return;
			// 点击行 = 切换勾选 + 设为当前焦点行（保证后续 ↑/↓ 从此处开始）
			this.ctx.setCurrentItem(item);
			const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
			if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
		});

		item.addEventListener("dblclick", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest("input, img, .pic-file-tag, button")) return;
			e.stopPropagation();
			navigator.clipboard.writeText(file.name).then(
				() => new Notice(`已复制文件名: ${file.name}`),
				() => new Notice("复制失败"),
			);
		});

		const checkbox = item.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
		checkbox.checked = selection.isSelected(SelectionSection.LocalUnref, file.path);
		checkbox.addEventListener("click", (e) => e.stopPropagation());
		checkbox.addEventListener("change", (e) => {
			e.stopPropagation();
			if (checkbox.checked) selection.select(SelectionSection.LocalUnref, [file.path]);
			else selection.deselect(SelectionSection.LocalUnref, file.path);
			item.toggleClass("pic-item--selected", checkbox.checked);
			updateLocalUnrefActions();
			updateLocalActions();
			updateParentDirCheckboxes();
		});

		const ext = file.extension.toLowerCase();
		if (IMAGE_EXTENSIONS.has(ext)) {
			const thumbSrc = app.vault.getResourcePath(file);
			const thumb = item.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: thumbSrc, loading: "lazy" } });
			thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); });
			thumb.addEventListener("click", (e) => {
				e.stopPropagation();
				showImagePreview(thumbSrc);
			});
		}
		const shortName = formatDisplayPath(file.path);
		const pathSpan = item.createSpan({ cls: "pic-path", text: shortName });
		pathSpan.classList.add("clickable");
		item.dataset.purePath = file.path;
		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			navigator.clipboard.writeText(file.path).then(
				() => new Notice(`路径已复制`),
				() => new Notice("复制失败"),
			);
		});

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "移入回收站" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			if (!(await confirmAsync(this.ctx.app, { message: `确定要将 "${file.name}" 移入回收站吗？` }))) return;
			if (deleteLocalUnrefFile) {
				await deleteLocalUnrefFile(file);
			} else {
				await app.fileManager.trashFile(file);
				new Notice(`已移入回收站: ${file.name}`);
			}
			await this.ctx.refresh();
		}));
	}

	/** 添加缩略图 */
	addThumbnail(item: HTMLElement, img: ImageLink) {
		const { app } = this.ctx;
		const resolvedPath = img.resolvedPath || img.pure;
		const ext = resolvedPath.split(".").pop()?.toLowerCase() || "";
		const isImage = IMAGE_EXTENSIONS.has(ext);
		if (!isImage) return;
		let thumbSrc: string | undefined;
		if (img.type === "local") {
			let file = app.vault.getAbstractFileByPath(resolvedPath);
			if (!(file instanceof TFile)) {
				const fileName = extractFileName(resolvedPath);
				if (fileName) {
					file = app.vault.getFiles().find(f => f.name === fileName && f.path === resolvedPath) ?? null;
					if (!file) file = app.vault.getFiles().find(f => f.name === fileName) ?? null;
				}
			}
			if (file instanceof TFile) {
				thumbSrc = app.vault.getResourcePath(file);
			}
		} else {
			thumbSrc = img.pure;
		}
		if (thumbSrc) {
			const thumb = item.createEl("img", {
				cls: "pic-thumb pic-thumb-clickable",
				attr: { src: thumbSrc, loading: "lazy" },
			});
			thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); });
			thumb.addEventListener("click", (e) => {
				e.stopPropagation();
				showImagePreview(thumbSrc);
			});
		}
	}
}
