/**
 * ActionsRenderer — Section action-button management
 * Extracted from PicLinkerView:
 *   updateClearButtons, updateSectionActions,
 *   updateLocalActions, updateLocalUnrefActions,
 *   updateSameNameActions, updateDedupActions, updateEmptyFolderActions
 */

import { SelectionManager, SelectionSection } from "../SelectionManager";

export interface ActionButton {
	text: string;
	cls: string;
	title: string;
	onClick: () => void;
}

export interface ActionsContext {
	selection: SelectionManager;
	headerCache: Map<SelectionSection, HTMLElement>;
	deleteLineBtn: HTMLElement | null;
	getLocalActions: () => ActionButton[][];       // [localImages, cloudImages, notFound]
	getLocalUnrefActions: () => ActionButton[][];  // [localUnref, cloudUnref]
	getSameNameActions: () => ActionButton[];
	getDedupActions: () => ActionButton[];
	getEmptyFolderActions: () => ActionButton[];
	/** 给定 selectionSection 返回对应标签的选中数（含同名/去重的跨区标签），用于 per-section 删除行按钮 */
	getDeleteLineForSection?: (selectionSection: SelectionSection) => { count: number; onClick: () => void } | null;
}

export class ActionsRenderer {
	private ctx: ActionsContext;

	constructor(ctx: ActionsContext) {
		this.ctx = ctx;
	}

	/**
	 * 判断某个分区当前是否处于折叠态。
	 * createCollapsibleSection 中 content 紧跟在 header 之后（互为兄弟），
	 * 折叠时 content.style.display === "none"，据此推导分区可见性，
	 * 避免更新按钮时把折叠态下应隐藏的操作区强制 display:"".
	 */
	private isSectionCollapsed(header: HTMLElement): boolean {
		const content = header.nextElementSibling as HTMLElement | null;
		return !!content && content.style.display === "none";
	}

	/** 设置删除行按钮引用（按钮在 render 中晚于 ActionsRenderer 创建） */
	setDeleteLineBtn(btn: HTMLElement | null): void {
		this.ctx.deleteLineBtn = btn;
	}

	/** 更新所有清除选中按钮的显隐 */
	updateClearButtons() {
		const { selection, headerCache } = this.ctx;
		for (const [section, header] of headerCache) {
			const clearBtn = header.querySelector<HTMLElement>(".pic-part-clear-btn");
			if (clearBtn) {
				let count = selection.getCount(section);
				if (section === SelectionSection.LocalImages) {
					count += selection.getCount(SelectionSection.LocalTags);
				}
				if (section === SelectionSection.CloudImages) {
					count += selection.getCount(SelectionSection.CloudTags);
				}
				if (section === SelectionSection.SameName) {
					count += selection.getCount(SelectionSection.SameNameTags);
				}
				if (section === SelectionSection.Dedup) {
					count += selection.getCount(SelectionSection.DedupTags);
				}
				// NotFound 的标签与文件共用 SelectionSection.NotFound，无需额外加计数
				const actions = clearBtn.parentElement;
				const collapsed = this.isSectionCollapsed(header);
				if (collapsed) {
					// 折叠态：彻底隐藏整个操作区（含清除按钮），不保留无效 display 赋值
					clearBtn.setCssStyles({ display: "none" });
					if (actions) actions.setCssStyles({ display: "none" });
				} else {
					clearBtn.setCssStyles({ display: count > 0 ? "" : "none" });
					if (actions) actions.setCssStyles({ display: "" });
				}
			}
		}
	}

	/** 通用：动态更新区域标题栏操作按钮 */
	updateSectionActions(section: SelectionSection, getButtons: () => ActionButton[]) {
		const header = this.ctx.headerCache.get(section);
		if (!header) return;
		let actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (!actions) {
			actions = header.createDiv({ cls: "pic-part-actions" });
		}
		const clearBtn = actions.querySelector<HTMLElement>(".pic-part-clear-btn");
		const buttons = getButtons();
		Array.from(actions.children).forEach(child => {
			if (child !== clearBtn) child.remove();
		});
		actions.setCssStyles({ display: this.isSectionCollapsed(header) ? "none" : "" });
		for (const btn of buttons) {
			const el = actions.createEl("button", { text: btn.text, cls: btn.cls, attr: { title: btn.title } });
			el.addEventListener("click", (e) => { e.stopPropagation(); btn.onClick(); });
		}
		if (clearBtn) actions.appendChild(clearBtn);
	}

	/** 更新工具栏「删除行」按钮显隐与文案 */
	private updateDeleteLineBtn() {
		const { selection, deleteLineBtn } = this.ctx;
		if (!deleteLineBtn) return;
		const tagCount = selection.getCount(SelectionSection.LocalTags)
			+ selection.getCount(SelectionSection.CloudTags)
			+ selection.getCount(SelectionSection.SameNameTags)
			+ selection.getCount(SelectionSection.DedupTags);
		if (tagCount > 0) {
			deleteLineBtn.setCssStyles({ display: "" });
			deleteLineBtn.textContent = `删除行 (${tagCount})`;
		} else {
			deleteLineBtn.setCssStyles({ display: "none" });
		}
	}

	/** 动态更新本地图片区域的操作按钮 */
	updateLocalActions() {
		this.updateDeleteLineBtn();
		this.updateClearButtons();
		const [localBtns, cloudBtns, notFoundBtns] = this.ctx.getLocalActions();
		this.updateSectionActions(SelectionSection.LocalImages, () => localBtns);
		this.updateSectionActions(SelectionSection.CloudImages, () => cloudBtns);
		this.updateSectionActions(SelectionSection.NotFound, () => notFoundBtns);
	}

	/** 动态更新未引用图片区域的操作按钮 */
	updateLocalUnrefActions() {
		this.updateClearButtons();
		const [localUnrefBtns, cloudUnrefBtns] = this.ctx.getLocalUnrefActions();
		this.updateSectionActions(SelectionSection.LocalUnref, () => localUnrefBtns);
		this.updateSectionActions(SelectionSection.CloudFiles, () => cloudUnrefBtns);
	}

	/** 动态更新同名文件区域的操作按钮 */
	updateSameNameActions() {
		this.updateDeleteLineBtn();
		this.updateClearButtons();
		this.updateSectionActions(SelectionSection.SameName, () => this.ctx.getSameNameActions());
	}

	/** 动态更新去重区域按钮 */
	updateDedupActions() {
		this.updateDeleteLineBtn();
		this.updateClearButtons();
		this.updateSectionActions(SelectionSection.Dedup, () => this.ctx.getDedupActions());
	}

	/** 动态更新空白文件夹区域的操作按钮 */
	updateEmptyFolderActions() {
		this.updateClearButtons();
		this.updateSectionActions(SelectionSection.EmptyFolders, () => this.ctx.getEmptyFolderActions());
	}
}
