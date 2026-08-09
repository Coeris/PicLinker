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
import { formatDisplayPath, getFileExtension, expandRefs, setSafeHTML, createThumbBrokenPlaceholder, withRootPrefix, imgSelectKey, type TagRef } from "../utils/ViewUtils";
import { confirmAsync } from "../../utils/DangerConfirmModal";
import { onAsyncClick } from "../../utils/AsyncHandler";

export interface ItemRenderContext {
	app: App;
	selection: SelectionManager;
	compareResult: Map<string, { exists: boolean; url?: string; bedType?: ImageBedType }>;
	getCloudFiles: () => CloudFile[];
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
	/** 清理引用行（按图片纯路径，整文件清理） */
	removeImageFromMdFile: (filePath: string, urls: string[]) => Promise<number>;
	/** 清理单行中的图片引用（按行号精确删除，返回清理后的行内容） */
	removeImageFromLine: (lineContent: string, pure: string) => string;
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
		const { selection, app, copyImagePath, updateLocalActions, updateParentDirCheckboxes, showPath } = this.ctx;
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
					() => new Notice(`已复制图片名「${fileName}」`),
					() => new Notice("PicLinker：复制失败，请重试"),
				);
			}
		});

		if (selectedSet) {
			const imgKey = imgSelectKey(img);
			const checkbox = item.createEl("input", {
				type: "checkbox",
				cls: "pic-cloud-checkbox",
			});
			checkbox.checked = selectedSet.has(imgKey);
			checkbox.addEventListener("click", (e) => e.stopPropagation());
			checkbox.addEventListener("change", (e) => {
				e.stopPropagation();
				if (checkbox.checked) {
					selectedSet.add(imgKey);
					selection.select(SelectionSection.LocalImages, [imgKey]);
				} else {
					selectedSet.delete(imgKey);
					selection.deselect(SelectionSection.LocalImages, imgKey);
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
				thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); createThumbBrokenPlaceholder(item); });
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
		// showPath 关 = 仅文件名，开 = 完整相对路径；根目录文件补「根目录/」前缀
		const showText = showPath ? withRootPrefix(formatDisplayPath(displayPath)) : withRootPrefix(extractFileName(displayPath) || displayPath);
		const pathSpan = item.createSpan({ cls: "pic-path", text: showText, title: showText });
		pathSpan.classList.add("clickable");
		item.dataset.purePath = imgSelectKey(img);

		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			copyImagePath(img);
		});

		this.renderTags(item, img, SelectionSection.LocalTags, imgSelectKey(img));

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除图片并清理引用行" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			const delKey = imgSelectKey(img);
			if (!(await confirmAsync(this.ctx.app, { message: `确定要删除「${delKey}」吗？\n将同时清理笔记中的引用行。`, title: "删除图片" }))) return;
			for (const fp of img.files) {
				await this.ctx.removeImageFromMdFile(fp, [img.pure]);
			}
			const filePath = delKey;
			const file = app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				await app.fileManager.trashFile(file);
				new Notice(`已删除「${extractFileName(filePath) || filePath}」`);
			}
			selection.deselect(SelectionSection.LocalImages, delKey);
			for (const tagKey of selection.getSelected(SelectionSection.LocalTags)) {
				if (tagKey.startsWith(delKey + "::")) selection.deselect(SelectionSection.LocalTags, tagKey);
			}
			await this.ctx.refresh();
		}));
	}

	/** 渲染引用标签（多标签时换行而非横向溢出） */
	renderTags(container: HTMLElement, img: ImageLink, section: SelectionSection, keyPrefix: string): void {
		const { selection, jumpToFile, updateLocalActions } = this.ctx;
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
					updateLocalActions();
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
					() => new Notice(`已复制图片名「${fileName}」`),
					() => new Notice("PicLinker：复制失败，请重试"),
				);
			}
		});

		if (selectedSet) {
			const imgKey = imgSelectKey(img);
			const checkbox = item.createEl("input", {
				type: "checkbox",
				cls: "pic-cloud-checkbox",
			});
			checkbox.checked = selectedSet.has(imgKey);
			checkbox.addEventListener("click", (e) => e.stopPropagation());
			checkbox.addEventListener("change", (e) => {
				e.stopPropagation();
				if (checkbox.checked) {
					selectedSet.add(imgKey);
					selection.select(SelectionSection.CloudImages, [imgKey]);
				} else {
					selectedSet.delete(imgKey);
					selection.deselect(SelectionSection.CloudImages, imgKey);
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
			thumb.addEventListener("error", () => {
				thumb.setCssStyles({ display: "none" });
				createThumbBrokenPlaceholder(item);
			});
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
		item.dataset.purePath = imgSelectKey(img);

		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			copyImagePath(img);
		});

		this.renderTags(item, img, SelectionSection.CloudTags, imgSelectKey(img));

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除云端图片并清理引用行" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			const delKey = imgSelectKey(img);
			if (!(await confirmAsync(this.ctx.app, { message: `确定要删除「${delKey}」吗？\n将同时清理笔记中的引用行。`, title: "删除图片" }))) return;

			// 先识别图床类型：识别不出则直接取消，避免「引用已清理但云端图还在」的脏态
			const bedType: ImageBedType | undefined = detectBedTypeFromUrl(img.pure) ?? undefined;
			if (!bedType) {
				new Notice("无法识别图床类型，已取消删除（笔记引用未清理）");
				return;
			}
			const cloudFile = this.ctx.getCloudFiles().find(cf => cf.url === img.pure);
			const fileKey = cloudFile?.prefix || cloudFile?.name || extractFileName(img.pure) || img.pure;

			// 先删云端图，确认成功后再清理笔记引用（顺序反转，杜绝脏态）
			const result = await deleteCloudFile(fileKey, bedType);
			if (!result.success) {
				new Notice(`云端图片删除失败，已取消清理引用：${result.error ?? "未知错误"}`);
				return;
			}
			for (const fp of img.files) {
				await removeImageFromMdFile(fp, [img.pure]);
			}
			new Notice(`已删除「${extractFileName(delKey) || delKey}」`);
			selection.deselect(SelectionSection.CloudImages, delKey);
			await this.ctx.refresh();
		}));
	}

	/** 未找到图片项 */
	/** 渲染单个未找到图片的引用行：每个引用行 = 一张图在某一笔记的某一行
	 *  与原 renderNotFoundItem 不同：精确到 (img, file, line)，不再"一图一行"折叠所有引用
	 */
	renderNotFoundRefItem(container: HTMLElement, img: ImageLink, ref: TagRef) {
		const { selection, removeImageFromMdFile, removeImageFromLine, updateLocalActions, updateParentDirCheckboxes, refresh, app, jumpToFile, showPath } = this.ctx;
		const item = container.createDiv({ cls: "pic-item", attr: { tabindex: "0" } }) as LazyRenderableElement;
		this.applySubdirGrouping(item, container);

		// 行级 key：与 batchDeleteNotFoundTags 兼容的 ::index 协议
		// 通过 expandRefs 找到当前 ref 的索引（按 fileLines 顺序）
		const expandedRefs = expandRefs(img);
		const refIndex = expandedRefs.findIndex(r => r.file === ref.file && r.line === ref.line);
		const itemKey = refIndex >= 0 ? `${img.pure}::${refIndex}` : `${img.pure}::${ref.file}::${ref.line}`;
		const isChecked = selection.isSelected(SelectionSection.NotFoundRefs, itemKey);
		const checkbox = item.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
		checkbox.checked = isChecked;
		checkbox.addEventListener("click", (e) => e.stopPropagation());
		checkbox.addEventListener("change", (e) => {
			e.stopPropagation();
			if (checkbox.checked) selection.select(SelectionSection.NotFoundRefs, [itemKey]);
			else selection.deselect(SelectionSection.NotFoundRefs, itemKey);
			item.toggleClass("pic-item--selected", checkbox.checked);
			// 冒泡自定义事件：让外层分组（未找到区分组）能同步自身 checkbox 状态
			item.dispatchEvent(new CustomEvent("pic-notfound-refitem-change", { bubbles: true }));
			updateLocalActions();
			updateParentDirCheckboxes();
		});
		// 组头全选/全清时，子项 checkbox 反向同步（createGroupCheckbox 只同步组头自身，不碰子项 DOM）
		selection.onChange((changedSection: SelectionSection) => {
			if (changedSection !== SelectionSection.NotFoundRefs) return;
			const sel = selection.isSelected(SelectionSection.NotFoundRefs, itemKey);
			checkbox.checked = sel;
			item.toggleClass("pic-item--selected", sel);
		});

		item.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest(".pic-file-tag, button, input")) return;
			this.ctx.setCurrentItem(item);
			const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
			if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
		});

		item.addEventListener("dblclick", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest(".pic-file-tag, button, input")) return;
			e.stopPropagation();
			// 双击行 = 跳转到该笔记该行
			jumpToFile(img, ref.file, ref.line);
		});

		const notFoundIcon = `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--pic-error)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;
		const iconWrapper = item.createSpan();
		setSafeHTML(iconWrapper, notFoundIcon);

		const rawPath = img.resolvedPath || img.pure;
		const fileName = withRootPrefix(extractFileName(rawPath) || rawPath);
		// 未找到区路径显示：
		//   showPath 关 = 仅文件名（根目录文件补「根目录/」）
		//   showPath 开 = 引用该图的笔记名(基名) + "/" + 文件名（如「欢迎.md/根目录/20230918_114616.bmp」）
		const refNoteName = ref.file.split("/").pop() || ref.file;
		const showText = showPath ? `${refNoteName}/${fileName}` : fileName;
		// title：完整 vault 路径 + 引用笔记 + 行号，方便 hover 时看清物理位置和上下文
		const detailedTitle = `路径：${rawPath}\n引用：${ref.file}:${ref.line || "全文"}`;
		const pathSpan = item.createSpan({ cls: "pic-path", text: showText, title: detailedTitle });
		pathSpan.classList.add("clickable");
		item.dataset.purePath = itemKey;
		pathSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			// 双击路径 = 复制图片完整路径（图片本身的位置）
			navigator.clipboard.writeText(rawPath).then(
				() => new Notice(`已复制路径`),
				() => new Notice("PicLinker：复制失败，请重试"),
			);
		});

		// 行号标签：让用户一眼看到该引用在笔记里的位置
		const lineTag = item.createSpan({ cls: "pic-file-tag clickable", text: ref.line > 0 ? `L:${ref.line}` : `全文`, title: ref.line > 0 ? `引用位于 ${ref.file}:${ref.line}，单击跳转` : `引用位于 ${ref.file}（无行号），单击跳转` });
		lineTag.addEventListener("click", (e) => {
			e.stopPropagation();
			jumpToFile(img, ref.file, ref.line);
		});

		// 行内删除按钮：精确删该笔记该行的引用
		const actions = item.createDiv({ cls: "pic-actions" });
		const noteName = ref.file.split("/").pop() || ref.file;
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: `删除「${rawPath}」在 ${noteName} 中的引用行` } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			const lineDesc = ref.line > 0 ? `第 ${ref.line} 行` : "全文中的引用行";
			if (!(await confirmAsync(app, { message: `确定要删除「${rawPath}」在「${noteName}」${lineDesc}吗？`, title: "删除引用行" }))) return;
			try {
				if (ref.line > 0) {
					// 精确行号删除：使用 removeImageFromLine
					const abstractFile = app.vault.getAbstractFileByPath(ref.file);
					if (!(abstractFile instanceof TFile)) {
						new Notice(`PicLinker：笔记「${noteName}」不存在`);
						return;
					}
					const content = await app.vault.read(abstractFile);
					const contentLines = content.split("\n");
					const idx = ref.line - 1;
					const orig = contentLines[idx];
					if (orig === undefined) {
						new Notice(`PicLinker：第 ${ref.line} 行不存在`);
						return;
					}
					const cleaned = removeImageFromLine(orig, img.pure);
					if (!cleaned.trim()) {
						contentLines.splice(idx, 1);
					} else if (cleaned !== orig) {
						contentLines[idx] = cleaned;
					} else {
						new Notice(`PicLinker：第 ${ref.line} 行未包含该图片`);
						return;
					}
					await app.vault.modify(abstractFile, contentLines.join("\n"));
					new Notice(`已删除「${noteName}」第 ${ref.line} 行的引用`);
				} else {
					// 无行号：退化为整文件删除该图片的所有引用行
					const count = await removeImageFromMdFile(ref.file, [img.pure]);
					new Notice(count > 0 ? `已删除「${noteName}」中的 ${count} 个引用行` : `PicLinker：「${noteName}」中未找到引用行`);
				}
				await refresh();
			} catch (err) {
				new Notice(`PicLinker：删除失败 - ${err instanceof Error ? err.message : String(err)}`);
			}
		}));
	}

	/** 兼容旧调用：保留 renderNotFoundItem 名字，转发到新方法（无 ref 时退化为第一引用） */
	renderNotFoundItem(container: HTMLElement, img: ImageLink, selectedSet?: Set<string>) {
		// 按引用展开后渲染；保留旧 selection 兼容（基于 img.pure 选中 = 整图选中）
		const refs = expandRefs(img);
		for (const ref of refs) {
			const item = container.createDiv({ cls: "pic-item" });
			this.renderNotFoundRefItem(item, img, ref);
			// 旧 selectedSet 兼容：如果该 img 已被选中，所有子项也置为选中态
			if (selectedSet?.has(img.pure)) {
				item.classList.add("pic-item--selected");
				const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
				if (cb) cb.checked = true;
			}
		}
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
					() => new Notice(`已复制图片名「${fileName}」`),
					() => new Notice("PicLinker：复制失败，请重试"),
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
			thumb.addEventListener("error", () => {
				thumb.setCssStyles({ display: "none" });
				createThumbBrokenPlaceholder(item);
			});
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
				() => new Notice("已复制路径"),
				() => new Notice("PicLinker：复制失败，请重试"),
			);
		});

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除云端图片并清理引用行" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			if (!(await confirmAsync(this.ctx.app, { message: `确定要删除云端图片「${file.name}」吗？\n将同时清理笔记中的引用行。`, title: "删除云端图片" }))) return;
			if (!cloudBedType) {
				new Notice("PicLinker：云端图片未删除：无法识别图床类型");
				return;
			}
			const result = await deleteCloudFile(file.prefix || file.name, cloudBedType);
			if (!result.success) {
				new Notice(`云端图片删除失败，已取消清理引用：${result.error ?? "未知错误"}`);
				return;
			}
			await removeImageFromAllMdFiles([file.url]);
			new Notice(`已删除「${file.name}」`);
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
				() => new Notice(`已复制图片名「${file.name}」`),
				() => new Notice("PicLinker：复制失败，请重试"),
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
			thumb.addEventListener("error", () => {
				thumb.setCssStyles({ display: "none" });
				createThumbBrokenPlaceholder(item);
			});
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
				() => new Notice(`已复制路径`),
				() => new Notice("PicLinker：复制失败，请重试"),
			);
		});

		const actions = item.createDiv({ cls: "pic-actions" });
		const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "移入回收站" } });
		deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
			e.stopPropagation();
			if (!(await confirmAsync(this.ctx.app, { message: `确定要将「${file.name}」移入回收站吗？`, title: "移入回收站" }))) return;
			if (deleteLocalUnrefFile) {
				await deleteLocalUnrefFile(file);
			} else {
				await app.fileManager.trashFile(file);
				new Notice(`已移入回收站「${file.name}」`);
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
			thumb.addEventListener("error", () => {
				thumb.setCssStyles({ display: "none" });
				createThumbBrokenPlaceholder(item);
			});
			thumb.addEventListener("click", (e) => {
				e.stopPropagation();
				showImagePreview(thumbSrc);
			});
		}
	}
}

/**
 * 创建分组级复选框（用于同名/去重/未找到/云端图床分组）
 *
 * 行为：
 *   - 全未选 → ☐；部分选 → ▣；全选 → ☑️
 *   - 点击 checkbox → 该组所有 itemKey 全选/全清（selection 同步）
 *   - 反向：通过 selection.onChange 监听该 section 变化 → 自动同步 checkbox 状态
 *     （调用方无需在子项 change 时手动 dispatch 事件）
 *   - helper 会在点击 checkbox 时 stopPropagation，避免触发折叠
 *
 * 返回 syncCheckbox 函数，调用方在「外部 selection 变化后」（如批量删除、刷新）调用一次
 */
export interface GroupCheckboxOpts {
	/** 组头容器（将 checkbox 插入到该元素最前）*/
	headerEl: HTMLElement;
	/** 该组所有 itemKey（用于 selection.select/deselect）*/
	itemKeys: string[];
	/** SelectionManager */
	selection: SelectionManager;
	/** 该组归属的 SelectionSection */
	section: SelectionSection;
	/** checkbox 的 tooltip */
	title?: string;
	/** 选中态变化后回调（用于更新工具栏 actions）*/
	onChange?: () => void;
	/** 子项 key 不属于 selection.isSelected 体系时（罕见），可选覆盖 hasChecked */
	hasCheckedOverride?: (itemKey: string) => boolean;
}

export interface GroupCheckboxHandle {
	checkbox: HTMLInputElement;
	syncCheckbox: () => void;
	/** helper 内部监听器，渲染卸载时建议调用 off 释放（避免内存泄漏）*/
	off: () => void;
}

export function createGroupCheckbox(opts: GroupCheckboxOpts): GroupCheckboxHandle {
	const { headerEl, itemKeys, selection, section, title, onChange, hasCheckedOverride } = opts;
	const hasChecked = hasCheckedOverride ?? ((k: string) => selection.isSelected(section, k));

	const checkbox = headerEl.createEl("input", {
		type: "checkbox",
		cls: "pic-cloud-checkbox",
		attr: title ? { title } : {}
	});
	// 复选框置于组头最左侧（与子项复选框对齐，更显眼，便于「选中整组」）
	headerEl.insertBefore(checkbox, headerEl.firstChild);
	const syncCheckbox = () => {
		const selectedCount = itemKeys.filter(hasChecked).length;
		if (itemKeys.length === 0 || selectedCount === 0) {
			checkbox.checked = false;
			checkbox.indeterminate = false;
		} else if (selectedCount === itemKeys.length) {
			checkbox.checked = true;
			checkbox.indeterminate = false;
		} else {
			checkbox.checked = false;
			checkbox.indeterminate = true;
		}
	};
	syncCheckbox();
	checkbox.addEventListener("click", (e) => e.stopPropagation());
	checkbox.addEventListener("change", () => {
		if (checkbox.checked || checkbox.indeterminate) {
			selection.select(section, itemKeys);
		} else {
			for (const k of itemKeys) selection.deselect(section, k);
		}
		syncCheckbox();
		onChange?.();
	});
	// 通过 selection.onChange 监听该 section 反向同步（helper 自动跨区、跨组同步）
	const onSelectionChange = (changedSection: SelectionSection) => {
		if (changedSection === section) syncCheckbox();
	};
	selection.onChange(onSelectionChange);
	const off = () => selection.off(onSelectionChange);
	return { checkbox, syncCheckbox, off };
}
