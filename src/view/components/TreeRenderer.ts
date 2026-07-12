import { SelectionSection } from "../SelectionManager";
import { setSafeHTML, ensureLazyRendered, setLazyRendered, setLazyRenderFn } from "../utils/ViewUtils";

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
	searchKeyword: string;
	dirExpanded: Set<string>;
	sectionExpanded: Set<string>;
	saveExpandState: () => void;
	updateLocalActions: () => void;
	updateLocalUnrefActions: () => void;
	updateParentDirCheckboxes: () => void;
}

export class TreeRenderer {
	private context: TreeRendererContext;

	constructor(context: TreeRendererContext) {
		this.context = context;
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
		const { searchKeyword, dirExpanded, saveExpandState, updateLocalActions, updateLocalUnrefActions, updateParentDirCheckboxes } = this.context;

		// 渲染当前层级的文件（根目录文件需加分组头）
		if (node.files.length > 0) {
			const isRoot = depth === 0;
			if (isRoot) {
				const dirKey = breadcrumb || "__root__";
				const expanded = !!searchKeyword || dirExpanded.has(dirKey);
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
			const expanded = !!searchKeyword || dirExpanded.has(dirKey);

			const dirHeader = container.createDiv({ cls: "pic-dir-header" });
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

			const dirContent = container.createDiv({ cls: "pic-dir-content" });
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
		const { searchKeyword, sectionExpanded, saveExpandState, dirExpanded } = this.context;

		let expanded: boolean;
		if (searchKeyword) {
			expanded = count > 0;
		} else {
			expanded = count > 0 && !sectionExpanded.has(`!${sectionKey}`);
		}

		const header = parent.createDiv({ cls: "pic-part-header" });
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
		if (!expanded) content.setCssStyles({ display: "none" });

		setLazyRendered(content, expanded);

		header.addEventListener("click", () => {
			const isCollapsed = content.style.display === "none";
			content.setCssStyles({ display: isCollapsed ? "" : "none" });
			arrow.textContent = isCollapsed ? "▽" : "▶";
			const actionsEl = header.querySelector<HTMLElement>(".pic-part-actions");
			if (actionsEl) actionsEl.setCssStyles({ display: isCollapsed ? "" : "none" });
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
				if (!searchKeyword) {
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
		});

		return { header, content, expanded };
	}
}
