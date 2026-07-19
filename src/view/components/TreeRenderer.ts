import { SelectionSection } from "../SelectionManager";
import { setSafeHTML, ensureLazyRendered, setLazyRendered, setLazyRenderFn, syncHeaderBorder } from "../utils/ViewUtils";

/** 通用树节点接口 */
export interface TreeNode<T> {
	files: T[];
	children: Map<string, TreeNode<T>>;
}

/** 树渲染配置 */
export interface TreeRenderConfig<T> {
	/** 获取项目唯一键（用于选择集） */
	getKey: (item: T) => string;
	/** 渲染单个项目 */
	renderItem: (container: HTMLElement, item: T, selectedSet?: Set<string>) => void;
	/** 收集节点及子节点的所有文件 */
	collectFiles: (node: TreeNode<T>) => T[];
}

/** 树渲染器上下文 */
export interface TreeRendererContext {
	/** 获取当前搜索关键字（必须用 getter，搜索时动态变化，不能用构造时的值副本） */
	getSearchKeyword: () => string;
	dirExpanded: Set<string>;
	sectionExpanded: Set<string>;
	saveExpandState: () => void;
	updateLocalActions: () => void;
	updateLocalUnrefActions: () => void;
	updateParentDirCheckboxes: () => void;
}

export class TreeRenderer {
	private context: TreeRendererContext;
	/** 分区 header 递增 z-index 计数器（P0-6：避免多区域 sticky 标题堆叠互相遮挡，靠下分区叠在靠上分区之上） */
	private sectionZCounter = 10;

	constructor(context: TreeRendererContext) {
		this.context = context;
	}

	/** 当前搜索关键字（动态读取 getter，确保搜索时取到最新值） */
	private get searchKeyword(): string {
		return this.context.getSearchKeyword();
	}

	/** 从扁平路径列表构建树 */
	buildTree<T>(items: T[], getPath: (item: T) => string): TreeNode<T> {
		const root: TreeNode<T> = { files: [], children: new Map() };
		for (const item of items) {
			const path = getPath(item);
			const parts = path.split("/");
			if (parts.length === 1) {
				root.files.push(item);
			} else {
				let current = root;
				for (let i = 0; i < parts.length - 1; i++) {
					const dir = parts[i];
					if (!current.children.has(dir)) {
						current.children.set(dir, { files: [], children: new Map() });
					}
					current = current.children.get(dir)!;
				}
				current.files.push(item);
			}
		}
		return root;
	}

	/** 收集树节点及所有子节点的文件 */
	collectTreeFiles<T>(node: TreeNode<T>): T[] {
		const result = [...node.files];
		for (const child of node.children.values()) {
			result.push(...this.collectTreeFiles(child));
		}
		return result;
	}

	/** 通用树节点渲染 */
	renderTreeNodeGeneric<T>(
		container: HTMLElement,
		node: TreeNode<T>,
		depth: number,
		config: TreeRenderConfig<T>,
		selectedSet?: Set<string>,
		breadcrumb: string = "",
	) {
		const { dirExpanded, saveExpandState, updateLocalActions, updateLocalUnrefActions, updateParentDirCheckboxes } = this.context;

		// 渲染当前层级的文件（根目录文件需加分组头）
		if (node.files.length > 0) {
			const isRoot = depth === 0;
			if (isRoot) {
				const dirKey = breadcrumb || "__root__";
				const expanded = !!this.searchKeyword || dirExpanded.has(dirKey);
				const dirHeader = container.createDiv({ cls: "pic-dir-header" });
				dirHeader.setCssStyles({ paddingLeft: `${10 + depth * 16}px` });
				dirHeader.dataset.depth = String(depth);
				dirHeader.dataset.dirKey = dirKey;

				let arrowEl: HTMLElement | null = null;
				if (selectedSet) {
					const dirCb = dirHeader.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
					const allKeys = this.collectTreeFiles(node).map(config.getKey);
					dirCb.checked = allKeys.length > 0 && allKeys.every(k => selectedSet.has(k));
					dirCb.addEventListener("click", (e) => e.stopPropagation());
					dirCb.addEventListener("change", () => {
						for (const k of allKeys) { if (dirCb.checked) selectedSet.add(k); else selectedSet.delete(k); }
						dirHeader.toggleClass("pic-dir-header--selected", dirCb.checked);
						if (dirContent.style.display === "none") {
							dirContent.setCssStyles({ display: "" });
							if (arrowEl) arrowEl.textContent = "▽";
							dirExpanded.add(dirKey);
							saveExpandState();
						}
						// Force lazy-render collapsed child directories so their checkboxes can be synced
					const forceRender = (el: HTMLElement) => {
						el.querySelectorAll<HTMLElement>(".pic-dir-content").forEach(child => {
							ensureLazyRendered(child);
						});
					};
					forceRender(dirContent);
					// Recursively sync all nested checkboxes (including collapsed children)
						const syncNested = (el: HTMLElement) => {
							el.querySelectorAll<HTMLInputElement>(".pic-cloud-checkbox").forEach(cb => {
								cb.checked = dirCb.checked;
						const itemEl = cb.closest(".pic-item");
						if (itemEl) {
							itemEl.toggleClass("pic-item--selected", dirCb.checked);
						} else {
							const dirEl = cb.closest(".pic-dir-header");
							if (dirEl) dirEl.toggleClass("pic-dir-header--selected", dirCb.checked);
						}
							});
							el.querySelectorAll<HTMLElement>(".pic-dir-content").forEach(childContent => syncNested(childContent));
						};
						syncNested(dirContent);
						updateLocalUnrefActions();
						updateLocalActions();
						updateParentDirCheckboxes();
					});
				}

				const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "▽" : "▶" });
				arrowEl = arrow;
				const iconSpan = dirHeader.createSpan({ cls: "pic-dir-icon" });
				setSafeHTML(iconSpan, `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`);
				dirHeader.createSpan({ cls: "pic-dir-name", text: "根目录" });
				dirHeader.createSpan({ cls: "pic-dir-count", text: `(${node.files.length})` });

				const dirContent = container.createDiv({ cls: "pic-dir-content" });
				if (!expanded) dirContent.setCssStyles({ display: "none" });
				dirHeader.addEventListener("click", () => {
					const isCollapsed = dirContent.style.display === "none";
					dirContent.setCssStyles({ display: isCollapsed ? "" : "none" });
					arrow.textContent = isCollapsed ? "▽" : "▶";
					if (isCollapsed) {
						dirExpanded.add(dirKey);
						saveExpandState();
					} else {
						dirExpanded.delete(dirKey);
						saveExpandState();
					}
				});

				for (const item of node.files) {
					config.renderItem(dirContent, item, selectedSet);
				}
			} else {
				for (const item of node.files) {
					config.renderItem(container, item, selectedSet);
				}
			}
		}

		// 渲染子目录
		const sortedChildren = Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));

		for (const [dirName, childNode] of sortedChildren) {
			const allFiles = this.collectTreeFiles(childNode);
			const childBreadcrumb = breadcrumb ? `${breadcrumb} / ${dirName}` : dirName;
			const dirKey = childBreadcrumb;
			const expanded = !!this.searchKeyword || dirExpanded.has(dirKey);

			// P1-9: 子目录（depth>0）加 pic-dir-nested 标记，供 CSS 增加缩进/引导线/分组底色等层级视觉区分
			const dirHeader = container.createDiv({ cls: "pic-dir-header" + (depth > 0 ? " pic-dir-nested" : "") });
			dirHeader.setCssStyles({ paddingLeft: `${10 + depth * 16}px` });
			dirHeader.dataset.depth = String(depth);
			dirHeader.dataset.dirKey = dirKey;

			let arrowEl: HTMLElement | null = null;
			if (selectedSet) {
				const dirCb = dirHeader.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
				const allKeys = allFiles.map(config.getKey);
				dirCb.checked = allKeys.length > 0 && allKeys.every(k => selectedSet.has(k));
				dirCb.addEventListener("click", (e) => e.stopPropagation());
				dirCb.addEventListener("change", () => {
					for (const k of allKeys) { if (dirCb.checked) selectedSet.add(k); else selectedSet.delete(k); }
					dirHeader.toggleClass("pic-dir-header--selected", dirCb.checked);
					if (dirContent.style.display === "none") {
						dirContent.setCssStyles({ display: "" });
						if (arrowEl) arrowEl.textContent = "▽";
						dirExpanded.add(dirKey);
						saveExpandState();
					}
				// Force lazy-render collapsed child directories so their checkboxes can be synced
					dirContent.querySelectorAll<HTMLElement>(".pic-dir-content").forEach(child => {
						ensureLazyRendered(child);
					});
					dirContent.querySelectorAll<HTMLInputElement>(".pic-cloud-checkbox").forEach(cb => {
						cb.checked = dirCb.checked;
						const itemEl = cb.closest(".pic-item");
						if (itemEl) {
							itemEl.toggleClass("pic-item--selected", dirCb.checked);
						} else {
							const dirEl = cb.closest(".pic-dir-header");
							if (dirEl) dirEl.toggleClass("pic-dir-header--selected", dirCb.checked);
						}
					});
					updateLocalUnrefActions();
					updateLocalActions();
					updateParentDirCheckboxes();
				});
			}

			const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "▽" : "▶" });
			arrowEl = arrow;
			const iconSpan = dirHeader.createSpan({ cls: "pic-dir-icon" });
			setSafeHTML(iconSpan, `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`);
			dirHeader.createSpan({ cls: "pic-dir-name", text: dirName });
			dirHeader.createSpan({ cls: "pic-dir-count", text: `(${allFiles.length})` });

			// P1-9: 与 header 一致的嵌套标记
			const dirContent = container.createDiv({ cls: "pic-dir-content" + (depth > 0 ? " pic-dir-nested" : "") });
			if (!expanded) dirContent.setCssStyles({ display: "none" });

			dirHeader.addEventListener("click", () => {
				const isCollapsed = dirContent.style.display === "none";
				dirContent.setCssStyles({ display: isCollapsed ? "" : "none" });
				arrow.textContent = isCollapsed ? "▽" : "▶";
				if (isCollapsed) {
					// 展开前先触发嵌套子目录的懒渲染，避免折叠态直接同步建全部子孙 DOM
					ensureLazyRendered(dirContent);
					dirExpanded.add(dirKey);
				} else {
					dirExpanded.delete(dirKey);
				}
				saveExpandState();
			});

			// 嵌套目录懒渲染：折叠时不立即递归渲染子孙，展开时（dirHeader click / checkbox forceRender / section 展开）
			// 由 ensureLazyRendered 触发。子目录自身也会按各自 expanded 再决定是否继续懒渲染（多层生效）。
			if (!expanded) {
				setLazyRenderFn(dirContent, () => this.renderTreeNodeGeneric(dirContent, childNode, depth + 1, config, selectedSet, childBreadcrumb));
			} else {
				this.renderTreeNodeGeneric(dirContent, childNode, depth + 1, config, selectedSet, childBreadcrumb);
			}
		}
	}

	/** 创建可折叠分区 */
	createCollapsibleSection(
		parent: HTMLElement,
		sectionKey: string,
		iconSvg: string,
		title: string,
		count: number,
		selectionSection?: SelectionSection,
	): { header: HTMLElement; content: HTMLElement; expanded: boolean } {
		const { sectionExpanded, saveExpandState, dirExpanded } = this.context;

		let expanded: boolean;
		if (this.searchKeyword) {
			expanded = count > 0;
		} else {
			expanded = count > 0 && !sectionExpanded.has(`!${sectionKey}`);
		}

		const header = parent.createDiv({ cls: "pic-part-header" });
		// 三) 可访问性：分区标题支持键盘聚焦（Tab）与 Enter/Space 折叠
		header.setAttr("tabindex", "0");
		header.setAttribute("role", "button");
		header.setAttribute("aria-expanded", String(expanded));
		// P0-6: 每个分区 header 使用递增 z-index（从 10 起，每创建一个 +1），
		// 使后创建（靠下）的分区 header 永远叠在靠上分区 header 之上，避免滚动时多区域标题互相覆盖。
		header.setCssStyles({ zIndex: String(this.sectionZCounter++) });
		header.dataset.breadcrumb = title;
		const left = header.createDiv({ cls: "pic-part-left" });
		const icon = left.createSpan({ cls: "pic-part-icon" });
		setSafeHTML(icon, iconSvg);
		const arrow = left.createSpan({ cls: "pic-part-arrow", text: expanded ? "▽" : "▶" });
		left.createSpan({ text: title, cls: "pic-part-title" });
		left.createSpan({ text: `${count} 个`, cls: "pic-part-count" });

		if (selectionSection !== undefined) {
			header.dataset.selectionSection = String(selectionSection);
			header.createDiv({ cls: "pic-part-actions" });
		}

		const content = parent.createDiv({ cls: "pic-part-content", attr: { "data-section-key": sectionKey } });
		if (!expanded) {
			content.setCssStyles({ display: "none" });
			header.addClass("pic-part-header--collapsed");
		}
		// 同步边框（收起态四边完整边框；展开态由 base/CSS 决定，这里显式保证一致）
		syncHeaderBorder(header, content);

		setLazyRendered(content, expanded);

		header.addEventListener("click", () => {
			toggleSection();
		});
		// 三) 键盘：Enter / Space 触发折叠（兼容浏览器默认 Space 滚动，需阻止）
		header.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggleSection();
			}
		});

		const toggleSection = () => {
			const isCollapsed = content.style.display === "none";
			content.setCssStyles({ display: isCollapsed ? "" : "none" });
			arrow.textContent = isCollapsed ? "▽" : "▶";
			const actionsEl = header.querySelector<HTMLElement>(".pic-part-actions");
			if (actionsEl) actionsEl.setCssStyles({ display: isCollapsed ? "" : "none" });
			header.setAttribute("aria-expanded", String(isCollapsed));
			header.toggleClass("pic-part-header--collapsed", !isCollapsed);
			// 同步边框（class 切换后立刻同步内联边框，避免视觉不刷新）
			syncHeaderBorder(header, content);
			if (isCollapsed) {
				sectionExpanded.delete(`!${sectionKey}`);
				content.querySelectorAll<HTMLElement>(".pic-dir-header[data-dir-key]").forEach(h => {
					const dirKey = h.dataset.dirKey;
					if (!dirKey) return;
					const dirContent = h.nextElementSibling as HTMLElement;
					const arrow = h.querySelector<HTMLElement>(".pic-dir-arrow");
					const isDirExpanded = dirExpanded.has(dirKey);
					if (dirContent) dirContent.setCssStyles({ display: isDirExpanded ? "" : "none" });
					if (arrow) arrow.textContent = isDirExpanded ? "▽" : "▶";
				});
				saveExpandState();
				ensureLazyRendered(content);
				header.scrollIntoView({ behavior: "smooth", block: "nearest" });
			} else {
				if (!this.searchKeyword) {
					sectionExpanded.add(`!${sectionKey}`);
					content.querySelectorAll<HTMLElement>(".pic-dir-content").forEach(d => {
						d.setCssStyles({ display: "none" });
					});
					content.querySelectorAll<HTMLElement>(".pic-dir-arrow").forEach(a => {
						a.textContent = "▶";
					});
					saveExpandState();
				}
			}
		};

		return { header, content, expanded };
	}

	/** 重置分区 header z-index 计数器（每次重建分区列表前调用，P0-6） */
	resetSectionHeaderZ() {
		this.sectionZCounter = 10;
	}
}
