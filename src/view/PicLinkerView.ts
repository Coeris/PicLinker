/**
 * PicLinker 右侧面板视图
 * 八区布局：本地图片 / 云端图片 / 本地未引用图片 / 云端未引用图片 / 未找到图片 / 同名文件 / 重复图片 / 空白文件夹
 */

import { ItemView, WorkspaceLeaf, Notice, TFile, TFolder, setIcon, requestUrl, debounce } from "obsidian";
import PicLinkerPlugin from "../main";
import { ImageLink, ImageBedType, CloudFile, DedupGroup } from "../types";
import { extractFileName } from "../comparator/CloudComparator";
import { IMAGE_EXTENSIONS } from "../parser/LinkParser";
import { HashCache } from "../utils/HashCache";
import { detectBedTypeFromUrl, getBedFaviconSvg, LOCAL_ICON_SVG } from "../icons";
import { getTopBedIcon, buildFileNameRefCount, expandRefs, parseTagKey, resolveImageFromTagKey, setSafeHTML, isHidden, ensureLazyRendered, setLazyRenderFn, syncHeaderStuckClass, createThumbBrokenPlaceholder, withRootPrefix, imgSelectKey, type TagRef } from "./utils/ViewUtils";

import { showImagePreview } from "./ImagePreview";
import { SelectionManager, SelectionSection, SelectionChangeCallback } from "./SelectionManager";
import { DedupService } from "./DedupService";
import { TreeRenderer } from "./components/TreeRenderer";
import { ItemRenderer, createGroupCheckbox } from "./components/ItemRenderer";
import { confirmAsync } from "../utils/DangerConfirmModal";
import { onAsyncClick, deferAsync } from "../utils/AsyncHandler";
import { BatchOperations } from "./operations/BatchOperations";
import { DeleteOperations } from "./operations/DeleteOperations";
import { ActionsRenderer } from "./components/ActionsRenderer";

export const VIEW_TYPE_PIC_LINKER = "pic-linker";

/** 图床类型排序（UI 展示顺序统一用此常量） */
const BED_TYPE_ORDER: ImageBedType[] = [ImageBedType.GitHub, ImageBedType.Aliyun, ImageBedType.Tencent, ImageBedType.Other];

/** 同名文件条目类型 */
type SameNameItem = { source: "local" | "cloud"; path: string; url?: string; bedType?: ImageBedType; count?: number; section?: string };

/** 通用树节点接口 */

/** 树渲染配置 */

export class PicLinkerView extends ItemView {
	private plugin: PicLinkerPlugin;
	/** vault 名称（用于 app localStorage 命名空间） */
	private vaultName = "";
	private localImages: ImageLink[] = [];
	private vaultImagesMap = new Map<string, ImageLink>();
	private cloudFiles: CloudFile[] = [];
	/** 云端所有目录（含空目录，来自 delimiter 列表） */
	private cloudAllDirs: Array<{ dir: string; bedType: ImageBedType }> = [];
	/** 当前选中的图床（用于删除等操作，来自全局设置默认值） */
	private selectedBed: ImageBedType;
	/** 本地图片云端比对结果缓存（跨所有图床） */
	private compareResult = new Map<string, { exists: boolean; url?: string; bedType?: ImageBedType; unknown?: boolean }>();

	/** 搜索关键字 */
	private searchKeyword = "";

	/** 去重渲染时注册的 onChange 回调清理函数，每次重渲染前统一注销，防止监听泄漏 */
	private dedupRenderOffs: (() => void)[] = [];

	/** 文件名 → 引用次数映射 */
	private fileNameRefCount = new Map<string, number>();
	private headerCache: Map<SelectionSection, HTMLElement> = new Map();

	/** 操作区按钮引用 */

	/** 统一选中状态管理 */
	private selection = new SelectionManager();
	/** 选中变化回调引用（用于 onClose 时移除） */
	private selectionChangeCallback: SelectionChangeCallback | null = null;
	/** 去重与同名文件持久化服务 */
	private dedupService!: DedupService;
	/** 删除行按钮 */
	private deleteLineBtn: HTMLButtonElement | null = null;
	/** 视图是否已关闭（防止异步回调操作已销毁 DOM） */
	private isClosed = false;
	/** 云端数据是否已加载完成 */
	private cloudLoaded = false;
	/** 本地数据是否正在加载 */
	private localLoading = false;
	/** 云端数据是否正在加载 */
	private cloudLoading = false;
	/** 云端数据加载完成通知（用于 await 模式替代 busy-wait） */
	private cloudDataResolvers: Array<() => void> = [];
	/** 当前云端数据加载的 Promise（供 debounceFileRefresh 等待完成） */
	private _cloudLoadPromise: Promise<void> | null = null;

	/** 云端图片列表（renderContent 时更新） */
	private cloudReferenced: ImageLink[] = [];
	/** 去重结果 */
	private dedupGroups: DedupGroup[] = [];
	/** 去重执行防重入标志 */
	private isDedupRunning = false;
	/** 同名文件数据：按文件名分组，每组包含本地和/或云端条目 */
	private sameNameGroups: Array<{
		fileName: string;
		items: Array<{ source: "local" | "cloud"; path: string; url?: string; bedType?: ImageBedType; count?: number; section?: string }>;
	}> = [];
	/** 空白文件夹缓存（refresh 时清除） */
	private emptyFoldersCache: string[] | null = null;
	/** sticky 滚动处理器 */
	private stickyScrollHandler: (() => void) | null = null;
	/** 工具栏 ResizeObserver（onClose 时清理） */
	private toolbarResizeObserver: ResizeObserver | null = null;
	/** 全局展开/收起按钮首次点击标记（首次强制展开） */
	private isFirstToggle = true;
	private treeRenderer!: TreeRenderer;
	private itemRenderer!: ItemRenderer;
	/** 当前高亮条目（键盘 ↑/↓ 与鼠标点击共用，保证唯一）；不表示勾选 */
	private currentItemEl: HTMLElement | null = null;
	private batchOps!: BatchOperations;
	private deleteOps!: DeleteOperations;
	private actions!: ActionsRenderer;

	/** 分区折叠状态（Section_Key -> false 表示折叠） */
	private sectionExpanded = new Set<string>();

	/** 目录折叠状态（已展开的路径集合） */
	private dirExpanded = new Set<string>();
	/** 全局按钮触发的临时展开状态（不持久化），用户点击单个目录后转交给 dirExpanded。 */
	private isAllExpandedByGlobal = false;

	/** 保存展开状态到 app localStorage */
	private saveExpandState() {
		this.dedupService.saveExpandState(this.sectionExpanded, this.dirExpanded);
	}

	/** 保存去重结果到 app localStorage */
	private saveDedupGroups() {
		this.dedupService.saveDedupGroups(this.dedupGroups);
	}

	/** 清除去重结果 */
	private clearDedupGroups() {
		this.dedupGroups = [];
		this.selection.clear(SelectionSection.Dedup);
		this.dedupService.clearDedupGroups();
	}

	/** 清理已失效的去重组条目（本地文件已删除或云端文件已不在列表中的） */
	private cleanupDedupGroups() {
		if (this.dedupGroups.length === 0) return;
		const localPaths = new Set(this.localImages.map(i => i.resolvedPath || i.pure));
		// 添加未引用的本地文件路径
		for (const file of this.getLocalUnreferencedImages()) {
			localPaths.add(file.path);
		}
		const cloudUrls = new Set(this.cloudFiles.map(f => f.url));

		let changed = false;
		for (const group of this.dedupGroups) {
			const before = group.items.length;
			group.items = group.items.filter(item => {
				if (item.source === "local") return localPaths.has(item.path);
				if (item.source === "cloud") return cloudUrls.has(item.file?.url || item.path);
				return true;
			});
			if (group.items.length !== before) changed = true;
		}
		const beforeCount = this.dedupGroups.length;
		this.dedupGroups = this.dedupGroups.filter(g => g.items.length >= 2);
		if (changed || this.dedupGroups.length !== beforeCount) {
			this.saveDedupGroups();
		}
	}

	/** 保存同名文件数据到 app localStorage */
	private saveSameNameData() {
		this.dedupService.saveSameNameData(this.sameNameGroups);
	}

	/** 从 app localStorage 加载同名文件数据 */
	private loadSameNameData() {
		this.sameNameGroups = this.dedupService.loadSameNameData();
	}

	/** 清除同名文件数据 */
	private clearSameNameData() {
		this.sameNameGroups = [];
		this.dedupService.clearSameNameData();
	}

	/** 仅计算本地同名文件（每次刷新时调用，不依赖云端数据） */
	/** 从 localImages + 未引用图片中收集本地同名条目（公共逻辑） */
	private collectLocalSameNameEntries(): Map<string, SameNameItem[]> {
		const nameMap = new Map<string, SameNameItem[]>();

		// 已引用的图片（按实际类型区分本地/云端）
		for (const img of this.localImages) {
			const fileName = extractFileName(img.resolvedPath || img.pure);
			if (!fileName) continue;
			const key = fileName.toLowerCase();
			if (!nameMap.has(key)) nameMap.set(key, []);
			const path = img.resolvedPath || img.pure;
			const existing = nameMap.get(key)!;
			if (img.type === "local") {
				if (!existing.some(i => i.source === "local" && i.path === path)) {
					existing.push({ source: "local", path, count: img.count, section: "本地图片" });
				}
			} else {
				if (!existing.some(i => i.source === "cloud" && i.url === img.pure)) {
					existing.push({ source: "cloud", path, url: img.pure, bedType: detectBedTypeFromUrl(img.pure) ?? undefined, section: "云端图片" });
				}
			}
		}

		// 未引用的图片（库中存在但未被任何笔记引用）
		const unreferenced = this.getLocalUnreferencedImages();
		for (const file of unreferenced) {
			const fileName = file.name;
			const key = fileName.toLowerCase();
			if (!nameMap.has(key)) nameMap.set(key, []);
			const existing = nameMap.get(key)!;
			if (!existing.some(i => i.source === "local" && i.path === file.path)) {
				existing.push({ source: "local", path: file.path, count: 0, section: "本地未引用图片" });
			}
		}

		return nameMap;
	}

	private computeLocalSameName() {
		const nameMap = this.collectLocalSameNameEntries();

		// 收集有效的本地同名 key
		const validLocalKeys = new Set<string>();
		for (const [key, items] of nameMap) {
			if (items.length < 2) continue;
			const unique = [...new Map(items.map(i => [i.path, i])).values()];
			if (unique.length < 2) continue;
			validLocalKeys.add(key);
			// 检查是否已有该文件名的组（可能由云端数据创建）
			const existingIdx = this.sameNameGroups.findIndex(g => g.fileName.toLowerCase() === key);
			if (existingIdx >= 0) {
				// 合并：保留云端条目，更新本地条目；云端项按 (bedType,url) 去重
				const existing = this.sameNameGroups[existingIdx];
				const cloudItems = existing.items.filter(i => i.source === "cloud");
				const merged = [...unique, ...cloudItems];
				// 对云端项去重（与 computeAndSaveSameName 一致）
				const seen = new Set<string>();
				const deduped: typeof merged = [];
				for (const it of merged) {
					if (it.source !== "cloud") { deduped.push(it); continue; }
					const u = it.url ?? it.path;
					const k = `${it.bedType ?? ""}:${u}`;
					if (seen.has(k)) continue;
					seen.add(k);
					deduped.push(it);
				}
				this.sameNameGroups[existingIdx] = { fileName: existing.fileName, items: deduped };
			} else {
				const fileName = extractFileName(unique[0].path) || key;
				this.sameNameGroups.push({ fileName, items: unique });
			}
		}

		// 清理：移除本地条目已失效且无云端条目的旧分组
		this.sameNameGroups = this.sameNameGroups.filter(g => {
			const key = g.fileName.toLowerCase();
			// 有有效本地同名的组保留
			if (validLocalKeys.has(key)) return true;
			// 有云端条目的组保留（等云端数据合并）
			if (g.items.some(i => i.source === "cloud")) return true;
			// 只有本地条目但不在有效集合中的，说明已失效
			return false;
		});

		this.saveSameNameData();
	}

	/** 计算全部同名文件数据并保存（云端比对完成后调用，全量重建） */
	private computeAndSaveSameName() {
		// 复用公共方法收集本地条目
		const localEntries = this.collectLocalSameNameEntries();
		const nameMap = new Map<string, { fileName: string; items: SameNameItem[] }>();
		for (const [key, items] of localEntries) {
			nameMap.set(key, { fileName: items[0]?.path ? (extractFileName(items[0].path) || key) : key, items: [...items] });
		}

		// 收集云端文件
		// 构建已引用的云端 URL 集合
		const referencedCloudUrls = new Set<string>();
		for (const img of this.localImages) {
			const result = this.compareResult.get(img.pure);
			if (result?.exists && result.url) referencedCloudUrls.add(result.url);
		}

		for (const cf of this.cloudFiles) {
			if (cf.isDirectory) continue;
			const fileName = extractFileName(cf.name) || cf.name;
			if (!fileName) continue;
			const key = fileName.toLowerCase();
			if (!nameMap.has(key)) nameMap.set(key, { fileName, items: [] });
			const entry = nameMap.get(key)!;
			if (!entry.items.some(i => i.source === "cloud" && i.url === cf.url)) {
				const section = referencedCloudUrls.has(cf.url) ? "云端图片" : "云端未引用图片";
				entry.items.push({ source: "cloud", path: cf.prefix || cf.name, url: cf.url, bedType: cf.bedType, section });
			}
		}

		// 去重：同一文件名下可能同时出现「笔记引用的云端项」与「图床列举项」指向同一张图（如 OSS 同 URL），
		// 之前会重复计入导致显示 3 项（本地 + 未知 + 阿里云OSS）。按 (bedType,url) 合并云端项，每个图床+URL 只留一条。
		for (const entry of nameMap.values()) {
			if (entry.items.length <= 1) continue;
			const seen = new Set<string>();
			const deduped: SameNameItem[] = [];
			for (const it of entry.items) {
				if (it.source !== "cloud") { deduped.push(it); continue; }
				const u = it.url ?? it.path;
				const k = `${it.bedType ?? ""}:${u}`;
				if (seen.has(k)) continue;
				seen.add(k);
				deduped.push(it);
			}
			entry.items = deduped;
		}

		// 筛选：至少有 2 个条目
		const groups: typeof this.sameNameGroups = [];
		for (const [, entry] of nameMap) {
			if (entry.items.length < 2) continue;
			groups.push({ fileName: entry.fileName, items: entry.items });
		}

		this.sameNameGroups = groups;
		this.saveSameNameData();
	}

	constructor(leaf: WorkspaceLeaf, plugin: PicLinkerPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.vaultName = plugin.app.vault.getName();
		this.dedupService = new DedupService(this.app, (key) => this.getStorageKey(key));
		// 从 app localStorage 恢复展开状态（必须在 TreeRenderer 创建之前）
		const expandState = this.dedupService.loadExpandState();
		this.sectionExpanded = new Set<string>(expandState.sectionExpanded);
		this.dirExpanded = new Set<string>(expandState.dirExpanded);
		// 加载之前的去重结果
		this.dedupGroups = this.dedupService.loadDedupGroups();
		this.treeRenderer = new TreeRenderer({
			getSearchKeyword: () => this.searchKeyword,
			dirExpanded: this.dirExpanded,
			sectionExpanded: this.sectionExpanded,
			saveExpandState: () => this.saveExpandState(),
			updateLocalActions: () => this.actions.updateLocalActions(),
			updateLocalUnrefActions: () => this.actions.updateLocalUnrefActions(),
			updateParentDirCheckboxes: () => this.updateParentDirCheckboxes(),
			selection: this.selection,
			section: SelectionSection.LocalImages,
			onDirToggle: () => { this.isAllExpandedByGlobal = false; },
			getIsAllExpandedByGlobal: () => this.isAllExpandedByGlobal,
		});
		this.itemRenderer = new ItemRenderer({
			app: this.app,
			selection: this.selection,
			compareResult: this.compareResult,
			getCloudFiles: () => this.cloudFiles,
			refresh: () => this.refresh(),
			copyImagePath: (img) => this.copyImagePath(img),
			jumpToFile: (img, filePath, lineNumber) => void this.jumpToFile(img, filePath, lineNumber),
			updateLocalActions: () => this.actions.updateLocalActions(),
			updateLocalUnrefActions: () => this.actions.updateLocalUnrefActions(),
			updateParentDirCheckboxes: () => this.updateParentDirCheckboxes(),
			deleteCloudFile: (fileKey, bedType) => this.plugin.deleteCloudFile(fileKey, bedType),
			removeImageFromMdFile: (filePath, urls) => this.plugin.linkEditor.removeImageFromMdFile(filePath, urls),
			removeImageFromLine: (line, url) => this.plugin.linkEditor.removeImageFromLine(line, url),
			removeImageFromAllMdFiles: (urls) => this.plugin.linkEditor.removeImageFromAllMdFiles(urls),
			showPath: this.plugin.settings.showPath,
			setCurrentItem: (item: HTMLElement) => this.setCurrentItem(item),
		});
		this.batchOps = new BatchOperations({
			selection: this.selection,
		});
		this.deleteOps = new DeleteOperations({
			selection: this.selection,
			app: this.app,
			localImages: () => this.localImages,
			cloudFiles: () => this.cloudFiles,
			compareResult: () => this.compareResult,
			selectedBed: () => this.selectedBed,
			removeImageFromMdFile: (fp, urls) => this.plugin.linkEditor.removeImageFromMdFile(fp, urls),
			removeImageFromLine: (line, url) => this.plugin.linkEditor.removeImageFromLine(line, url),
			deleteCloudFile: (fileKey, bedType) => this.plugin.deleteCloudFile(fileKey, bedType),
			refresh: () => this.refresh(),
		});
		this.actions = new ActionsRenderer({
			selection: this.selection,
			headerCache: this.headerCache,
			deleteLineBtn: this.deleteLineBtn,
			getLocalActions: () => [
				// [0] 本地图片
				[
					...(this.selection.getCount(SelectionSection.LocalTags) > 0
						? [{ text: `清理引用 (${this.selection.getCount(SelectionSection.LocalTags)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中标签的引用行（仅本区域）", onClick: () => this.deleteOps.deleteReferenceLinesForSections([SelectionSection.LocalTags]) }]
						: []),
					...(this.selection.getCount(SelectionSection.LocalImages) > 0
						? [{ text: `删除 (${this.selection.getCount(SelectionSection.LocalImages)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中的图片", onClick: () => this.deleteOps.batchDeleteLocalFiles(this.localImages) }]
						: []),
				],
				// [1] 云端图片
				this.selection.getCount(SelectionSection.CloudImages) > 0 || this.selection.getCount(SelectionSection.CloudTags) > 0
					? [
						...(this.selection.getCount(SelectionSection.CloudTags) > 0
							? [{ text: `清理引用 (${this.selection.getCount(SelectionSection.CloudTags)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中标签的引用行（仅本区域）", onClick: () => this.deleteOps.deleteReferenceLinesForSections([SelectionSection.CloudTags]) }]
							: []),
						...(this.selection.getCount(SelectionSection.CloudImages) > 0
							? [
								{ text: `MD (${this.selection.getCount(SelectionSection.CloudImages)})`, cls: "pic-btn-sm", title: "复制 Markdown 格式图片链接", onClick: () => this.batchOps.genericBatchCopy(SelectionSection.CloudImages, this.cloudReferenced, (img: ImageLink) => img.pure, (img: ImageLink) => img.pure, (img: ImageLink) => extractFileName(img.pure) || img.pure, "markdown") },
								{ text: `HTML (${this.selection.getCount(SelectionSection.CloudImages)})`, cls: "pic-btn-sm", title: "复制 HTML 格式图片链接", onClick: () => this.batchOps.genericBatchCopy(SelectionSection.CloudImages, this.cloudReferenced, (img: ImageLink) => img.pure, (img: ImageLink) => img.pure, (img: ImageLink) => extractFileName(img.pure) || img.pure, "html") },
								{ text: `下载 (${this.selection.getCount(SelectionSection.CloudImages)})`, cls: "pic-btn-sm", title: "下载选中的云端图片", onClick: () => this.batchOps.genericBatchDownload(SelectionSection.CloudImages, this.cloudReferenced, (img: ImageLink) => img.pure, (img: ImageLink) => img.pure, (img: ImageLink) => extractFileName(img.pure) || "image", () => this.renderContent()) },
								{ text: `删除 (${this.selection.getCount(SelectionSection.CloudImages)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除引用行和云端图片", onClick: () => this.deleteOps.batchDeleteCloudImages() },
							]
							: []),
					]
					: [],
				// [2] 未找到图片（分组后：每个选中都是引用行级，含 ::）
				[
					...(this.selection.getSelected(SelectionSection.NotFoundRefs).some(k => k.includes("::"))
						? [{ text: `清理引用 (${this.selection.getSelected(SelectionSection.NotFoundRefs).filter(k => k.includes("::")).length})`, cls: "pic-btn-sm pic-btn-danger", title: "仅删除选中的引用行", onClick: () => this.deleteOps.batchDeleteNotFoundTags() }]
						: []),
				],
			],
			getLocalUnrefActions: () => [
				this.selection.getCount(SelectionSection.LocalUnref) > 0
					? [{ text: `删除 (${this.selection.getCount(SelectionSection.LocalUnref)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中的本地未引用图片", onClick: () => { void this.deleteOps.batchDeleteLocalUnref(this.getLocalUnreferencedImages()); } }]
					: [],
				this.selection.getCount(SelectionSection.CloudFiles) > 0
					? (() => {
						const cloudOnly = this.getCloudOnlyFiles();
						const filteredCloud = this.applyCloudFilter(cloudOnly);
						return [
							{ text: `MD (${this.selection.getCount(SelectionSection.CloudFiles)})`, cls: "pic-btn-sm", title: "复制 Markdown 格式图片链接", onClick: () => { void this.batchOps.genericBatchCopy(SelectionSection.CloudFiles, filteredCloud, (f: CloudFile) => f.prefix || f.name, (f: CloudFile) => f.url, (f: CloudFile) => extractFileName(f.name) || f.name, "markdown"); } },
							{ text: `HTML (${this.selection.getCount(SelectionSection.CloudFiles)})`, cls: "pic-btn-sm", title: "复制 HTML 格式图片链接", onClick: () => { void this.batchOps.genericBatchCopy(SelectionSection.CloudFiles, filteredCloud, (f: CloudFile) => f.prefix || f.name, (f: CloudFile) => f.url, (f: CloudFile) => extractFileName(f.name) || f.name, "html"); } },
							{ text: `下载 (${this.selection.getCount(SelectionSection.CloudFiles)})`, cls: "pic-btn-sm", title: "下载选中的云端图片", onClick: () => { void this.batchOps.genericBatchDownload(SelectionSection.CloudFiles, filteredCloud, (f: CloudFile) => f.prefix || f.name, (f: CloudFile) => f.url, (f: CloudFile) => extractFileName(f.name) || "image"); } },
							{ text: `删除 (${this.selection.getCount(SelectionSection.CloudFiles)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中的云端图片", onClick: () => { void this.cleanupUnreferenced(filteredCloud.filter(f => this.selection.isSelected(SelectionSection.CloudFiles, f.prefix || f.name))); } },
						];
					})()
					: [],
			],
			getSameNameActions: () => [
				...(this.selection.getCount(SelectionSection.SameNameTags) > 0
					? [{ text: `清理引用 (${this.selection.getCount(SelectionSection.SameNameTags)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中标签的引用行（仅本区域）", onClick: () => this.deleteOps.deleteReferenceLinesForSections([SelectionSection.SameNameTags]) }]
					: []),
				...(this.selection.getCount(SelectionSection.SameName) > 0
					? [{ text: `删除 (${this.selection.getCount(SelectionSection.SameName)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中的重复图片", onClick: () => this.deleteSelectedSameName() }]
					: []),
			],
			getDedupActions: () => [
				...(this.selection.getCount(SelectionSection.DedupTags) > 0
					? [{ text: `清理引用 (${this.selection.getCount(SelectionSection.DedupTags)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中标签的引用行（仅本区域）", onClick: () => this.deleteOps.deleteReferenceLinesForSections([SelectionSection.DedupTags]) }]
					: []),
				...(this.selection.getCount(SelectionSection.Dedup) > 0
					? [{ text: `删除 (${this.selection.getCount(SelectionSection.Dedup)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中的重复图片，将引用更新为组内第一项", onClick: () => this.dedupDeleteSelected() }]
					: []),
			],
			getEmptyFolderActions: () => this.selection.getCount(SelectionSection.EmptyFolders) > 0
				? [{ text: `删除 (${this.selection.getCount(SelectionSection.EmptyFolders)})`, cls: "pic-btn-sm pic-btn-danger", title: "删除选中的空白文件夹", onClick: () => { void this.deleteOps.batchDeleteEmptyFolders((fp) => this.parseEmptyFolder(fp)); } }]
				: [],
		});
		this.selectedBed = ImageBedType.GitHub; // v0.2.0: defaultBedType 已移除
		// 同名文件数据在 localImages 就绪后加载（见 refresh/loadCloudData）
		// 注册选中变化回调，统一更新 UI
		this.selectionChangeCallback = (section) => this.onSelectionChange(section);
		this.selection.onChange(this.selectionChangeCallback);
	}

	/** 生成带 vault 前缀的 app localStorage key */
	private getStorageKey(key: string): string {
		return `${this.vaultName}::piclinker-${key}`;
	}

	getViewType(): string {
		return VIEW_TYPE_PIC_LINKER;
	}

	getDisplayText(): string {
		return "图床管家";
	}

	getIcon(): string {
		return "cloud-check";
	}

	async onOpen() {
		// Fix 4 (P1-12): 视图复用时 isClosed 不复位可能白屏
		this.isClosed = false;

		// Fix 3 (P1-11): 打开视图时恢复持久化的同名数据，不用等云端加载完
		this.loadSameNameData();

		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("pic-container");

		// 给所在的 workspace-leaf 添加标记 class（替代 CSS :has 选择器）
		const leafEl = this.containerEl.closest<HTMLElement>(".workspace-leaf");
		if (leafEl) leafEl.addClass("pic-leaf-active");

		this.render(container);
		await this.refresh();
	}

	async onClose() {
		// 移除 workspace-leaf 标记 class
		const leafEl = this.containerEl.closest<HTMLElement>(".workspace-leaf");
		if (leafEl) leafEl.removeClass("pic-leaf-active");

		// 标记视图已关闭，阻止异步回调操作已销毁的 DOM
		this.isClosed = true;
		// 清理 sticky 滚动监听器
		if (this.stickyScrollHandler) {
			const scrollContainer = this.containerEl.parentElement || this.containerEl;
			scrollContainer.removeEventListener("scroll", this.stickyScrollHandler);
			this.stickyScrollHandler = null;
		}
		// 清理数据引用，帮助 GC
		this.localImages = [];
		this.unreferencedCache = null;
		this.cloudFiles = [];
		this.compareResult.clear();
		this.vaultImagesMap.clear();
		this.fileNameRefCount.clear();
		// 清理选中状态
		this.selection.clearAll();
		// 移除选中变化回调，防止内存泄漏
		if (this.selectionChangeCallback) {
			this.selection.off(this.selectionChangeCallback);
			this.selectionChangeCallback = null;
		}
		// 清理 ResizeObserver
		this.toolbarResizeObserver?.disconnect();
		this.toolbarResizeObserver = null;
		// 不移除 :root 的 --pic-toolbar-h：多实例共存时移除会让其他实例回落 42px 默认值、
		// 吸顶错位；保留最后一次测量值对其他实例仍正确（toolbar 高度一致），下次打开会重测
		// 清理 DOM
		this.containerEl.empty();
	}

	async refresh() {
		// 重置全局展开/收起按钮首次点击标记
		this.isFirstToggle = true;
		// 重置全局展开标志（Fix 2）
		this.isAllExpandedByGlobal = false;
		// 重置空白文件夹缓存（下次刷新重新检测）
		this.dedupService.saveEmptyFoldersCleared(false);
		this.emptyFoldersCache = null;

		// 保存当前选中状态（在清除之前），供 renderContent 恢复
		const savedCheckedPaths = this.collectCheckedPaths();

		// 清除所有选中状态
		this.selection.clearAll();

		// selectedBed 仅作兜底，图床类型优先从数据自带 bedType 字段获取
		this.selectedBed = ImageBedType.GitHub;

		// 第一步：加载本地数据（快，立即渲染）
		// 标记所有已变更的文件需要重扫，然后增量扫描
		this.plugin.vaultScanner.invalidateChangedFiles();
		this.vaultImagesMap = await this.plugin.getVaultImages();
		this.localImages = Array.from(this.vaultImagesMap.values());
		this.localImages.sort((a, b) => (a.resolvedPath || a.pure).localeCompare(b.resolvedPath || b.pure));
		this.unreferencedCache = null;
		this.fileNameRefCount = buildFileNameRefCount(this.localImages);

		// 云端数据正在加载时不清空已有结果，避免闪烁
		if (!this.cloudLoading) {
			this.cloudLoaded = false;
			this.compareResult.clear(); // 清空旧比对结果，避免新引用图片用旧数据分类
		}

		// 动态更新同名文件的引用数据（不清空重建，只刷新标签等引用信息）
		this.updateSameNameReferences();
		this.computeLocalSameName();

		// 清理已失效的去重组条目（本地文件已删除的）
		this.cleanupDedupGroups();

		this.renderContent(savedCheckedPaths);

		// 第二步：后台加载云端数据（慢，完成后自动更新）
		if (!this.cloudLoading) {
			void this.loadCloudData();
			} else {
			// 云端数据正在加载中，等加载完成后用最新本地数据重新渲染
			this.cloudDataResolvers.push(() => {
				// 加载成功时 loadCloudData 末尾已用最新数据渲染过，跳过避免重复渲染/闪烁；
				// 仅在加载失败（cloudLoaded 仍为 false）时兜底重渲染本地数据
				if (!this.cloudLoaded && this.localImages.length > 0) {
					this.renderContent();
				}
			});
		}

	}

	/** 后台加载云端图床数据（防重入），完成后自动刷新视图 */
	private loadCloudData(): Promise<void> {
		if (this.cloudLoading) return this._cloudLoadPromise || Promise.resolve();
		this.cloudLoading = true;
		return this._cloudLoadPromise = (async () => {
		try {
			const allCompareResult = new Map<string, { exists: boolean; url?: string; bedType?: ImageBedType }>();
			const allCloudFiles: CloudFile[] = [];

			// 只查询已配置的图床（有凭证的才请求）
			const settings = this.plugin.settings;
			const bedTypes: ImageBedType[] = [];
			if (settings.githubToken && settings.githubOwner) bedTypes.push(ImageBedType.GitHub);
			if (settings.aliyunAccessKeyId && settings.aliyunAccessKeySecret) bedTypes.push(ImageBedType.Aliyun);
			if (settings.tencentSecretId && settings.tencentSecretKey) bedTypes.push(ImageBedType.Tencent);
			if (settings.smmsToken) bedTypes.push(ImageBedType.Other);
			if (bedTypes.length === 0) { this.cloudLoaded = true; this.renderContent(); return; }

			const results = await Promise.allSettled(
				bedTypes.map(async (bedType) => {
					const cloudFiles = await this.plugin.listCloudFiles(bedType);
					for (const cf of cloudFiles) cf.bedType = bedType;
					const compareResult = await this.plugin.compareLocalWithCloud(this.localImages, bedType, cloudFiles);
					return { bedType, cloudFiles, compareResult };
				})
			);

			const failedBeds: string[] = [];
			for (const r of results) {
				if (r.status === "fulfilled") {
					allCloudFiles.push(...r.value.cloudFiles);
					for (const [key, val] of r.value.compareResult.entries()) {
						if (val.exists && !allCompareResult.has(key)) {
							allCompareResult.set(key, { ...val, bedType: r.value.bedType });
						}
					}
				} else {
					const reason: unknown = r.reason;
					if (reason instanceof Error) {
						failedBeds.push(reason.message);
					} else if (typeof reason === "object" && reason !== null) {
						failedBeds.push(JSON.stringify(reason));
					} else {
						failedBeds.push(String(reason));
					}
				}
			}

			this.cloudFiles = allCloudFiles;
			this.compareResult = allCompareResult;
			this.cloudLoaded = true;
			this.emptyFoldersCache = null; // 云端数据变更，清除缓存

			// 获取云端所有目录（含空目录）
			this.cloudAllDirs = [];
			for (const bt of [ImageBedType.Aliyun, ImageBedType.Tencent]) {
				if (bedTypes.includes(bt)) {
					try {
						const bed = this.plugin.imageBedManager.get(bt);
						if (bed && bed.listEmptyDirs) {
							bed.configure(settings);
							const dirs = await bed.listEmptyDirs();
							for (const dir of dirs) {
								this.cloudAllDirs.push({ dir, bedType: bt });
							}
						}
					} catch (e) { console.warn("[PicLinker] 获取云端空目录失败:", e instanceof Error ? e.message : String(e)); }
				}
			}

			// 计算同名文件数据并持久化
			this.computeAndSaveSameName();

			// 云端数据更新后，清理已失效的去重组条目
			this.cleanupDedupGroups();

			if (failedBeds.length > 0) {
				console.warn("[PicLinker] 加载云端数据 部分图床加载失败:", failedBeds.join("; "));
				new Notice(`部分图床加载失败: ${failedBeds.join("; ")}`);
			}
			this.renderContent();
		} catch (e) {
			console.warn("[PicLinker] 加载云端数据 失败", e instanceof Error ? e.message : String(e));
			new Notice(`PicLinker：加载云端数据失败：${e instanceof Error ? e.message : String(e)}`);
		} finally {
			this.cloudLoading = false;
			// 通知所有等待者
			for (const resolve of this.cloudDataResolvers) resolve();
			this.cloudDataResolvers = [];
			this._cloudLoadPromise = null;
		}
		})();
	}

	/** 等待云端数据加载完成（供外部如 debounceFileRefresh 使用） */
	async waitForCloudLoad(): Promise<void> {
		if (!this.cloudLoading && this.cloudLoaded) return;
		if (this._cloudLoadPromise) {
			await this._cloudLoadPromise;
			return;
		}
		return new Promise<void>(resolve => {
			this.cloudDataResolvers.push(resolve);
		});
	}

	/** 后台刷新本地图片数据（防重入），完成后自动刷新视图 */
	private async refreshLocalData() {
		if (this.localLoading) return;
		this.localLoading = true;
		try {
			this.vaultImagesMap = await this.plugin.getVaultImages();
			this.localImages = Array.from(this.vaultImagesMap.values());
			this.unreferencedCache = null;
			this.emptyFoldersCache = null;
			this.localImages.sort((a, b) => (a.resolvedPath || a.pure).localeCompare(b.resolvedPath || b.pure));
			this.fileNameRefCount = buildFileNameRefCount(this.localImages);
			this.cleanupDedupGroups();
			this.renderContent();
		} catch (e) {
			new Notice(`PicLinker：刷新本地图片失败：${e instanceof Error ? e.message : String(e)}`);
		} finally {
			this.localLoading = false;
		}
	}

	private render(container: HTMLElement) {
		// ===== 过滤栏（最上面，list 外部） =====
		const filterBar = container.createDiv({ cls: "pic-toolbar" });

		// 搜索框（图标 + 提示文字 分开，避免重叠）
		const searchBox = filterBar.createDiv({ cls: "pic-search-box" });
		// 图标独立元素，不再塞入 input value
		searchBox.createSpan({ cls: "pic-search-icon", text: "🔍" });
		const searchInput = searchBox.createEl("input", {
			type: "text",
			cls: "pic-search-input",
			placeholder: "",
		});
		const searchClear = searchBox.createSpan({ cls: "pic-search-clear", text: "✕" });
		searchClear.setCssStyles({ display: "none" });
		const searchHint = searchBox.createSpan({ cls: "pic-search-hint", text: "搜索文件名..." });
		const cursorMin = 0;
		const updateSearchUI = () => {
			const hasText = searchInput.value.length > cursorMin;
			searchHint.setCssStyles({ display: hasText ? "none" : "" });
			searchClear.setCssStyles({ display: hasText ? "" : "none" });
		};
		searchClear.addEventListener("click", () => {
			searchInput.value = "";
			searchInput.focus();
			this.searchKeyword = "";
			updateSearchUI();
			this.renderContent();
		});
		let isComposing = false;
		const debouncedSearch = debounce(() => {
			this.renderContent();
		}, 150, true);
		searchInput.addEventListener("input", () => {
			this.searchKeyword = searchInput.value.trim().toLowerCase();
			updateSearchUI();
			if (!isComposing) debouncedSearch();
		});
		searchInput.addEventListener("compositionstart", () => {
			isComposing = true;
			// P1-4: 输入法组字开始时显式隐藏 hint，避免与正在组字的文字短暂重叠
			searchHint.setCssStyles({ display: "none" });
		});
		searchInput.addEventListener("compositionend", () => {
			isComposing = false;
			this.searchKeyword = searchInput.value.trim().toLowerCase();
			updateSearchUI();
			debouncedSearch();
		});
		searchInput.addEventListener("focus", () => {
			searchHint.setCssStyles({ display: "none" });
		});
		searchInput.addEventListener("blur", () => {
			updateSearchUI();
		});
		searchInput.addEventListener("click", () => {
			// 不再需要光标保护
		});
		searchInput.addEventListener("keydown", (e) => {
			// 2) Esc 清空搜索（有内容时）；无内容时 Esc 让输入框失焦
			if (e.key === "Escape") {
				e.preventDefault();
				if (searchInput.value.length > 0) {
					searchInput.value = "";
					this.searchKeyword = "";
					updateSearchUI();
					this.renderContent();
				} else {
					searchInput.blur();
				}
			}
		});
		// 2) 全局 Cmd/Ctrl+F：聚焦搜索框（Obsidian 习惯），阻止默认浏览器查找
		container.addEventListener("keydown", (e) => {
			if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F")) {
				e.preventDefault();
				searchInput.focus();
				searchInput.select();
			}
		});

		// 右侧操作区（靠右）
		const actionsRight = filterBar.createDiv({ cls: "pic-filter-actions" });

		// 删除行按钮（选中标签时显示）
		this.deleteLineBtn = actionsRight.createEl("button", { text: "清理引用", cls: "pic-refresh-btn pic-btn-danger", attr: { title: "删除选中标签的引用行" } });
		this.deleteLineBtn.setCssStyles({ display: "none" });
		this.deleteLineBtn.addEventListener("click", () => { void this.deleteOps.batchDeleteReferenceLines(); });
		// 按钮 DOM 晚于 ActionsRenderer 构造，回写引用使其生效
		this.actions.setDeleteLineBtn(this.deleteLineBtn);

		const refreshBtn = actionsRight.createEl("button", { text: "🔄 刷新", cls: "pic-refresh-btn", attr: { title: "重新扫描全库图片" } });
		refreshBtn.addEventListener("click", onAsyncClick(async () => {
			refreshBtn.textContent = "⏳ 刷新中...";
			refreshBtn.disabled = true;
			refreshBtn.classList.add("loading");
			this.selection.clear(SelectionSection.LocalTags);
			this.selection.clear(SelectionSection.CloudTags);
			// 刷新时保留展开状态，不调用 sectionExpanded.clear()
			this.selection.clear(SelectionSection.SameNameTags);
			this.selection.clear(SelectionSection.DedupTags);

			const container2 = this.containerEl.querySelector<HTMLElement>(".pic-container");
			container2?.classList.add("refreshing");

			try {
				await new Promise(r => window.setTimeout(r, 200));
				await this.refresh();
			} catch (e) {
				new Notice(`PicLinker：刷新失败：${e instanceof Error ? e.message : String(e)}`);
			} finally {
				container2?.classList.remove("refreshing");
				container2?.classList.add("refreshed");
				window.setTimeout(() => container2?.classList.remove("refreshed"), 300);

				refreshBtn.textContent = "🔄 刷新";
				refreshBtn.disabled = false;
				refreshBtn.classList.remove("loading");
			}
		}));

		// 去重按钮（单击=选中去重，双击=全库去重）
		// 方案：单击延迟 300ms 跑，期间有第二次 click → 升级为全库，避免双击时被“弹请选择”副作用误导
		const dedupBtn = actionsRight.createEl("button", { text: "去重", cls: "pic-refresh-btn", attr: { title: "单击：选中图片去重；双击：全库去重" } });
		let dedupClickCount = 0;
		let dedupClickTimer: number | null = null;
		dedupBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			dedupClickCount++;
			if (dedupClickTimer) window.clearTimeout(dedupClickTimer);
			dedupClickTimer = window.setTimeout(deferAsync(async () => {
				const isDouble = dedupClickCount >= 2;
				dedupClickCount = 0;
				dedupClickTimer = null;
				if (isDouble) {
					// 双击 → 全库去重
					new Notice("开始全库去重...");
					await this.runDedup(false);
				} else {
					// 单击 → 选中图片去重
					await this.runDedup(true);
				}
			}), 300);
		});

		// 全局展开/收起按钮
		// 使用类字段 isFirstToggle，refresh() 中会重置
		const toggleAllBtn = actionsRight.createEl("button", { cls: "pic-refresh-btn", attr: { title: "收起所有" } });
		setIcon(toggleAllBtn, "chevrons-up-down");
		toggleAllBtn.addEventListener("click", () => {
			const mainList = this.containerEl.querySelector<HTMLElement>("#pic-main-list");
			if (!mainList) return;
			const allSections = mainList.querySelectorAll<HTMLElement>(".pic-part-content");
			const allDirContents = mainList.querySelectorAll<HTMLElement>(".pic-dir-content");
			const anyExpanded = Array.from(allSections).some(s => !s.classList.contains("pic-part-content--collapsed")) ||
				Array.from(allDirContents).some(d => !d.classList.contains("pic-dir-content--collapsed"));
			// 首次点击强制展开，之后正常切换
			const shouldCollapse = this.isFirstToggle ? false : anyExpanded;
			this.isFirstToggle = false;
			allSections.forEach(s => {
				s.toggleClass("pic-part-content--collapsed", shouldCollapse);
				// 全部展开时触发延迟渲染
				if (!shouldCollapse) ensureLazyRendered(s);
				// 同步收起态 class（全局按钮也必须 toggle，否则边框/圆角不更新）
				const hdr = s.previousElementSibling as HTMLElement;
				if (hdr && hdr.classList.contains("pic-part-header")) {
					hdr.toggleClass("pic-part-header--collapsed", shouldCollapse);
					syncHeaderStuckClass(hdr, hdr.classList.contains("pic-part-header--stuck"));
				}
			});
			allDirContents.forEach(d => { d.toggleClass("pic-dir-content--collapsed", shouldCollapse); });
			mainList.querySelectorAll<HTMLElement>(".pic-dir-arrow").forEach(a => { a.textContent = shouldCollapse ? "▶" : "▽"; });
			mainList.querySelectorAll<HTMLElement>(".pic-part-arrow").forEach(a => { a.textContent = shouldCollapse ? "▶" : "▽"; });
			// 操作按钮随展开/收起切换
			mainList.querySelectorAll<HTMLElement>(".pic-part-actions").forEach(a => { a.toggleClass("pic-part-actions--hidden", shouldCollapse); });
			setIcon(toggleAllBtn, shouldCollapse ? "chevrons-down-up" : "chevrons-up-down");
			toggleAllBtn.title = shouldCollapse ? "展开所有" : "收起所有";
			// 同步 sectionExpanded 和 dirExpanded（只调用一次 saveExpandState）
			if (shouldCollapse) {
				mainList.querySelectorAll<HTMLElement>(".pic-part-content").forEach(s => {
					const key = s.dataset.sectionKey;
					if (key) this.sectionExpanded.add(`!${key}`);
				});
				// 收起所有：清除全局展开标志，保留 dirExpanded 不丢失用户折叠/展开偏好
				this.isAllExpandedByGlobal = false;
			} else {
				this.sectionExpanded.clear();
				// 展开所有：设置全局标志，不污染持久化的 dirExpanded。
				this.isAllExpandedByGlobal = true;
			}
			this.saveExpandState();
		});

		// 动态测量 toolbar 高度，写入 :root 作用域的 CSS 变量（与 styles.css 中声明的作用域一致，
		// 比写到 container 内联 style 更稳健；供 section header sticky top 使用）
		const updateToolbarH = () => {
			const h = filterBar.offsetHeight;
			if (h > 0) document.documentElement.style.setProperty("--pic-toolbar-h", `${h}px`);
		};
		updateToolbarH();
		this.toolbarResizeObserver = new ResizeObserver(updateToolbarH);
		this.toolbarResizeObserver.observe(filterBar);

		// 统一列表
		const list = container.createDiv({ cls: "pic-list", attr: { id: "pic-main-list" } });
		list.createDiv({ cls: "pic-loading", text: "加载中..." });

		// 三) 列表键盘导航：↑/↓ 移动焦点行、Space 勾选/取消、Ctrl/Cmd+A 全选当前区域
		list.addEventListener("keydown", (e) => {
			const focusEl = list.ownerDocument.activeElement as HTMLElement | null;
			// 搜索框/输入框聚焦时不拦截
			if (focusEl && (focusEl === searchInput || focusEl.tagName === "INPUT" || focusEl.tagName === "TEXTAREA")) return;

			// Ctrl/Cmd+A → 全选当前可见区域
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
				e.preventDefault();
				this.selectAllVisible(list);
				return;
			}

			if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== " ") return;

			const items = Array.from(list.querySelectorAll<HTMLElement>(".pic-item"))
				.filter(el => el.offsetParent !== null) // 仅可见条目
				.filter(el => el.querySelector<HTMLInputElement>(".pic-cloud-checkbox") !== null); // 仅含 checkbox 的真正条目（排除分组头 .pic-dedup-hash / .pic-notfound-header）
			if (items.length === 0) return;

			// Fix 2 (P1-10): 确保 currentItemEl 在 items 中才用其索引，否则从 -1 开始
			const active = this.currentItemEl;
			const idx = active && items.includes(active) ? items.indexOf(active) : -1;

			if (e.key === " ") {
				// Space → 勾选/取消当前行（不影响其他选区）
				e.preventDefault();
				const target = items[Math.max(0, idx)];
				const cb = target.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
				if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); }
				this.setCurrentItem(target); // 确保 Space 后后续 ↑/↓ 从当前行开始
				return;
			}

			e.preventDefault();
			const nextIdx = e.key === "ArrowDown"
				? Math.min(items.length - 1, idx + 1)
				: Math.max(0, idx - 1);
			const nextItem = items[nextIdx];
			// ↑/↓ = 切换选中：取消当前行勾选，勾选目标行
			// 仅当 currentItemEl 有效（idx >= 0）时才取消当前行，避免首次按键误取消第一行
			if (idx >= 0) {
				const curCb = items[idx].querySelector<HTMLInputElement>(".pic-cloud-checkbox");
				if (curCb && curCb.checked) { curCb.checked = false; curCb.dispatchEvent(new Event("change")); }
			}
			const nextCb = nextItem.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
			if (nextCb && !nextCb.checked) { nextCb.checked = true; nextCb.dispatchEvent(new Event("change")); }
			this.setCurrentItem(nextItem);
			nextItem.scrollIntoView({ block: "nearest" });
		});
	}

	private setCurrentItem(item: HTMLElement) {
		// 记录当前焦点行（用于 ↑/↓ 导航和 Space 勾选定位），不影响勾选选区
		this.currentItemEl = item;
		// 焦点落到当前项，保证后续 keydown 能冒泡到 list
		item.focus({ preventScroll: true });
	}

	private selectAllVisible(list: HTMLElement) {
		// 全选当前可见区域内未勾选的条目（仅含 checkbox 的项，排除分组头）
		const items = Array.from(list.querySelectorAll<HTMLElement>(".pic-item"))
			.filter(el => el.offsetParent !== null)
			.filter(el => el.querySelector<HTMLInputElement>(".pic-cloud-checkbox") !== null)
			.filter(el => !el.classList.contains("pic-dedup-hash") && !el.classList.contains("pic-notfound-header"));
		for (const item of items) {
			const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
			if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event("change")); }
		}
	}

	private renderContent(savedCheckedPaths?: Map<string, SelectionSection>) {
		// 视图已关闭，避免操作已销毁的 DOM
		if (this.isClosed) return;

		const el = this.containerEl.querySelector<HTMLElement>("#pic-main-list");
		if (!el) return;

		// 保存滚动位置（DOM 重建后恢复）
		const scrollContainer = this.containerEl.parentElement || this.containerEl;
		const savedScrollTop = scrollContainer.scrollTop;

		// 保存选中状态（DOM 重建后恢复）
		const savedPaths = savedCheckedPaths || this.collectCheckedPaths();

		el.empty();

		// 清空所有 onChange 回调，避免 DOM 重建后旧回调累积导致的泄漏和性能劣化
		// 各 section 渲染时组头会重新注册 onChange
		this.selection.removeAllListeners();
		if (this.selectionChangeCallback) {
			this.selection.onChange(this.selectionChangeCallback);
		}

		// DOM 重建后，旧 currentItemEl 已失效，清除引用
		this.currentItemEl = null;

		if (this.localImages.length === 0 && this.cloudFiles.length === 0) {
			// 空库时先清理 headerCache、恢复选中与滚动位置，避免旧 UI 残留
			this.headerCache.clear();
			this.restoreSelectionState(savedPaths);
			scrollContainer.scrollTop = savedScrollTop;
			el.createDiv({ cls: "pic-empty", text: "无数据" });
			return;
		}

		// 按来源拆分图片
		const { localOnly, cloudReferenced, notFoundImages } = this.splitImagesBySource();
		this.cloudReferenced = cloudReferenced;

		// 重置分区 header z-index 计数器，避免无限累加
		this.treeRenderer.resetSectionHeaderZ();

		// 渲染 8 个 section
		this.renderLocalImagesSection(el, localOnly);
		this.renderCloudImagesSection(el, cloudReferenced);
		this.renderLocalUnrefSection(el);
		this.renderCloudUnrefSection(el);
		this.renderNotFoundSection(el, notFoundImages);
		this.renderSameNameSection(el);
		this.renderDedupSection(el);
		this.renderEmptyFoldersSection(el);

		// 填充 header 缓存
		this.headerCache.clear();
		el.querySelectorAll<HTMLElement>(".pic-part-header").forEach(header => {
			const sectionStr = header.dataset.selectionSection;
			if (sectionStr) this.headerCache.set(sectionStr as SelectionSection, header);
		});

		// 2) 搜索无结果提示：搜索关键词非空、且所有分区都没有任何条目时，给出明确状态
		if (this.searchKeyword) {
			const hasAnyItem = el.querySelector<HTMLElement>(".pic-item, .pic-dir-header, .pic-dedup-group, .pic-empty-folder");
			if (!hasAnyItem) {
				const banner = el.createDiv({ cls: "pic-search-noresult" });
				banner.setText(`未找到匹配 “${this.searchKeyword}” 的项目`);
			}
		}

		// 恢复选中状态 + 更新 UI
		this.restoreSelectionState(savedPaths);
		this.actions.updateLocalActions();
		this.setupStickyHeaders();

		// 恢复滚动位置
		scrollContainer.scrollTop = savedScrollTop;
	}

	/** 收集当前所有选中的路径及其所属 section（用于 DOM 重建后恢复） */
	private collectCheckedPaths(): Map<string, SelectionSection> {
		const paths = new Map<string, SelectionSection>();
		for (const section of [
			SelectionSection.LocalImages,
			SelectionSection.CloudImages,
			SelectionSection.LocalUnref,
			SelectionSection.CloudFiles,
			SelectionSection.NotFoundRefs,
			SelectionSection.SameName,
			SelectionSection.Dedup,
			SelectionSection.EmptyFolders,
		]) {
			for (const path of this.selection.getSelected(section)) {
				// 前缀 section 避免同名区/去重区的 key 冲突（如 local:path 同时出现在两组）
				paths.set(`${section}::${path}`, section);
			}
		}
		return paths;
	}

	/** 由云端 URL 反查对象存储 fileKey（prefix || name），保证 deleteCloudFile 拿到的是 key 而非完整 URL（与 ItemRenderer 同一逻辑） */
	private resolveCloudFileKey(urlOrPath: string): string {
		const cf = this.cloudFiles.find(f => f.url === urlOrPath);
		return cf?.prefix || cf?.name || extractFileName(urlOrPath) || urlOrPath;
	}

	/** 按来源拆分图片：本地 / 云端 / 未找到 */
	private splitImagesBySource(): { localOnly: ImageLink[]; cloudReferenced: ImageLink[]; notFoundImages: ImageLink[] } {
		const filteredLocal = this.applyLocalFilter(this.localImages);
		const localOnly: ImageLink[] = [];
		const cloudReferenced: ImageLink[] = [];
		const notFoundImages: ImageLink[] = [];
		for (const img of filteredLocal) {
			// 远程(http/https/data)图片本身就是外链/云端引用，永远不该进「未找到」：
			// 即便云端数据未加载，也要归到云端引用区，而不是被当成断链的本地图。
			if (img.type !== "local") {
				cloudReferenced.push(img);
				continue;
			}
			// 仅当云端数据就绪时，再按 compareResult 判定本地图是否已上传到云端
			if (this.cloudLoaded) {
				const result = this.compareResult.get(img.pure);
			// HEAD 探测失败（unknown）的图片不据此判定分类，避免被静默归入「未找到」或「本地」区
			if (result?.unknown) {
				localOnly.push(img);
				continue;
			}
				if (result?.exists) {
					cloudReferenced.push(img);
					continue;
				}
			}
			if (img.found === false) {
				notFoundImages.push(img);
			} else {
				localOnly.push(img);
			}
		}
		return { localOnly, cloudReferenced, notFoundImages };
	}

	// ===== Section 1: 本地图片 =====
	private renderLocalImagesSection(el: HTMLElement, localOnly: ImageLink[]) {
		if (!this.plugin.settings.showLocalImages || localOnly.length === 0) return;
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "local", LOCAL_ICON_SVG, "本地图片", localOnly.length, SelectionSection.LocalImages);
		const actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (actions) {
			if (this.selection.getCount(SelectionSection.LocalImages) > 0) {
				const btn = actions.createEl("button", { text: `删除 (${this.selection.getCount(SelectionSection.LocalImages)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除选中的图片" } });
				btn.addEventListener("click", (e) => { e.stopPropagation(); void this.deleteOps.batchDeleteLocalFiles(localOnly); });
			}
			this.addClearSelectionButton(actions, SelectionSection.LocalImages);
		}
		const _renderLocal = () => this.renderLocalGroupedByFolder(content, localOnly, this.selection.getSet(SelectionSection.LocalImages));
		if (expanded) _renderLocal(); else setLazyRenderFn(content, _renderLocal);
	}

	// ===== Section 2: 云端图片 =====
	private renderCloudImagesSection(el: HTMLElement, cloudReferenced: ImageLink[]) {
		if (!this.plugin.settings.showCloudImages || (cloudReferenced.length === 0 && this.cloudLoaded)) return;

		const cloudIcon = getTopBedIcon(cloudReferenced.map(i => i.pure));
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "cloud", cloudIcon, "云端图片", cloudReferenced.length, SelectionSection.CloudImages);
		if (cloudReferenced.length > 0) {
			const actions = header.querySelector<HTMLElement>(".pic-part-actions");
			if (actions) {
				if (this.selection.getCount(SelectionSection.CloudImages) > 0) {
					this.addCloudImageActions(actions, cloudReferenced);
				}
				this.addClearSelectionButton(actions, SelectionSection.CloudImages);
			}
			const _renderCloud = () => this.renderCloudReferencedByBed(content, cloudReferenced, this.selection.getSet(SelectionSection.CloudImages));
			if (expanded) _renderCloud(); else setLazyRenderFn(content, _renderCloud);
		} else {
			// 加载中状态：count=0 时 createCollapsibleSection 判定为折叠，需手动展开以显示「正在加载…」
			content.removeClass("pic-part-content--collapsed");
			header.removeClass("pic-part-header--collapsed");
			const arrow = header.querySelector<HTMLElement>(".pic-part-arrow");
			if (arrow) arrow.textContent = "▽";
			content.createDiv({ cls: "pic-cloud-loading", text: "正在加载云端数据..." });
		}
	}

	// ===== Section 3: 本地未引用图片 =====
	private renderLocalUnrefSection(el: HTMLElement) {
		if (!this.plugin.settings.showLocalUnreferenced) return;
		let localUnreferenced = this.getLocalUnreferencedImages();
		if (this.searchKeyword) {
			const kw = this.searchKeyword;
			localUnreferenced = localUnreferenced.filter(f => f.name.toLowerCase().includes(kw));
		}
		if (localUnreferenced.length === 0) return;

		const grayIcon = LOCAL_ICON_SVG.replace(/#7C3AED/g, "currentColor");
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "local-unref", grayIcon, "本地未引用图片", localUnreferenced.length, SelectionSection.LocalUnref);
		const actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (actions) {
			if (this.selection.getCount(SelectionSection.LocalUnref) > 0) {
				const delBtn = actions.createEl("button", { text: `删除 (${this.selection.getCount(SelectionSection.LocalUnref)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除选中的本地未引用图片" } });
				delBtn.addEventListener("click", (e) => { e.stopPropagation(); void this.deleteOps.batchDeleteLocalUnref(localUnreferenced); });
			}
			this.addClearSelectionButton(actions, SelectionSection.LocalUnref);
		}
		const _renderLocalUnref = () => this.renderLocalUnrefByFolder(content, localUnreferenced);
		if (expanded) _renderLocalUnref(); else setLazyRenderFn(content, _renderLocalUnref);
	}

	// ===== Section 4: 云端未引用图片 =====
	private renderCloudUnrefSection(el: HTMLElement) {
		if (!this.plugin.settings.showCloudUnreferenced) return;
		const cloudOnly = this.getCloudOnlyFiles();
		const filteredCloud = this.applyCloudFilter(cloudOnly);
		if (this.searchKeyword && filteredCloud.length === 0) return;

		const grayIcon = getTopBedIcon(filteredCloud.map(f => f.url), true);
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "unreferenced", grayIcon, "云端未引用图片", filteredCloud.length, SelectionSection.CloudFiles);
		if (filteredCloud.length > 0) {
			const actions = header.querySelector<HTMLElement>(".pic-part-actions");
			if (actions) {
				if (this.selection.getCount(SelectionSection.CloudFiles) > 0) {
					this.addCloudFileActions(actions, filteredCloud);
				}
				this.addClearSelectionButton(actions, SelectionSection.CloudFiles);
			}
			const _renderCloudUnref = () => this.renderCloudUnreferencedByBed(content, filteredCloud);
			if (expanded) _renderCloudUnref(); else setLazyRenderFn(content, _renderCloudUnref);
		} else if (!this.cloudLoaded) {
			// 加载中状态：count=0 时 createCollapsibleSection 判定为折叠，需手动展开以显示「正在加载…」
			content.removeClass("pic-part-content--collapsed");
			header.removeClass("pic-part-header--collapsed");
			const arrow = header.querySelector<HTMLElement>(".pic-part-arrow");
			if (arrow) arrow.textContent = "▽";
			content.createDiv({ cls: "pic-cloud-loading", text: "正在加载云端数据..." });
		} else {
			content.createDiv({ cls: "pic-empty", text: "所有云端图片均被笔记引用" });
		}
	}

	// ===== Section 5: 未找到图片 =====
	private renderNotFoundSection(el: HTMLElement, notFoundImages: ImageLink[]) {
		if (!this.plugin.settings.showNotFoundImages || notFoundImages.length === 0) return;

		// P2-13: 使用主题危险色变量适配暗色主题
		const notFoundIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--pic-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "not-found", notFoundIcon, "未找到图片", notFoundImages.length, SelectionSection.NotFoundRefs);
		// 自定义区头 count：「X 篇笔记，Y 项内容」
		//   笔记数 = 引用过未找到图的不同笔记数（按 ref.file 去重）
		//   项数   = 所有引用行展开后的总数（与旧「引用数 · 图片数」中的引用数一致）
		const noteFileSet = new Set<string>();
		let refTotal = 0;
		for (const img of notFoundImages) {
			for (const ref of expandRefs(img)) {
				noteFileSet.add(ref.file);
				refTotal++;
			}
		}
		const countEl = header.querySelector<HTMLElement>(".pic-part-count");
		if (countEl) countEl.textContent = `（${noteFileSet.size} 篇笔记，${refTotal} 项内容）`;
		// 操作按钮由 ActionsRenderer.updateSectionActions 动态管理（来自 getLocalActions[2]）
		// 清除选中按钮需在此处创建一次，后续 updateSectionActions 会保留它
		const actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (actions) {
			this.addClearSelectionButton(actions, SelectionSection.NotFoundRefs);
		}
		const _renderNotFound = () => this.renderNotFoundFlat(content, notFoundImages);
		if (expanded) _renderNotFound(); else setLazyRenderFn(content, _renderNotFound);
	}
	// ===== Section 6: 同名文件 =====
	private renderSameNameSection(el: HTMLElement) {
		const filteredSameName = this.searchKeyword
			? this.sameNameGroups.filter(g => g.fileName.toLowerCase().includes(this.searchKeyword))
			: this.sameNameGroups;
		if (!this.plugin.settings.showSameNameFiles || filteredSameName.length === 0) return;
		const totalItems = filteredSameName.reduce((sum, g) => sum + g.items.length, 0);

		const sameNameIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--pic-text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "same-name", sameNameIcon, "同名文件", totalItems, SelectionSection.SameName);
		const actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (actions) {
			if (!expanded) actions.addClass("pic-part-actions--hidden");
			if (this.selection.getCount(SelectionSection.SameName) > 0) {
				const delBtn = actions.createEl("button", { text: `删除 (${this.selection.getCount(SelectionSection.SameName)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除选中的重复图片" } });
				delBtn.addEventListener("click", (e) => { e.stopPropagation(); void this.deleteSelectedSameName(); });
			}
			this.addClearSelectionButton(actions, SelectionSection.SameName);
		}
		const _renderSameName = () => this.renderSameNameGroups(content, filteredSameName);
		if (expanded) _renderSameName(); else setLazyRenderFn(content, _renderSameName);
	}

	// ===== Section 7: 重复图片 =====
	private renderDedupSection(el: HTMLElement) {
		const filteredDedup = this.searchKeyword
			? this.dedupGroups.filter(g => g.items.some(i => (extractFileName(i.path) || "").toLowerCase().includes(this.searchKeyword)))
			: this.dedupGroups;
		if (!this.plugin.settings.showDuplicates || filteredDedup.length === 0) return;

		const dedupIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--pic-warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>`;
		const groupCount = filteredDedup.length;
		const totalItems = filteredDedup.reduce((sum, g) => sum + g.items.length, 0);
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "duplicates", dedupIcon, "重复图片", totalItems, SelectionSection.Dedup);
		// 覆盖默认计数为「(N组，M张)」格式
		const countEl = header.querySelector<HTMLElement>(".pic-part-count");
		if (countEl) countEl.setText(`${groupCount} 组，${totalItems} 张`);
		const actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (actions) {
			if (!expanded) actions.addClass("pic-part-actions--hidden");
			if (this.selection.getCount(SelectionSection.Dedup) > 0) {
				const delBtn = actions.createEl("button", { text: `删除 (${this.selection.getCount(SelectionSection.Dedup)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除选中的重复图片，将引用更新为组内第一项" } });
				delBtn.addEventListener("click", (e) => { e.stopPropagation(); void this.dedupDeleteSelected(); });
			}
			// 一键替换按钮（受设置开关控制）
			if (this.plugin.settings.enableQuickReplace) {
				this.renderQuickReplaceButtons(actions, filteredDedup);
			}
			this.addClearSelectionButton(actions, SelectionSection.Dedup);
			// 清除哈希缓存：主动失效，下次去重重新计算（解决脏缓存导致云端/本地重复漏判）
			const clearCacheBtn = actions.createEl("button", { text: "清除缓存", cls: "pic-btn-sm pic-part-clear-cache-btn", attr: { title: "清除本地/云端图片哈希缓存，下次去重将重新计算（解决因缓存导致的重复漏判）" } });
			clearCacheBtn.addEventListener("click", (e) => { e.stopPropagation(); void this.clearDedupHashCache(); });
		}
		const _renderDedup = () => this.renderDedupGroups(content, filteredDedup);
		if (expanded) _renderDedup(); else setLazyRenderFn(content, _renderDedup);
	}

	/** 渲染去重区「一键替换」按钮（受设置开关控制），抽成 helper 供重渲染与即时切换复用 */
	private renderQuickReplaceButtons(actions: HTMLElement, groups: DedupGroup[]) {
		const hasLocal = groups.some(g => g.items.some(i => i.source === "local"));
		const hasCloud = groups.some(g => g.items.some(i => i.source === "cloud"));
		const cloudBtn = actions.createEl("button", { text: "替换为云端", cls: "pic-btn-sm pic-btn-primary pic-btn-quick-replace", attr: { title: hasLocal ? "保留云端图片，删除本地图片并更新笔记引用" : "无本地图片可替换" } });
		if (!hasLocal) cloudBtn.disabled = true;
		cloudBtn.addEventListener("click", (e) => { e.stopPropagation(); if (!cloudBtn.disabled) void this.quickReplaceDedup("cloud"); });
		const localBtn = actions.createEl("button", { text: "替换为本地", cls: "pic-btn-sm pic-btn-primary pic-btn-quick-replace", attr: { title: hasCloud ? "保留本地图片，删除云端图片并更新笔记引用" : "无云端图片可替换" } });
		if (!hasCloud) localBtn.disabled = true;
		localBtn.addEventListener("click", (e) => { e.stopPropagation(); if (!localBtn.disabled) void this.quickReplaceDedup("local"); });
	}

	/** 设置开关即时切换：直接对当前去重区 header 增删一键替换按钮，无需整视图重扫 */
	public updateQuickReplaceButtons(show: boolean): void {
		if (this.isClosed) return;
		const header = this.containerEl.querySelector<HTMLElement>('.pic-part-header[data-selection-section="dedup"]');
		if (!header) return;
		const actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (!actions) return;
		// 先移除已有的一键替换按钮
		actions.querySelectorAll(".pic-btn-quick-replace").forEach(b => b.remove());
		if (!show) return;
		// 计算当前去重组是否含本地/云端项，按钮插在「清除缓存」按钮之前
		const hasLocal = this.dedupGroups.some(g => g.items.some(i => i.source === "local"));
		const hasCloud = this.dedupGroups.some(g => g.items.some(i => i.source === "cloud"));
		const clearBtn = actions.querySelector(".pic-part-clear-cache-btn");
		const frag = document.createDocumentFragment();
		const cloudBtn = frag.createEl("button", { text: "替换为云端", cls: "pic-btn-sm pic-btn-primary pic-btn-quick-replace", attr: { title: hasLocal ? "保留云端图片，删除本地图片并更新笔记引用" : "无本地图片可替换" } });
		if (!hasLocal) cloudBtn.disabled = true;
		cloudBtn.addEventListener("click", (e) => { e.stopPropagation(); if (!cloudBtn.disabled) void this.quickReplaceDedup("cloud"); });
		const localBtn = frag.createEl("button", { text: "替换为本地", cls: "pic-btn-sm pic-btn-primary pic-btn-quick-replace", attr: { title: hasCloud ? "保留本地图片，删除云端图片并更新笔记引用" : "无云端图片可替换" } });
		if (!hasCloud) localBtn.disabled = true;
		localBtn.addEventListener("click", (e) => { e.stopPropagation(); if (!localBtn.disabled) void this.quickReplaceDedup("local"); });
		if (clearBtn) actions.insertBefore(frag, clearBtn);
		else actions.appendChild(frag);
	}

	/** 主动清除去重哈希缓存（dedupCache + hashCache），并持久化，避免重载后恢复旧缓存 */
	private async clearDedupHashCache(): Promise<void> {
		const localCount = this.plugin.dedupCache.size ?? 0;
		const cloudCount = this.plugin.hashCache.size ?? 0;
		if (!(await confirmAsync(this.app, { message: `确定清除哈希缓存吗？\n将删除 ${localCount + cloudCount} 条本地/云端图片哈希记录，下次去重会重新计算（耗时稍长但可解决因缓存导致的重复漏判）。`, title: "清除哈希缓存" }))) return;
		this.plugin.dedupCache.clear();
		this.plugin.hashCache.clear();
		await this.plugin.saveSettings();
		new Notice(`已清除 ${localCount + cloudCount} 条哈希缓存`);
	}

	// ===== Section 8: 空白文件夹 =====
	private renderEmptyFoldersSection(el: HTMLElement) {
		if (!this.plugin.settings.showEmptyFolders) return;
		let emptyFolders = this.getEmptyFolders();
		if (this.searchKeyword) {
			emptyFolders = emptyFolders.filter(f => (f.split("/").pop() || "").toLowerCase().includes(this.searchKeyword));
		}
		if (emptyFolders.length === 0) return;

		const emptyIcon = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
		const { header, content, expanded } = this.treeRenderer.createCollapsibleSection(el, "empty-folders", emptyIcon, "空白文件夹", emptyFolders.length, SelectionSection.EmptyFolders);
		const actions = header.querySelector<HTMLElement>(".pic-part-actions");
		if (actions) {
			if (!expanded) actions.addClass("pic-part-actions--hidden");
			if (this.selection.getCount(SelectionSection.EmptyFolders) > 0) {
				const delBtn = actions.createEl("button", { text: `删除 (${this.selection.getCount(SelectionSection.EmptyFolders)})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除选中的空白文件夹" } });
				delBtn.addEventListener("click", (e) => { e.stopPropagation(); void this.deleteOps.batchDeleteEmptyFolders((fp) => this.parseEmptyFolder(fp)); });
			}
			this.addClearSelectionButton(actions, SelectionSection.EmptyFolders);
		}
		const _renderEmpty = () => this.renderEmptyFolders(content, emptyFolders);
		if (expanded) _renderEmpty(); else setLazyRenderFn(content, _renderEmpty);
	}

	/** 添加云端图片操作按钮 */
	private addCloudImageActions(actions: HTMLElement, cloudReferenced: ImageLink[]) {
		const count = this.selection.getCount(SelectionSection.CloudImages);
		actions.createEl("button", { text: `MD (${count})`, cls: "pic-btn-sm", attr: { title: "复制 Markdown 格式图片链接" } })
			.addEventListener("click", (e) => { e.stopPropagation(); void this.batchOps.genericBatchCopy(SelectionSection.CloudImages, cloudReferenced, img => img.pure, img => img.pure, img => extractFileName(img.pure) || img.pure, "markdown"); });
		actions.createEl("button", { text: `HTML (${count})`, cls: "pic-btn-sm", attr: { title: "复制 HTML 格式图片链接" } })
			.addEventListener("click", (e) => { e.stopPropagation(); void this.batchOps.genericBatchCopy(SelectionSection.CloudImages, cloudReferenced, img => img.pure, img => img.pure, img => extractFileName(img.pure) || img.pure, "html"); });
		actions.createEl("button", { text: `下载 (${count})`, cls: "pic-btn-sm", attr: { title: "下载选中的云端图片" } })
			.addEventListener("click", (e) => { e.stopPropagation(); void this.batchOps.genericBatchDownload(SelectionSection.CloudImages, cloudReferenced, img => img.pure, img => img.pure, img => extractFileName(img.pure) || "image", () => this.renderContent()); });
		actions.createEl("button", { text: `删除 (${count})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除引用行和云端图片" } })
			.addEventListener("click", (e) => { e.stopPropagation(); void this.deleteOps.batchDeleteCloudImages(); });
	}

	/** 添加云端文件操作按钮 */
	private addCloudFileActions(actions: HTMLElement, filteredCloud: CloudFile[]) {
		const count = this.selection.getCount(SelectionSection.CloudFiles);
		actions.createEl("button", { text: `MD (${count})`, cls: "pic-btn-sm", attr: { title: "复制 Markdown 格式图片链接" } })
			.addEventListener("click", (e) => { e.stopPropagation(); void this.batchOps.genericBatchCopy(SelectionSection.CloudFiles, filteredCloud, f => f.prefix || f.name, f => f.url, f => extractFileName(f.name) || f.name, "markdown"); });
		actions.createEl("button", { text: `HTML (${count})`, cls: "pic-btn-sm", attr: { title: "复制 HTML 格式图片链接" } })
			.addEventListener("click", (e) => { e.stopPropagation(); void this.batchOps.genericBatchCopy(SelectionSection.CloudFiles, filteredCloud, f => f.prefix || f.name, f => f.url, f => extractFileName(f.name) || f.name, "html"); });
		actions.createEl("button", { text: `下载 (${count})`, cls: "pic-btn-sm", attr: { title: "下载选中的云端图片" } })
			.addEventListener("click", (e) => { e.stopPropagation(); void this.batchOps.genericBatchDownload(SelectionSection.CloudFiles, filteredCloud, f => f.prefix || f.name, f => f.url, f => extractFileName(f.name) || "image"); });
		actions.createEl("button", { text: `删除 (${count})`, cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除选中的云端图片" } })
			.addEventListener("click", (e) => {
				e.stopPropagation();
				const selected = filteredCloud.filter(f => this.selection.isSelected(SelectionSection.CloudFiles, f.prefix || f.name));
				if (selected.length > 0) void this.cleanupUnreferenced(selected);
			});
	}

	/** 恢复选中状态：视觉（checkbox/class）与 SelectionManager 双回写，避免「看着选中、getCount=0」的假恢复 */
	private restoreSelectionState(savedCheckedPaths: Map<string, SelectionSection>) {
		const mainList = this.containerEl.querySelector<HTMLElement>("#pic-main-list");
		if (!mainList) return;

		// 恢复复选框选中状态 + 回写 SelectionManager
		mainList.querySelectorAll<HTMLElement>(".pic-item").forEach(item => {
			const purePath = item.dataset.purePath;
			if (!purePath) return;

			// purePath 可能是 `${section}::${key}` 格式（由 collectCheckedPaths 写入），
			// 也可能是纯 key（旧数据或非 Dedup/SameName 区）。两种都尝试匹配。
			let section = savedCheckedPaths.get(purePath);
			if (!section) {
				// 检查所有已知 section 前缀
				for (const [k, s] of savedCheckedPaths) {
					if (k.endsWith(`::${purePath}`)) { section = s; break; }
				}
			}
			if (section) {
				const cb = item.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
				if (cb) cb.checked = true;
				item.toggleClass("pic-item--selected", true);
				this.selection.select(section, [purePath]);
			}
		});

		// 恢复标签选中状态
		// 先构建选中 tagKey 对应的 tagRef 集合（O(tags) 而非 O(n²)）
		const allTagKeys = [
			...this.selection.getSelected(SelectionSection.LocalTags),
			...this.selection.getSelected(SelectionSection.CloudTags),
			...this.selection.getSelected(SelectionSection.SameNameTags),
			...this.selection.getSelected(SelectionSection.DedupTags),
		];
		const selectedTagRefs = new Set<string>();
		for (const tagKey of allTagKeys) {
			const parsed = parseTagKey(tagKey);
			if (!parsed) continue;
			const img = resolveImageFromTagKey(parsed.keyPrefix, this.localImages);
			if (!img) continue;
			const refs = expandRefs(img);
			if (parsed.index < refs.length) {
				const ref = refs[parsed.index];
				const fileName = ref.file.split("/").pop() || ref.file;
				selectedTagRefs.add(ref.line > 0 ? `${fileName}:${ref.line}` : fileName);
			}
		}
		mainList.querySelectorAll<HTMLElement>(".pic-file-tag").forEach(tag => {
			if (tag.dataset.tagRef && selectedTagRefs.has(tag.dataset.tagRef)) {
				tag.classList.add("pic-file-tag-focus");
			}
		});

		this.updateParentDirCheckboxes();
	}

	/** 设置动态 sticky 功能：检测分区标题是否吸顶，吸顶时加 --stuck class 去掉左右上边框，避免吸顶态出现多余竖线 */
	private setupStickyHeaders() {
		const scrollContainer = this.containerEl.parentElement || this.containerEl;
		// 旧 handler 已在重渲染时移除，这里先清干净再注册
		if (this.stickyScrollHandler) {
			scrollContainer.removeEventListener("scroll", this.stickyScrollHandler);
			this.stickyScrollHandler = null;
		}

		const update = () => {
			const headers = this.containerEl.querySelectorAll<HTMLElement>(".pic-part-header");
			if (headers.length === 0) return;
			const containerTop = scrollContainer.getBoundingClientRect().top;
			headers.forEach((h) => {
				// 直接读取 header 真实吸附位置（已解析 var(--pic-toolbar-h) 的 computed top），
				// 与单独测量 toolbar.offsetHeight 解耦，避免二者因 ResizeObserver 时序/取整不一致而误判；
				// 原逻辑用 `containerTop + toolbarH - 1` 作阈值：header 吸附瞬间其 top 恰等于
				// containerTop + toolbarH，会被误判为“未吸附”，导致 --stuck 永远不触发（吸顶态卡片不收扁）。
				const stickyTopPx = parseFloat(getComputedStyle(h).top) || 0;
				const nowStuck = h.getBoundingClientRect().top <= containerTop + stickyTopPx;
				const wasStuck = h.classList.contains("pic-part-header--stuck");
				if (wasStuck !== nowStuck) {
					h.toggleClass("pic-part-header--stuck", nowStuck);
					// 同步边框：吸顶态切换时立刻刷新，避免视觉不刷新
					syncHeaderStuckClass(h, nowStuck);
				}
			});
		};

		// rAF 节流：滚动事件每帧最多执行一次，避免每帧对每个 header 调 getComputedStyle + getBoundingClientRect
		let rafPending = false;
		const throttled = () => {
			if (rafPending) return;
			rafPending = true;
			window.requestAnimationFrame(() => {
				rafPending = false;
				update();
			});
		};

		this.stickyScrollHandler = throttled;
		scrollContainer.addEventListener("scroll", throttled, { passive: true });
		// 初次渲染也判定一次（处理刷新时已在顶部的标题）
		update();
	}

	// ==================== 通用树渲染 ====================

	/** 从扁平路径列表构建树 */

	/** 递归收集节点及子节点的所有文件 */

	/** 通用树节点渲染 */

	// ==================== 可折叠分区 ====================

	/** 在操作按钮区域末尾添加清除选中按钮 */
	private addClearSelectionButton(actions: HTMLElement, selectionSection: SelectionSection): void {
		const clearBtn = actions.createEl("button", { cls: "pic-part-clear-btn", text: "🧹 清除选中" });
		clearBtn.setCssStyles({ display: "none" }); // 初始隐藏，由 updateClearButtons 控制
		clearBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.selection.clear(selectionSection);
			// 本地图片区域的清除选中同时清除本地标签选中
			if (selectionSection === SelectionSection.LocalImages) {
				this.selection.clear(SelectionSection.LocalTags);
			}
			// 云端图片区域的清除选中同时清除云端标签选中
			if (selectionSection === SelectionSection.CloudImages) {
				this.selection.clear(SelectionSection.CloudTags);
			}
			// 同名文件区域的清除选中同时清除同名标签选中
			if (selectionSection === SelectionSection.SameName) {
				this.selection.clear(SelectionSection.SameNameTags);
			}
			// 重复图片区域的清除选中同时清除去重标签选中
			if (selectionSection === SelectionSection.Dedup) {
				this.selection.clear(SelectionSection.DedupTags);
			}
			this.renderContent();
		});
	}

	/** 创建可折叠分区 */


	/** 渲染引用标签（通用方法，供各 section 复用） */

	/** 云端引用图片项（独立于 renderLocalItem，用 CloudImages + CloudTags） */



	/** 按图床类型分组渲染云端图片 */
	private renderCloudReferencedByBed(container: HTMLElement, images: ImageLink[], selectedSet?: Set<string>) {
		// 按图床分组
		const groups = new Map<ImageBedType, ImageLink[]>();
		for (const img of images) {
			const result = this.compareResult.get(img.pure);
			let bedType: ImageBedType;
			if (result?.bedType) {
				bedType = result.bedType;
			} else if (img.type !== "local") {
				bedType = detectBedTypeFromUrl(img.pure) || ImageBedType.Other;
			} else {
				bedType = ImageBedType.Other;
			}
			if (!groups.has(bedType)) groups.set(bedType, []);
			groups.get(bedType)!.push(img);
		}

		// 按图床类型排序：GitHub → 阿里云 → 腾讯云 → 其他
		const order = BED_TYPE_ORDER;
		const sorted = Array.from(groups.entries()).sort((a, b) => {
			const ia = order.indexOf(a[0]);
			const ib = order.indexOf(b[0]);
			return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
		});

		for (const [bedType, imgs] of sorted) {
			const dirKey = String(bedType);
			// 有搜索时展开；全局展开标志为 true 时也展开；否则根据 dirExpanded 判断
			const expanded = !!this.searchKeyword || this.isAllExpandedByGlobal || this.dirExpanded.has(dirKey);

			const dirHeader = container.createDiv({ cls: "pic-dir-header" });
			dirHeader.setCssStyles({ paddingLeft: "10px" });
			dirHeader.dataset.dirKey = dirKey;
			dirHeader.dataset.depth = "0";
			// 图床头复选框（云端分组）：全选/全清该图床所有图片
			createGroupCheckbox({
				headerEl: dirHeader,
				itemKeys: imgs.map(img => imgSelectKey(img)),
				selection: this.selection,
				section: SelectionSection.CloudImages,
				title: "全选/取消该图床所有引用图片",
				onChange: () => this.actions.updateLocalActions(),
			});
			// 图床头
			const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "▽" : "▶" });
			const iconSpan = dirHeader.createSpan({ cls: "pic-bed-icon" });
			setSafeHTML(iconSpan, getBedFaviconSvg(bedType));
			dirHeader.createSpan({ cls: "pic-dir-name", text: bedType });
			dirHeader.createSpan({ cls: "pic-dir-count", text: `(${imgs.length})` });

			const dirContent = container.createDiv({ cls: "pic-dir-content" + (expanded ? "" : " pic-dir-content--collapsed") });

			dirHeader.addEventListener("click", () => {
				const isCollapsed = isHidden(dirContent);
				dirContent.toggleClass("pic-dir-content--collapsed", !isCollapsed);
				arrow.textContent = isCollapsed ? "▽" : "▶";
				// 用户主动 toggle 后清除全局展开标志，交接控制权给 dirExpanded。
				this.isAllExpandedByGlobal = false;
				// 记录展开/收起状态
				if (isCollapsed) {
					this.dirExpanded.add(dirKey);
				} else {
					this.dirExpanded.delete(dirKey);
				}
				this.saveExpandState();
			});

			// 按文件夹分组渲染
			this.renderCloudReferencedByFolder(dirContent, imgs, selectedSet);
		}
	}

	/** 按 URL 路径分组渲染云端图片（嵌套树） */
	private renderCloudReferencedByFolder(container: HTMLElement, images: ImageLink[], selectedSet?: Set<string>) {
		// 为每个图片解析出文件夹路径
		const pathMap = new Map<ImageLink, string>();
		for (const img of images) {
			let folderPath: string;
			try {
				const url = new URL(img.pure);
				const parts = url.pathname.split("/").filter(Boolean);
				const bedType = detectBedTypeFromUrl(img.pure);
				if (bedType === ImageBedType.GitHub && parts.length > 3) {
					parts.splice(0, 3);
				}
				parts.pop();
				folderPath = parts.join("/");
			} catch {
				folderPath = "";
			}
			pathMap.set(img, folderPath);
		}

		// 使用通用树构建（需要自定义路径逻辑）
		interface CloudTreeNode { files: ImageLink[]; children: Map<string, CloudTreeNode>; }
		const root: CloudTreeNode = { files: [], children: new Map() };
		for (const img of images) {
			const folderPath = pathMap.get(img) || "";
			let node = root;
			if (folderPath) {
				for (const part of folderPath.split("/")) {
					if (!node.children.has(part)) node.children.set(part, { files: [], children: new Map() });
					node = node.children.get(part)!;
				}
			}
			node.files.push(img);
		}

		// 使用通用渲染
		this.treeRenderer.renderTreeNodeGeneric(container, root, 0, {
		getKey: (img) => imgSelectKey(img),
			renderItem: (c, img, sel) => this.itemRenderer.renderCloudReferencedItem(c, img, sel),
			collectFiles: (node) => this.treeRenderer.collectTreeFiles(node),
		}, selectedSet, "", SelectionSection.CloudImages);
	}

	/** 按文件夹路径分组渲染本地图片（嵌套树） */
	private renderLocalGroupedByFolder(container: HTMLElement, images: ImageLink[], selectedSet?: Set<string>) {
		const root = this.treeRenderer.buildTree(images, (img) => img.resolvedPath || img.pure);
		this.treeRenderer.renderTreeNodeGeneric(container, root, 0, {
			getKey: (img) => imgSelectKey(img),
			renderItem: (c, img, sel) => this.itemRenderer.renderLocalItem(c, img, sel),
			collectFiles: (node) => this.treeRenderer.collectTreeFiles(node),
		}, selectedSet);
	}

	/** 按文件夹分组渲染本地未引用图片 */
	private renderLocalUnrefByFolder(container: HTMLElement, files: TFile[]) {
		const root = this.treeRenderer.buildTree(files, (f) => f.path);
		this.treeRenderer.renderTreeNodeGeneric(container, root, 0, {
			getKey: (f) => f.path,
			renderItem: (c, f) => this.itemRenderer.renderLocalUnrefItem(c, f),
			collectFiles: (node) => this.treeRenderer.collectTreeFiles(node),
		}, this.selection.getSet(SelectionSection.LocalUnref), "", SelectionSection.LocalUnref);
	}


	/** 渲染同名文件分组列表 */
	/** 动态更新同名文件的引用数据（保留分组结构，只刷新标签信息） */
	private updateSameNameReferences() {
		for (const group of this.sameNameGroups) {
			for (const item of group.items) {
				if (item.source !== "local") continue;
				const matchedImg = this.localImages.find(i => (i.resolvedPath || i.pure) === item.path);
				if (matchedImg) {
					item.count = matchedImg.count;
					item.section = "本地图片";
				} else {
					// 文件已不在 localImages 中（可能已删除或变为未引用）
					item.count = 0;
					item.section = "本地未引用图片";
				}
			}
		}
		// 移除已失效的组（只剩 1 项或全部为空）
		this.sameNameGroups = this.sameNameGroups.filter(g => g.items.length >= 2);
		this.saveSameNameData();
	}

	private renderSameNameGroups(
		container: HTMLElement,
		groups: typeof this.sameNameGroups,
	) {
		for (const group of groups) {
			this.renderSameNameGroup(container, group);
		}
	}

	/** 渲染单个同名文件组 */
	private renderSameNameGroup(container: HTMLElement, group: typeof this.sameNameGroups[0]) {
		const groupEl = container.createDiv({ cls: "pic-dedup-group" });
		// 组头：与其他区域一致的 .pic-item 布局
		const groupHeader = groupEl.createDiv({ cls: "pic-item pic-dedup-hash" });
		// 文件夹图标
		const dirIconEl = groupHeader.createSpan({ cls: "pic-dir-icon" });
		setSafeHTML(dirIconEl, `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`);
		groupHeader.createSpan({ cls: "pic-path", text: `${group.fileName}  (${group.items.length} 项)` });
		// 组头复选框：全选/全清该组所有同名项
		const sameNameKeys = group.items.map(item => `${item.source}:${item.url || item.path}`);
		createGroupCheckbox({
			headerEl: groupHeader,
			itemKeys: sameNameKeys,
			selection: this.selection,
			section: SelectionSection.SameName,
			title: "全选/取消该组所有同名图片",
			onChange: () => { this.actions.updateSameNameActions(); this.updateParentDirCheckboxes(); },
		});

		// 各条目：每个条目显示自己的缩略图，方便辨别同名但不同内容的图片
		for (const item of group.items) {
			const itemEl = groupEl.createDiv({ cls: "pic-item" });
			const itemKey = `${item.source}:${item.url || item.path}`;

			// 点击空白区域切换选中状态
			itemEl.addEventListener("click", (e) => {
				const target = e.target as HTMLElement;
				if (target.closest("input, img, .pic-file-tag, button")) return;
				this.setCurrentItem(itemEl);
				const isSelected = this.selection.isSelected(SelectionSection.SameName, itemKey);
				if (isSelected) this.selection.deselect(SelectionSection.SameName, itemKey);
				else this.selection.select(SelectionSection.SameName, [itemKey]);
				const cb = itemEl.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
				if (cb) cb.checked = !isSelected;
				itemEl.toggleClass("pic-item--selected", !isSelected);
				this.actions.updateSameNameActions();
				this.updateParentDirCheckboxes();
			});

			// 复选框在左边
			const cb = itemEl.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
			cb.checked = this.selection.isSelected(SelectionSection.SameName,itemKey);
			cb.addEventListener("click", (e) => e.stopPropagation());
			cb.addEventListener("change", () => {
				if (cb.checked) this.selection.select(SelectionSection.SameName,[itemKey]);
				else this.selection.deselect(SelectionSection.SameName,itemKey);
				itemEl.toggleClass("pic-item--selected", cb.checked);
				this.actions.updateSameNameActions();
				this.updateParentDirCheckboxes();
			});
				// 组头全选/全清时，子项 checkbox 反向同步（createGroupCheckbox 只同步组头自身，不碰子项 DOM）
				this.selection.onChange((changedSection: SelectionSection) => {
					if (changedSection !== SelectionSection.SameName) return;
					const sel = this.selection.isSelected(SelectionSection.SameName, itemKey);
					cb.checked = sel;
					itemEl.toggleClass("pic-item--selected", sel);
				});
			if (item.source === "local") {
				// 缩略图（与其他区域一致：直接内联，file 找不到时回退 broken 占位符而非静默）
				const localPath = item.path;
				const file = this.app.vault.getAbstractFileByPath(localPath);
				const localDisplay = this.plugin.settings.showPath ? withRootPrefix(localPath) : withRootPrefix(localPath.split("/").pop() || localPath);
				if (file instanceof TFile) {
					const thumbSrc = this.app.vault.getResourcePath(file);
					const thumb = itemEl.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: thumbSrc, loading: "lazy" } });
					thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); createThumbBrokenPlaceholder(itemEl); });
					thumb.addEventListener("click", (e) => { e.stopPropagation(); showImagePreview(thumbSrc); });
				} else {
					createThumbBrokenPlaceholder(itemEl);
				}
				itemEl.createSpan({ cls: "pic-path", text: localDisplay, attr: { title: localDisplay } });
				itemEl.dataset.purePath = itemKey;
				// 引用标签
				const matchedImg = this.localImages.find(i => (i.resolvedPath || i.pure) === item.path);
				if (matchedImg) {
					this.itemRenderer.renderTags(itemEl, matchedImg, SelectionSection.SameNameTags, `${item.source}:${item.path}`);
				}
			} else {
				// 缩略图（云端图片：内联以确保 thumbSrc 为空时也有占位符）
				const cloudUrl = item.url;
				const cloudDisplay = cloudUrl || item.path;
				if (cloudUrl) {
					const thumb = itemEl.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: cloudUrl, loading: "lazy" } });
					thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); createThumbBrokenPlaceholder(itemEl); });
					thumb.addEventListener("click", (e) => { e.stopPropagation(); showImagePreview(cloudUrl); });
				} else {
					createThumbBrokenPlaceholder(itemEl);
				}
				itemEl.createSpan({ cls: "pic-path", text: cloudDisplay, attr: { title: cloudDisplay } });
				itemEl.dataset.purePath = itemKey;
				// 引用标签
				const matchedCloudImg = this.localImages.find(i => i.pure === (item.url || item.path));
				if (matchedCloudImg && matchedCloudImg.files.length > 0) {
					this.itemRenderer.renderTags(itemEl, matchedCloudImg, SelectionSection.SameNameTags, `${item.source}:${item.url || item.path}`);
				}
			}
			// 悬浮删除按钮
			const actions = itemEl.createDiv({ cls: "pic-actions" });
			const delBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: item.source === "local" ? "删除本地文件" : "删除云端文件" } });
			delBtn.addEventListener("click", onAsyncClick(async (e) => {
				e.stopPropagation();
				const itemName = item.source === "local" ? (item.path.split("/").pop() || item.path) : (item.url || item.path);
				if (!(await confirmAsync(this.app, { message: `确定要删除「${itemName}」吗？`, title: "删除图片" }))) return;
				let ok = false;
				try {
					if (item.source === "local") {
						const file = this.app.vault.getAbstractFileByPath(item.path);
						if (file instanceof TFile) {
							await this.app.fileManager.trashFile(file);
							ok = true;
						} else {
							console.warn("[PicLinker] 本地文件不存在:", item.path);
						}
					} else {
						const bedType = item.bedType || this.selectedBed;
						const result = await this.plugin.deleteCloudFile(this.resolveCloudFileKey(item.url || item.path), bedType);
						if (result.success) {
							ok = true;
						} else {
							console.warn("[PicLinker] 云端删除失败:", result.error, item.url || item.path, bedType);
						}
					}
				} catch (e) {
					console.error("[PicLinker] 删除异常:", e);
				}
				if (ok) {
					// 删除笔记中的引用行（从 localImages 获取引用数据）
					try {
						const refImg = this.localImages.find(i => (i.resolvedPath || i.pure) === (item.url || item.path));
						if (refImg) {
							const failedFiles: string[] = [];
							for (const fp of refImg.files) {
								try {
									await this.plugin.linkEditor.removeImageFromMdFile(fp, [item.url || item.path]);
								} catch {
									failedFiles.push(fp);
								}
							}
							if (failedFiles.length > 0) {
								const names = failedFiles.map(f => f.split("/").pop() || f).join("、");
								new Notice(`图片已删除，但引用行清理失败，请手动修改 ${names} 笔记`, 8000);
							}
						}
					} catch (e) {
						console.warn("[PicLinker] 引用行删除失败:", e);
						new Notice("图片已删除，但引用行清理失败，请手动修改笔记", 8000);
					}
					new Notice(`已删除「${itemName}」`);
					// 从 sameNameGroups 中移除
					for (const g of this.sameNameGroups) {
						g.items = g.items.filter(i => !(i.source === item.source && (i.url || i.path) === (item.url || item.path)));
					}
					this.sameNameGroups = this.sameNameGroups.filter(g => g.items.length >= 2);
					this.saveSameNameData();
					this.selection.deselect(SelectionSection.SameName, itemKey);
					this.renderContent();
				} else {
					new Notice(`删除失败: ${itemName}`);
				}
			}));
		}
	}

	/** 为图片项添加缩略图 */

	/** 按文件夹分组渲染未找到图片 */
	private renderNotFoundFlat(container: HTMLElement, images: ImageLink[]) {
		// 按引用笔记分组：key=笔记路径，value=该笔记里的未找到引用列表（{img, ref}）
		type RefEntry = { img: ImageLink; ref: TagRef };
		const groups = new Map<string, RefEntry[]>();
		for (const img of images) {
			for (const ref of expandRefs(img)) {
				if (!groups.has(ref.file)) groups.set(ref.file, []);
				groups.get(ref.file)!.push({ img, ref });
			}
		}
		// 笔记路径字典序排序，让组顺序稳定（不同刷新之间不变）
		const sortedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
		for (const [filePath, entries] of sortedGroups) {
			this.renderNotFoundGroup(container, filePath, entries);
		}
	}

	/** 渲染一个引用笔记组：组头 = 复选框 + ▽/▶ + 笔记路径 + 子项列表 */
	private renderNotFoundGroup(container: HTMLElement, filePath: string, entries: Array<{ img: ImageLink; ref: TagRef }>) {
		const groupEl = container.createDiv({ cls: "pic-dedup-group pic-notfound-group" });
		const groupHeader = groupEl.createDiv({ cls: "pic-item pic-dedup-hash pic-notfound-header" });
		// 默认展开；点击组头可折叠/展开
		let collapsed = false;
		// 收集该组所有 itemKey（与 renderNotFoundRefItem 中一致：优先 refIndex，回退 file::line）
		const groupItemKeys: string[] = [];
		for (const { img, ref } of entries) {
			const expandedRefs = expandRefs(img);
			const refIndex = expandedRefs.findIndex(r => r.file === ref.file && r.line === ref.line);
			groupItemKeys.push(refIndex >= 0 ? `${img.pure}::${refIndex}` : `${img.pure}::${ref.file}::${ref.line}`);
		}
		// 组头复选框（统一 helper：createGroupCheckbox）
		createGroupCheckbox({
			headerEl: groupHeader,
			itemKeys: groupItemKeys,
			selection: this.selection,
			section: SelectionSection.NotFoundRefs,
			title: "全选/取消该组所有引用行",
			onChange: () => this.actions.updateLocalActions(),
		});
		// ▽/▶ 折叠箭头（与 TreeRenderer 风格一致）
		const arrow = groupHeader.createSpan({ cls: "pic-dir-arrow", text: "▼" });
		const dirIconEl = groupHeader.createSpan({ cls: "pic-dir-icon" });
		setSafeHTML(dirIconEl, `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`);
		// 分组标题：showPath 关 = 仅文件名（含 .md），开 = 完整笔记路径
		const noteTitleText = this.plugin.settings.showPath ? filePath : (filePath.split("/").pop() || filePath);
		groupHeader.createSpan({ cls: "pic-path", text: `${noteTitleText}  (${entries.length} 项)`, attr: { title: filePath } });
		const groupContent = groupEl.createDiv({ cls: "pic-notfound-content" });
		groupHeader.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest("input, button")) return;
			collapsed = !collapsed;
			groupContent.toggleClass("pic-notfound-content--collapsed", collapsed);
			groupHeader.toggleClass("pic-notfound-header--collapsed", collapsed);
			arrow.textContent = collapsed ? "▶" : "▼";
		});
		for (const { img, ref } of entries) {
			this.itemRenderer.renderNotFoundRefItem(groupContent, img, ref);
		}
		// 子项 change 事件由 createGroupCheckbox helper 自动监听（绑在 groupHeader 上），无需手动绑定
	}

	/** 渲染空白文件夹列表 */
	/** 解析空白文件夹路径：本地路径或 [cloud:bedType] prefix */
	private parseEmptyFolder(folderPath: string): { isCloud: boolean; bedType?: ImageBedType; path: string } {
		const match = folderPath.match(/^\[cloud:([^\]]+)\]\s*(.+)$/);
		if (match) {
			return { isCloud: true, bedType: match[1] as ImageBedType, path: match[2] };
		}
		return { isCloud: false, path: folderPath };
	}

	private renderEmptyFolders(container: HTMLElement, folders: string[]) {
		for (const folderPath of folders) {
			const info = this.parseEmptyFolder(folderPath);
			const item = container.createDiv({ cls: "pic-item" });

			item.dataset.purePath = folderPath;
			// 复选框
			const cb = item.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
			const isSelected = this.selection.isSelected(SelectionSection.EmptyFolders, folderPath);
			cb.checked = isSelected;
			cb.addEventListener("change", () => {
				if (cb.checked) this.selection.select(SelectionSection.EmptyFolders,[folderPath]);
				else this.selection.deselect(SelectionSection.EmptyFolders,folderPath);
				item.toggleClass("pic-item--selected", cb.checked);
				this.actions.updateEmptyFolderActions();
				this.updateParentDirCheckboxes();
			});
			// 初始选中态视觉同步（与 item--selected 规范一致）
			item.toggleClass("pic-item--selected", isSelected);

			// 图标（云端显示图床图标，本地显示文件夹图标）
			if (info.isCloud && info.bedType) {
				const iconSpan = item.createSpan({ cls: "pic-dedup-icon" });
				setSafeHTML(iconSpan, getBedFaviconSvg(info.bedType));
			}

			// 文件夹路径
			const displayPath = info.isCloud ? info.path : folderPath;
			const pathSpan = item.createSpan({ cls: "pic-path", text: displayPath, title: folderPath });
			pathSpan.classList.add("clickable");

			// 操作按钮
			const actions = item.createDiv({ cls: "pic-actions" });
			const deleteBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除空白文件夹" } });
			deleteBtn.addEventListener("click", onAsyncClick(async (e) => {
				e.stopPropagation();
				const displayPath = info.isCloud ? info.path : folderPath;
				if (!(await confirmAsync(this.app, { message: `确定要删除文件夹「${displayPath}」吗？`, title: "删除文件夹" }))) return;
				try {
					if (info.isCloud && info.bedType) {
						// 云端文件夹删除
						const result = await this.plugin.deleteCloudFile(info.path, info.bedType);
						if (result.success) {
							new Notice(`已删除「${displayPath}」`);
						} else {
							new Notice(`删除失败: ${result.error}`);
						}
					} else {
						// 本地文件夹删除
						await this.app.vault.adapter.rmdir(folderPath, false);
						new Notice(`已删除「${displayPath}」`);
					}
					this.emptyFoldersCache = null;
					this.renderContent();
				} catch (e) {
					new Notice(`删除失败: ${e instanceof Error ? e.message : String(e)}`);
				}
			}));
		}
	}

	/** 按图床分组渲染云端未引用文件 */
	private renderCloudUnreferencedByBed(container: HTMLElement, files: CloudFile[]) {
		// 按图床分组
		const groups = new Map<ImageBedType, CloudFile[]>();
		for (const file of files) {
			const bt = file.bedType || detectBedTypeFromUrl(file.url) || ImageBedType.Other;
			if (!groups.has(bt)) groups.set(bt, []);
			groups.get(bt)!.push(file);
		}

		// 按图床类型排序：GitHub → 阿里云 → 腾讯云 → 其他
		const order = BED_TYPE_ORDER;
		const sorted = Array.from(groups.entries()).sort((a, b) => {
			const ia = order.indexOf(a[0]);
			const ib = order.indexOf(b[0]);
			return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
		});

		for (const [bedType, bedFiles] of sorted) {
			const dirKey = String(bedType);
			// 有搜索时展开；全局展开标志为 true 时也展开；否则根据 dirExpanded 判断
			const expanded = !!this.searchKeyword || this.isAllExpandedByGlobal || this.dirExpanded.has(dirKey);

			const dirHeader = container.createDiv({ cls: "pic-dir-header" });
			dirHeader.setCssStyles({ paddingLeft: "10px" });
			dirHeader.dataset.dirKey = dirKey;
			dirHeader.dataset.depth = "0";
			// 图床头复选框（云端未引用分组）：全选/全清该图床所有未引用图
			createGroupCheckbox({
				headerEl: dirHeader,
				itemKeys: bedFiles.map(f => f.prefix || f.name),
				selection: this.selection,
				section: SelectionSection.CloudFiles,
				title: "全选/取消该图床所有未引用图片",
				onChange: () => this.actions.updateLocalUnrefActions(),
			});
			// 图床头
			const arrow = dirHeader.createSpan({ cls: "pic-dir-arrow", text: expanded ? "▽" : "▶" });
			const iconSpan = dirHeader.createSpan({ cls: "pic-bed-icon" });
			setSafeHTML(iconSpan, getBedFaviconSvg(bedType));
			dirHeader.createSpan({ cls: "pic-dir-name", text: bedType });
			dirHeader.createSpan({ cls: "pic-dir-count", text: `(${bedFiles.length})` });

			const dirContent = container.createDiv({ cls: "pic-dir-content" + (expanded ? "" : " pic-dir-content--collapsed") });

			dirHeader.addEventListener("click", () => {
				const isCollapsed = isHidden(dirContent);
				dirContent.toggleClass("pic-dir-content--collapsed", !isCollapsed);
				arrow.textContent = isCollapsed ? "▽" : "▶";
				// 用户主动 toggle 后清除全局展开标志，交接控制权给 dirExpanded。
				this.isAllExpandedByGlobal = false;
				// 记录展开/收起状态
				if (isCollapsed) {
					this.dirExpanded.add(dirKey);
				} else {
					this.dirExpanded.delete(dirKey);
				}
				this.saveExpandState();
			});

			// 按文件夹分组渲染
			this.renderCloudGroupedByFolder(dirContent, bedFiles, bedType);
		}
	}

	/** 按文件夹路径分组渲染云端文件（嵌套树） */
	private renderCloudGroupedByFolder(el: HTMLElement, files: CloudFile[], breadcrumb: string = "") {
		const root = this.treeRenderer.buildTree(files, (f) => f.prefix || f.name);
		this.treeRenderer.renderTreeNodeGeneric(el, root, 0, {
			getKey: (f) => f.prefix || f.name,
			renderItem: (c, f) => this.itemRenderer.renderCloudItem(c, f),
			collectFiles: (node) => this.treeRenderer.collectTreeFiles(node),
		}, this.selection.getSet(SelectionSection.CloudFiles), breadcrumb, SelectionSection.CloudFiles);
	}

	/** 等待云端数据加载完成，超时返回 false */
	private waitForCloudData(timeoutMs: number): Promise<boolean> {
		if (!this.cloudLoading) return Promise.resolve(true);
		return new Promise<boolean>((resolve) => {
			const timer = window.setTimeout(() => {
				// 超时：移除等待者并返回 false
				this.cloudDataResolvers = this.cloudDataResolvers.filter(r => r !== wrappedResolve);
				resolve(false);
			}, timeoutMs);
			const wrappedResolve = () => {
				window.clearTimeout(timer);
				resolve(true);
			};
			this.cloudDataResolvers.push(wrappedResolve);
		});
	}

	// ==================== 去重功能 ====================

	/** 执行去重扫描 */
	private async runDedup(selectedOnly: boolean) {
		if (this.isDedupRunning) {
			new Notice("去重正在执行中，请稍候...");
			return;
		}
		this.isDedupRunning = true;

		try {
		// 等待云端数据加载完成（如果正在加载中）
		if (this.cloudLoading) {
			new Notice("正在等待云端数据加载完成...");
			const loaded = await this.waitForCloudData(30000);
			if (!loaded) {
				new Notice("云端数据加载超时，请稍后再试");
				return;
			}
		}

		// 直接使用选中状态集合，而不是从 DOM 中读取
		const selectedLocalPaths = new Set<string>();
		const selectedCloudNames = new Set<string>();
		// 云端「图片(CloudImages)」区选中项：key 是按 URL 的 pure，不应混入本地集合；
		// 单独收集供云端哈希循环命中（修复「选中云端图片去重被静默忽略」）。
		const selectedCloudPures = new Set<string>();
		if (selectedOnly) {

			// 从 selectedLocalImages 中收集本地图片路径
			const localImagesSelected = this.selection.getSelected(SelectionSection.LocalImages);
			for (const path of localImagesSelected) {
				selectedLocalPaths.add(path);
			}

			// 从 selectedCloudImages 中收集云端图片 URL（走云端哈希路径，不混入本地）
			const cloudImagesSelected = this.selection.getSelected(SelectionSection.CloudImages);
			for (const path of cloudImagesSelected) {
				selectedCloudPures.add(path);
			}

			// 从 selectedLocalUnref 中收集本地未引用图片路径
			const localUnrefSelected = this.selection.getSelected(SelectionSection.LocalUnref);
			for (const path of localUnrefSelected) {
				selectedLocalPaths.add(path);
			}

			// 从 selectedCloudFiles 中收集云端文件名
			const cloudFilesSelected = this.selection.getSelected(SelectionSection.CloudFiles);
			for (const path of cloudFilesSelected) {
				selectedCloudNames.add(path);
			}

			// 从 selectedNotFoundImages 中收集未找到图片路径
			const notFoundSelected = this.selection.getSelected(SelectionSection.NotFoundRefs);
			for (const path of notFoundSelected) {
				selectedLocalPaths.add(path);
			}

			// 从 selectedTags 中收集标签选中的路径
			const localTagsSelected = this.selection.getSelected(SelectionSection.LocalTags);
			const cloudTagsSelected = this.selection.getSelected(SelectionSection.CloudTags);
			const sameNameTagsSelected = this.selection.getSelected(SelectionSection.SameNameTags);
			const dedupTagsSelected = this.selection.getSelected(SelectionSection.DedupTags);

			for (const tagKey of [...localTagsSelected, ...cloudTagsSelected, ...sameNameTagsSelected, ...dedupTagsSelected]) {
				const parsed = parseTagKey(tagKey);
				if (!parsed) continue;
				// 从 tagKey 反查实际图片标识，而非直接用 keyPrefix（SameName/Dedup 的 keyPrefix 带 source 前缀）
				const img = resolveImageFromTagKey(parsed.keyPrefix, this.localImages);
				if (img) {
					selectedLocalPaths.add(imgSelectKey(img));
					// 同时添加 resolvedPath，处理本地未引用图等
					if (img.resolvedPath) selectedLocalPaths.add(img.resolvedPath);
				}
			}


			if (selectedLocalPaths.size === 0 && selectedCloudNames.size === 0 && selectedCloudPures.size === 0) {
				// 判断用户是否选了标签但不是图片（如仅选了 SameNameTags/DedupTags 且反查不到 img）
				const hasAnyTag = this.selection.getSelected(SelectionSection.LocalTags).length > 0
					|| this.selection.getSelected(SelectionSection.CloudTags).length > 0
					|| this.selection.getSelected(SelectionSection.SameNameTags).length > 0
					|| this.selection.getSelected(SelectionSection.DedupTags).length > 0;
				if (hasAnyTag) {
					new Notice("所选标签对应的图片未找到，请直接选中图片项后再去重");
				} else {
					new Notice("未选中图片，双击「去重」按钮可执行全库去重");
				}
				return;
			}
		} else {
			// 选中了图片，仅对选中项去重
		}

		// 第一步：计算本地图片哈希
		const localHashMap = new Map<string, ImageLink[]>();
		// 收集所有需要处理的本地图片（包括未引用的本地图片）
		const allLocalImages: ImageLink[] = [];
		const addedPaths = new Set<string>();


		// 添加 this.localImages 中的图片（被笔记引用的图片）
		for (const img of this.localImages) {
			if (img.type !== "local") continue;
			// 选中模式：有选中本地图片时只处理选中的，否则全量
			if (selectedOnly && selectedLocalPaths.size > 0 && !selectedLocalPaths.has(imgSelectKey(img))) continue;
			allLocalImages.push(img);
			addedPaths.add(img.resolvedPath || img.pure);
		}


		// 添加本地未引用图片（库中存在但未被笔记引用的图片）
		// 全局模式：添加所有未引用图片；选中模式：只添加选中的
		const unreferenced = this.getLocalUnreferencedImages();

		for (const file of unreferenced) {
			if (selectedOnly && selectedLocalPaths.size > 0 && !selectedLocalPaths.has(file.path)) continue;
			if (addedPaths.has(file.path)) continue;
			allLocalImages.push({
				raw: `![[${file.name}]]`,
				pure: file.path,
				params: "",
				type: "local",
				count: 0,
				files: [],
				resolvedPath: file.path,
				found: true,
			});
			addedPaths.add(file.path);
		}


		for (const img of allLocalImages) {
			const filePath = img.resolvedPath || img.pure;
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (!(file instanceof TFile)) {
				continue;
			}

			let hash: string | null = null;
			const cached = this.plugin.dedupCache.get(filePath);
			if (cached && cached.mtime === file.stat.mtime) {
				hash = cached.hash;
			} else {
				try {
					// 传入 TFile + app，桌面端改为分块读取以降内存峰值；
					// 哈希结果与原先 readBinary→Blob 完全一致。
					const newHash = await HashCache.computeHash(file, this.app);
					// mtime 变了但内容可能没变（如 touch 命令），对比哈希决定是否更新缓存
					if (cached && cached.hash === newHash) {
						// 内容未变，只更新 mtime
						this.plugin.dedupCache.set({ ...cached, mtime: file.stat.mtime, computedAt: Date.now() });
					} else {
						this.plugin.dedupCache.set({ hash: newHash, source: "local", path: filePath, mtime: file.stat.mtime, computedAt: Date.now() });
					}
					hash = newHash;
				} catch (e) {
					console.warn("[PicLinker] 计算哈希失败:", filePath, e);
					continue;
				}
			}
			if (!localHashMap.has(hash)) localHashMap.set(hash, []);
			localHashMap.get(hash)!.push(img);
		}


		// 第二步：计算云端文件哈希（按文件大小预筛，避免下载所有文件）
		const cloudHashMap = new Map<string, CloudFile[]>();
		// 收集需要处理的云端文件
		const cloudFilesToProcess: CloudFile[] = [];
		for (const file of this.cloudFiles) {
			if (file.isDirectory) continue;
			// 非图片不参与去重：避免把任意大文件（视频/压缩包）全量下载进内存
			const ext = (file.name.split(".").pop() || "").toLowerCase();
			if (!IMAGE_EXTENSIONS.has(ext)) continue;
			if (selectedOnly) {
				// CloudImages 区选中的云端图片 URL 命中本文件？
				const cloudImgHit = selectedCloudPures.size > 0 && selectedCloudPures.has(file.url);
				// 进入条件：选了 CloudFiles 区、或 CloudImages 区有选中且本文件命中
				if (selectedCloudNames.size === 0 && this.selection.getCount(SelectionSection.CloudFiles) === 0 && !cloudImgHit) continue;
				// 命中判断：用 file.prefix||file.name（避免带路径前缀的 key 永远匹配不到 file.name 的死分支）；
				// 同时命中 CloudImages 选中 URL 时放行
				const byCloudFiles = selectedCloudNames.size > 0
					&& !selectedCloudNames.has(file.prefix || file.name)
					&& !this.selection.isSelected(SelectionSection.CloudFiles, file.prefix || file.name);
				if (!cloudImgHit && byCloudFiles) continue;
			}
			// 已有缓存的直接使用
			const cached = this.plugin.dedupCache.get(file.url);
			if (cached) {
				if (!cloudHashMap.has(cached.hash)) cloudHashMap.set(cached.hash, []);
				cloudHashMap.get(cached.hash)!.push(file);
			} else {
				cloudFilesToProcess.push(file);
			}
		}

		// 对未缓存文件：下载全文计算哈希，用于与本地图片做内容比对（跨文件名 / 跨格式去重）。
		// 注意：图片不同格式（webp/png/jpg）内容相同但字节大小不同，按「大小唯一即跳过下载」的
		// 预筛会漏掉跨格式重复（云端 webp / 本地 png 大小不同必漏 → 云端名A、本地名B 漏判）。
		// 因此不再按大小预筛跳过，改为全量下载未缓存云端文件；靠 dedupCache 缓存 + 并发限流保护：
		// 首次较慢，之后命中缓存秒回。
		let skippedDownload = 0; // 因下载失败被跳过的云端文件数（诊断用）
		if (cloudFilesToProcess.length > 0) {
			const CONCURRENCY = 12;
			const total = cloudFilesToProcess.length;
			let done = 0;
			const downloadOne = async (file: CloudFile) => {
				try {
					const response = await requestUrl({ url: file.url });
					const buffer = response.arrayBuffer;
					const hashBytes = await crypto.subtle.digest("SHA-256", buffer);
					const hash = Array.from(new Uint8Array(hashBytes)).map(b => b.toString(16).padStart(2, "0")).join("");
					this.plugin.dedupCache.set({ hash, source: "cloud", path: file.url, bedType: file.bedType, computedAt: Date.now() });
					if (!cloudHashMap.has(hash)) cloudHashMap.set(hash, []);
					cloudHashMap.get(hash)!.push(file);
				} catch (e) {
					skippedDownload++;
					console.warn("[PicLinker] 云端文件下载失败，跳过:", file.url, e instanceof Error ? e.message : String(e));
				}
			};
		// 分批并发下载（避免大库瞬间打满请求；Promise.allSettled 不因个别失败中断整体）
		for (let i = 0; i < cloudFilesToProcess.length; i += CONCURRENCY) {
			// 视图已关闭：中止下载，不再占用网络/内存
			if (this.isClosed) return;
			const batch = cloudFilesToProcess.slice(i, i + CONCURRENCY);
				await Promise.allSettled(batch.map(downloadOne));
				done += batch.length;
				if (total > 20 && (done % 60 === 0 || done === total)) {
					new Notice(`去重中：已处理云端文件 ${done}/${total}`);
				}
			}
		}

		// 第三步：匹配（P1-5: 按 hash 统一分组，避免同一 hash 被三个循环推成多个组）
		const groups: DedupGroup[] = [];
		const allHashes = new Set([...localHashMap.keys(), ...cloudHashMap.keys()]);

		for (const hash of allHashes) {
			const localImgs = localHashMap.get(hash) || [];
			const cloudFiles = cloudHashMap.get(hash) || [];
			const hasLocalDup = localImgs.length > 1;
			const hasCross = localImgs.length >= 1 && cloudFiles.length >= 1;
			const total = localImgs.length + cloudFiles.length;
			if (total < 2) continue;

			// 确定去重类型：cross 优先 → local → cloud
			let type: DedupGroup["type"];
			if (hasCross) {
				type = "cross";
			} else if (hasLocalDup) {
				type = "local";
			} else {
				type = "cloud";
			}

			groups.push({
				hash,
				type,
				items: [
					...localImgs.map(img => ({
						path: img.resolvedPath || img.pure,
						source: "local" as const,
						referenced: img.files.length,
						img,
					})),
					...cloudFiles.map(f => ({
						path: f.url,
						source: "cloud" as const,
						bedType: f.bedType,
						file: f,
					})),
				],
			});
		}


		// 增量更新：合并新发现的重复组与之前的结果
		if (selectedOnly) {
			// 增量模式：只添加新发现的重复组，保留之前的结果
			const existingHashes = new Set(this.dedupGroups.map(g => g.hash));
			for (const group of groups) {
				if (!existingHashes.has(group.hash)) {
					this.dedupGroups.push(group);
				}
			}
		} else {
			// 全量模式：替换所有结果
			this.dedupGroups = groups;
		}

		this.selection.clear(SelectionSection.Dedup);
		// 持久化去重缓存和去重结果
		await this.plugin.saveSettings();
		this.saveDedupGroups();
		this.renderContent();


		if (groups.length === 0) {
			new Notice("没有发现重复图片");
		} else {
			new Notice(`发现 ${groups.length} 组重复图片`);
		}
		if (skippedDownload > 0) {
			new Notice(`有 ${skippedDownload} 个云端文件因下载失败被跳过（可能为防盗链/CORS/签名过期），可查看控制台了解详情`);
		}
		} finally {
			this.isDedupRunning = false;
		}
	}

	/** 渲染去重分组列表 */
	private renderDedupGroups(content: HTMLElement, groups: DedupGroup[] = this.dedupGroups) {
		// 现在 renderContent 开头 removeAllListeners() 统一清理，dedupRenderOffs 保留作为双重保险
		for (const off of this.dedupRenderOffs) off();
		this.dedupRenderOffs = [];

		// 直接按重复内容分组展示
		for (const group of groups) {
			const groupEl = content.createDiv({ cls: "pic-dedup-group" });

			// 组标题：显示哈希值和数量，不显示缩略图
			const groupHeader = groupEl.createDiv({ cls: "pic-item pic-dedup-hash" });
			const hashDisplay = group.hash.length > 16
				? `${group.hash.substring(0, 8)}···${group.hash.substring(group.hash.length - 8)}`
				: group.hash;
		// 组头复选框：全选/全清该重复组
		const dedupKeys = group.items.map(item => `${item.source}:${item.path}`);
		const grpCb = createGroupCheckbox({
			headerEl: groupHeader,
			itemKeys: dedupKeys,
			selection: this.selection,
			section: SelectionSection.Dedup,
			title: "全选/取消该组所有重复图片",
			onChange: () => { this.actions.updateDedupActions(); this.updateParentDirCheckboxes(); },
		});
		this.dedupRenderOffs.push(grpCb.off);
			groupHeader.createSpan({ cls: "pic-path", text: `${hashDisplay}  (${group.items.length} 项)` });

			for (const item of group.items) {
				const itemEl = groupEl.createDiv({ cls: "pic-item" });
				const itemKey = `${item.source}:${item.path}`;

				// 点击空白区域切换选中状态
				itemEl.addEventListener("click", (e) => {
					const target = e.target as HTMLElement;
					if (target.closest("input, img, .pic-file-tag, button")) return;
					this.setCurrentItem(itemEl);
					const isSelected = this.selection.isSelected(SelectionSection.Dedup, itemKey);
					if (isSelected) this.selection.deselect(SelectionSection.Dedup, itemKey);
					else this.selection.select(SelectionSection.Dedup, [itemKey]);
					const cb = itemEl.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
					if (cb) cb.checked = !isSelected;
					itemEl.toggleClass("pic-item--selected", !isSelected);
					this.actions.updateDedupActions();
					this.updateParentDirCheckboxes();
				});

				itemEl.dataset.purePath = itemKey;
				const cb = itemEl.createEl("input", { type: "checkbox", cls: "pic-cloud-checkbox" });
				cb.checked = this.selection.isSelected(SelectionSection.Dedup,itemKey);
				cb.addEventListener("click", (e) => e.stopPropagation());
				cb.addEventListener("change", () => {
					if (cb.checked) {
						this.selection.select(SelectionSection.Dedup,[itemKey]);
					} else {
						this.selection.deselect(SelectionSection.Dedup,itemKey);
					}
					itemEl.toggleClass("pic-item--selected", cb.checked);
					this.actions.updateDedupActions();
					this.updateParentDirCheckboxes();
				});
			// 组头全选/全清时，子项 checkbox 反向同步（createGroupCheckbox 只同步组头自身，不碰子项 DOM）
			const syncDedupItem = (changedSection: SelectionSection) => {
				if (changedSection !== SelectionSection.Dedup) return;
				const sel = this.selection.isSelected(SelectionSection.Dedup, itemKey);
				cb.checked = sel;
				itemEl.toggleClass("pic-item--selected", sel);
			};
			this.selection.onChange(syncDedupItem);
			this.dedupRenderOffs.push(() => this.selection.off(syncDedupItem));

				if (item.source === "local") {
					// 缩略图（与其他区域一致）
					const resolvedPath = item.path;
					const file = this.app.vault.getAbstractFileByPath(resolvedPath);
					if (file instanceof TFile) {
						const thumbSrc = this.app.vault.getResourcePath(file);
						const thumb = itemEl.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: thumbSrc, loading: "lazy" } });
						thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); createThumbBrokenPlaceholder(itemEl); });
						thumb.addEventListener("click", (e) => { e.stopPropagation(); showImagePreview(thumbSrc); });
					}
					const localDisplay = this.plugin.settings.showPath ? withRootPrefix(item.path) : withRootPrefix(item.path.split("/").pop() || item.path);
					itemEl.createSpan({ cls: "pic-path", text: localDisplay, attr: { title: localDisplay } });
				} else {
					// 缩略图（云端图片）
					const thumbSrc = item.path;
					const thumb = itemEl.createEl("img", { cls: "pic-thumb pic-thumb-clickable", attr: { src: thumbSrc, loading: "lazy" } });
					thumb.addEventListener("error", () => { thumb.setCssStyles({ display: "none" }); createThumbBrokenPlaceholder(itemEl); });
					thumb.addEventListener("click", (e) => { e.stopPropagation(); showImagePreview(thumbSrc); });
					itemEl.createSpan({ cls: "pic-path", text: item.path, attr: { title: item.path } });
				}
				// 引用标签（始终从 localImages 获取最新引用数据）
				const matchedDedupImg = this.localImages.find(i => (i.resolvedPath || i.pure) === item.path);
				if (matchedDedupImg && matchedDedupImg.files.length > 0) {
					this.itemRenderer.renderTags(itemEl, matchedDedupImg, SelectionSection.DedupTags, item.path);
				}
				// 悬浮删除按钮
				const actions = itemEl.createDiv({ cls: "pic-actions" });
				const delBtn = actions.createEl("button", { text: "删除", cls: "pic-btn-sm pic-btn-danger", attr: { title: "删除此项，引用将更新为保留项" } });
				delBtn.addEventListener("click", onAsyncClick(async (e) => {
					e.stopPropagation();
					const itemName = item.source === "local" ? (item.path.split("/").pop() || item.path) : (extractFileName(item.path) || item.path);
					if (!(await confirmAsync(this.app, { message: `确定要删除「${itemName}」吗？\n引用将自动更新为组内保留项。`, title: "删除重复项" }))) return;
					// 确定保留项：排除当前项后，选引用次数最高（云端优先）的
					const remaining = group.items.filter(i => i !== item);
					const keepItem = remaining.reduce((best, cur) => {
						const bestScore = (best.source === "cloud" ? (best.referenced || 0) + 1000 : (best.referenced || 0));
						const curScore = (cur.source === "cloud" ? (cur.referenced || 0) + 1000 : (cur.referenced || 0));
						return curScore > bestScore ? cur : best;
					}, remaining[0]);
					let ok = false;
					try {
						if (item.source === "local") {
							const file = this.app.vault.getAbstractFileByPath(item.path);
							if (file instanceof TFile) {
								await this.app.fileManager.trashFile(file);
								this.plugin.dedupCache.remove(item.path);
								ok = true;
							} else {
								console.warn("[PicLinker] 本地文件不存在:", item.path);
							}
						} else {
							const bedType = item.bedType || this.selectedBed;
							const result = await this.plugin.deleteCloudFile(this.resolveCloudFileKey(item.path), bedType);
							if (result.success) {
								this.plugin.dedupCache.remove(item.path);
								ok = true;
							} else {
								console.warn("[PicLinker] 云端删除失败:", result.error, item.path, bedType);
							}
						}
					} catch (e) {
						console.error("[PicLinker] 删除异常:", e);
					}
					// 引用更新（独立于文件删除，失败不影响删除结果）
					if (ok && keepItem) {
						let freshImg: ImageLink | undefined;
						try {
							// 保留项在笔记正文中的目标写法：云端优先用 URL，本地用其 pure（原始链接文本）
							// bestCloud 必须来自“保留集合”(remaining)，避免误用已删除的云端项 URL
							const bestCloud = remaining.find(i => i.source === "cloud");
							const keepPath = bestCloud ? bestCloud.path : (keepItem.source === "local" ? (keepItem.img?.pure || keepItem.path) : keepItem.path);
							// 从 localImages 获取最新的引用文件列表（用 vault 路径反查）
						freshImg = this.localImages.find(i => (i.resolvedPath || i.pure) === item.path);
							// oldPath 必须是被删除项在笔记正文中真实出现的文本：
							//   本地项 → 其 ImageLink.pure（item.path 是 vault 解析路径，笔记里匹配不到）
							//   云端项 → item.path 本身即 URL
							const oldPath = item.source === "local"
								? (freshImg?.pure ?? item.img?.pure ?? item.path)
								: item.path;
							await this.plugin.linkEditor.replaceImageInMdFiles(oldPath, keepPath, freshImg?.files);
						} catch (e) {
							console.warn("[PicLinker] 引用更新失败:", e);
							const names = (freshImg?.files ?? []).map(f => f.split("/").pop() || f).join("、");
							new Notice(
								names ? `图片已删除，但引用更新失败，请手动修改 ${names} 笔记` : "图片已删除，但引用更新失败，请手动修改笔记",
								8000
							);
						}
					}
					if (ok) {
						new Notice(`已删除「${itemName}」`);
						// 从 dedupGroups 中移除
						group.items = group.items.filter(i => i !== item);
						this.dedupGroups = this.dedupGroups.filter(g => g.items.length >= 2);
						this.selection.deselect(SelectionSection.Dedup, itemKey);
					this.selection.clear(SelectionSection.DedupTags);
						this.saveDedupGroups();
						this.renderContent();
					} else {
						new Notice(`删除失败: ${itemName}`);
					}
				}));
			}
		}
	}

	/** 选中变化时统一调用的更新方法 */
	private onSelectionChange(section: SelectionSection): void {
		// 按 section 分发到对应的更新方法
		switch (section) {
			case SelectionSection.LocalImages:
			case SelectionSection.LocalTags:
				this.actions.updateLocalActions();
				break;
			case SelectionSection.CloudImages:
			case SelectionSection.CloudTags:
				this.actions.updateLocalActions();
				break;
			case SelectionSection.LocalUnref:
				this.actions.updateLocalUnrefActions();
				break;
			case SelectionSection.CloudFiles:
				this.actions.updateLocalUnrefActions();
				break;
			case SelectionSection.SameName:
			case SelectionSection.SameNameTags:
				this.actions.updateSameNameActions();
				break;
			case SelectionSection.Dedup:
			case SelectionSection.DedupTags:
				this.actions.updateDedupActions();
				break;
			case SelectionSection.EmptyFolders:
				this.actions.updateEmptyFolderActions();
				break;
			case SelectionSection.NotFoundRefs:
				this.actions.updateLocalActions();
				break;
		}
	}

	/** 批量删除选中的空白文件夹 */

	/** 删除选中的同名文件 */
	private async deleteSelectedSameName() {
		if (this.selection.getCount(SelectionSection.SameName) === 0) { new Notice("请先选择要删除的重复图片"); return; }

		// 构建要删除的项目列表
		const items: Array<{ key: string; type: 'local' | 'cloud'; path: string; bedType?: ImageBedType; refText?: string }> = [];
		for (const itemKey of this.selection.getSelected(SelectionSection.SameName)) {
			const sepIdx = itemKey.indexOf(":");
			const source = itemKey.substring(0, sepIdx) as 'local' | 'cloud';
			const path = itemKey.substring(sepIdx + 1);

			// 查找 bedType
			let bedType: ImageBedType | undefined;
			if (source === 'cloud') {
				for (const group of this.sameNameGroups) {
					const found = group.items.find(i => (i.source === "cloud" && (i.url || i.path) === path));
					if (found?.bedType) { bedType = found.bedType; break; }
				}
				// 跨组查不到 bedType 时跳过该条目并提示
				if (!bedType) {
					new Notice(`无法确定云端图片「${path}」的图床类型，已跳过`);
					continue;
				}
			}

			// refText = 该项在笔记正文中真实出现的链接文本（ImageLink.pure），供引用清理匹配。
			// 本地：path 是 vault 路径（resolvedPath||pure），需反查 pure；云端：path 即 URL，通常就是 pure。
			const refText = source === 'local'
				? (this.localImages.find(i => (i.resolvedPath || i.pure) === path)?.pure ?? path)
				: path;

			items.push({ key: itemKey, type: source, path, bedType, refText });
		}

		await this.deleteOps.batchDeleteWithCleanup({
			section: SelectionSection.SameName,
			confirmMessage: `确定要删除选中的 ${items.length} 个重复图片吗？`,
			items,
			deleteReferences: true,
			onDeleteLocal: async (path: string) => {
				const file = this.app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile) {
					await this.app.fileManager.trashFile(file);
					return true;
				}
				return false;
			},
			onDeleteCloud: async (path: string, bedType: ImageBedType) => {
				// 云端 path 是完整 URL，deleteCloudFile 需要对象 key（prefix||name），
				// 须先经 resolveCloudFileKey 反查，与 :1754/:2462/:2671 保持一致。
				const result = await this.plugin.deleteCloudFile(this.resolveCloudFileKey(path), bedType);
				return result.success;
			},
			onAfterDelete: async (deletedKeys: Set<string>) => {
				// 从 sameNameGroups 中移除已删除的条目
				for (const group of this.sameNameGroups) {
					group.items = group.items.filter(i => {
						const key = `${i.source}:${i.url || i.path}`;
						return !deletedKeys.has(key);
					});
				}
				this.sameNameGroups = this.sameNameGroups.filter(g => g.items.length >= 2);
				this.saveSameNameData();
			},
		});
	}

	/** 删除选中的重复项，引用更新为组内引用次数最多的项 */
	private async dedupDeleteSelected() {
		if (this.selection.getCount(SelectionSection.Dedup) === 0) {
			new Notice("请先选择要删除的重复图片");
			return;
		}

		if (!(await confirmAsync(this.app, { message: `确定要删除选中的 ${this.selection.getCount(SelectionSection.Dedup)} 个重复图片吗？\n引用将切换为组内保留项。`, title: "删除重复图片" }))) {
			return;
		}

		let deleteSuccess = 0;
		let deleteFail = 0;
		let updateSuccess = 0;

		for (const group of this.dedupGroups) {
			const toDelete = group.items.filter(item => this.selection.isSelected(SelectionSection.Dedup,`${item.source}:${item.path}`));
			if (toDelete.length === 0) continue;

			// 保留项 = 组内【未被选中删除】的项里评分最高者（云端优先 +1000 权重）。
			// 关键：基于 toDelete 反向推导，而非“永远云端优先”——
			// 用户选本地项删除 → 保留云端；用户选云端项删除 → 保留本地（修复跨端组删云端项为 no-op）。
			const remaining = group.items.filter(item => !toDelete.includes(item));
			const keepItem = remaining.reduce((best, item) => {
				const bestScore = (best.source === "cloud" ? (best.referenced || 0) + 1000 : (best.referenced || 0));
				const itemScore = (item.source === "cloud" ? (item.referenced || 0) + 1000 : (item.referenced || 0));
				return itemScore > bestScore ? item : best;
			}, remaining[0]);
			if (!keepItem) {
				// 整组全部选中删除 → 无保留项，跳过该组以免误删，并提示用户
				new Notice("某重复组已全部选中，请至少保留一项（或改用全库去重清理）");
				continue;
			}

			for (const item of toDelete) {
				if (item.path === keepItem.path) continue; // 不删除保留项

				// newPath 必须是“保留项 keepItem”在笔记中应写成的文本（且 keepItem 必定存活）：
				// 保留云端时用云端 URL（keepItem.path）；保留本地时用该本地项的 pure（原始链接文本）
				// 不再直接用“组内第一个云端项”，避免该云端项本身也被选中删除而重新断链
				const keepPath = keepItem.source === "local"
					? (keepItem.img?.pure || keepItem.path)
					: keepItem.path;

				try {
					if (item.source === "local") {
						// 删除本地文件
						const file = this.app.vault.getAbstractFileByPath(item.path);
						if (file instanceof TFile) {
							await this.app.fileManager.trashFile(file);
							this.plugin.dedupCache.remove(item.path);
							deleteSuccess++;
						} else {
							deleteFail++;
				continue;
						}
					} else {
						// 删除云端文件（先反查对象 key；删除失败则跳过引用替换，避免「引用已改、云端图还在」脏态）
						const bedType = item.bedType || this.selectedBed;
						const result = await this.plugin.deleteCloudFile(this.resolveCloudFileKey(item.path), bedType);
						if (result.success) {
							this.plugin.dedupCache.remove(item.path);
							deleteSuccess++;
						} else {
							deleteFail++;
							continue;
						}
					}

					// 从 localImages 获取最新的引用文件列表（用 vault 路径反查）
					const freshImg = this.localImages.find(i => (i.resolvedPath || i.pure) === item.path);
					// oldPath 必须是被删除项在笔记正文中真实出现的文本：
					// 本地项用其 ImageLink.pure（item.path 是 vault 解析路径，正文里匹配不到）；云端项 item.path 即 URL
					const oldPath = item.source === "local"
						? (freshImg?.pure ?? item.img?.pure ?? item.path)
						: item.path;
					const replacedCount = await this.plugin.linkEditor.replaceImageInMdFiles(oldPath, keepPath, freshImg?.files);
					updateSuccess += replacedCount;
				} catch {
					deleteFail++;
				}
			}
		}

		// 从 dedupGroups 中移除已删除的条目，保留仅含 2+ 项的组
		for (const group of this.dedupGroups) {
		// 保留项 = 组内【未被选中删除】的项里评分最高者（与执行阶段一致，避免选到已删项持久化脏数据）
		const remaining = group.items.filter(item => !this.selection.isSelected(SelectionSection.Dedup, `${item.source}:${item.path}`));
		// 全选组无剩余项 → 整组移除（无可保留），跳过 reduce 避免 remaining[0] undefined 崩溃
		if (remaining.length === 0) continue;
		const keepItem = remaining.reduce((best, item) => {
			const bestScore = (best.source === "cloud" ? (best.referenced || 0) + 1000 : (best.referenced || 0));
			const itemScore = (item.source === "cloud" ? (item.referenced || 0) + 1000 : (item.referenced || 0));
			return itemScore > bestScore ? item : best;
		}, remaining[0]);
			group.items = group.items.filter(item =>
				item === keepItem || !this.selection.isSelected(SelectionSection.Dedup,`${item.source}:${item.path}`)
			);
		}
		this.dedupGroups = this.dedupGroups.filter(g => g.items.length >= 2);

		this.selection.clear(SelectionSection.Dedup);
		this.selection.clear(SelectionSection.DedupTags);
		this.saveDedupGroups();
		await this.refresh();

		const parts: string[] = [];
		if (deleteSuccess > 0) parts.push(`${deleteSuccess} 个图片已删除`);
		if (updateSuccess > 0) parts.push(`${updateSuccess} 处引用已更新`);
		if (deleteFail > 0) parts.push(`${deleteFail} 个失败`);
		new Notice(`去重完成：${parts.join("，")}`);
	}

	/**
	 * 一键替换：遍历所有去重组，保留 keepSide 侧、删除另一侧、替换全库引用。
	 * @param keepSide "cloud" = 保留云端删本地；"local" = 保留本地删云端
	 */
	private async quickReplaceDedup(keepSide: "cloud" | "local"): Promise<void> {
		const deleteSide: "local" | "cloud" = keepSide === "cloud" ? "local" : "cloud";
		const sideLabel = keepSide === "cloud" ? "云端" : "本地";
		// 统计可执行的组和待删除文件数
		let executableGroups = 0;
		let totalToDelete = 0;
		for (const group of this.dedupGroups) {
			const keepers = group.items.filter(i => i.source === keepSide);
			const deleters = group.items.filter(i => i.source === deleteSide);
			if (keepers.length === 0 || deleters.length === 0) continue;
			executableGroups++;
			totalToDelete += deleters.length;
		}
		if (executableGroups === 0) {
			new Notice("当前没有同时包含本地和云端图片的重复组");
			return;
		}

		const skipCount = this.dedupGroups.length - executableGroups;
		const skipHint = skipCount > 0 ? `（${skipCount} 组不满足条件已跳过）` : "";
		const message = keepSide === "cloud"
			? `将删除 ${totalToDelete} 张本地图片，笔记引用统一替换为云端链接，确定？${skipHint}`
			: `将删除 ${totalToDelete} 张云端图片，笔记引用统一替换为本地路径，确定？${skipHint}`;
		if (!(await confirmAsync(this.app, { message, title: `一键替换为${sideLabel}` }))) return;

		let deleteSuccess = 0;
		let deleteFail = 0;
		let updateSuccess = 0;

		for (const group of this.dedupGroups) {
			const keepers = group.items.filter(i => i.source === keepSide);
			const deleters = group.items.filter(i => i.source === deleteSide);
			if (keepers.length === 0 || deleters.length === 0) continue;

			// 选评分最高的保留项（复用现有评分逻辑：云端 +1000）
			const keepItem = keepers.reduce((best, item) => {
				const bestScore = (best.source === "cloud" ? (best.referenced || 0) + 1000 : (best.referenced || 0));
				const itemScore = (item.source === "cloud" ? (item.referenced || 0) + 1000 : (item.referenced || 0));
				return itemScore > bestScore ? item : best;
			}, keepers[0]);

			// 保留项在笔记中应写成的文本
			const keepPath = keepItem.source === "local"
				? (keepItem.img?.pure || keepItem.path)
				: keepItem.path;

			for (const item of deleters) {
				try {
					if (item.source === "local") {
						const file = this.app.vault.getAbstractFileByPath(item.path);
						if (file instanceof TFile) {
							await this.app.fileManager.trashFile(file);
							this.plugin.dedupCache.remove(item.path);
							deleteSuccess++;
						} else {
							deleteFail++;
				continue;
						}
					} else {
						// 删除云端文件
						const bedType = item.bedType || this.selectedBed;
						const result = await this.plugin.deleteCloudFile(this.resolveCloudFileKey(item.path), bedType);
						if (result.success) {
							this.plugin.dedupCache.remove(item.path);
							deleteSuccess++;
						} else {
							deleteFail++;
							continue; // 云端删除失败则跳过引用替换
						}
					}

					// 替换全库引用
					const freshImg = this.localImages.find(i => (i.resolvedPath || i.pure) === item.path);
					const oldPath = item.source === "local"
						? (freshImg?.pure ?? item.img?.pure ?? item.path)
						: item.path;
					const replacedCount = await this.plugin.linkEditor.replaceImageInMdFiles(oldPath, keepPath, freshImg?.files);
					updateSuccess += replacedCount;
				} catch {
					deleteFail++;
				}
			}
		}

		// 清理去重组：仅处理实际有删除的组（含 deleteSide 项的组），移除已删项，移除仅剩 1 项的组
		for (const group of this.dedupGroups) {
			// 跳过纯同侧组（未参与替换，不碰）
			if (!group.items.some(i => i.source === deleteSide)) continue;
			group.items = group.items.filter(i => i.source === keepSide);
		}
		this.dedupGroups = this.dedupGroups.filter(g => g.items.length >= 2);

		this.selection.clear(SelectionSection.Dedup);
		this.selection.clear(SelectionSection.DedupTags);
		this.saveDedupGroups();
		await this.refresh();

		const parts: string[] = [];
		if (deleteSuccess > 0) parts.push(`${deleteSuccess} 个图片已删除`);
		if (updateSuccess > 0) parts.push(`${updateSuccess} 处引用已更新`);
		if (deleteFail > 0) parts.push(`${deleteFail} 个失败`);
		new Notice(`一键替换完成：${parts.join("，")}`);
	}

	// ==================== 搜索过滤 ====================

	private applyLocalFilter(images: ImageLink[]): ImageLink[] {
		if (!this.searchKeyword) return images;
		const kw = this.searchKeyword.toLowerCase();
		return images.filter(img => {
			const fileName = (extractFileName(img.resolvedPath || img.pure) || "").toLowerCase();
			return fileName.includes(kw);
		});
	}

	// ==================== 跳转 & 复制功能 ====================

	/**
	 * 双击路径 → 复制图片路径（或文件名，可设置）
	 */
	private copyImagePath(img: ImageLink) {
		const displayPath = img.resolvedPath || img.pure;
		const copyTarget = displayPath; // 后续可通过设置改为只取 fileName

		navigator.clipboard.writeText(copyTarget).then(() => {
			new Notice(`已复制路径「${copyTarget}」`);
		}).catch(() => {
			new Notice("PicLinker：复制失败，请重试");
		});
	}

	/** 更新所有目录复选框的 checked/indeterminate 状态 */
	private updateParentDirCheckboxes() {
		const mainList = this.containerEl.querySelector<HTMLElement>("#pic-main-list");
		if (!mainList) return;

		/** 计算某个文件夹内容的选中聚合状态（递归到子文件夹）：
		 *  - checked：所有后代文件复选框都被勾选
		 *  - indeterminate：部分后代文件被勾选（或子文件夹处于半选）
		 * 直接子项包括：直接文件项 (.pic-item) 与各直接子文件夹 (.pic-dir-header) */
		const computeState = (content: HTMLElement): { checked: boolean; indeterminate: boolean } => {
			let total = 0, selected = 0, anyPartial = false;
			for (const child of Array.from(content.children)) {
				if (child.classList.contains("pic-item")) {
					total++;
					const cb = child.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
					if (cb && cb.checked) selected++;
				} else if (child.classList.contains("pic-dir-header")) {
					// B-8: 跳过已折叠的子目录，避免幽灵子项污染父级 indeterminate 计算
					const subContent = child.nextElementSibling as HTMLElement | null;
					if (subContent && subContent.classList.contains("pic-dir-content--collapsed")) continue;
					const cb = child.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
					if (cb && subContent && subContent.classList.contains("pic-dir-content")) {
						const st = computeState(subContent);
						total++;
						if (st.checked) selected++;
						if (st.indeterminate) anyPartial = true;
					}
				}
			}
			return {
				checked: total > 0 && selected === total,
				indeterminate: anyPartial || (selected > 0 && selected < total),
			};
		};

		// 从最深的目录开始向上更新
		const dirHeaders = Array.from(mainList.querySelectorAll<HTMLElement>(".pic-dir-header[data-dir-key]"));
		// 按深度降序排列（深的在前）
		dirHeaders.sort((a, b) => {
			const depthA = parseInt(a.dataset.depth || "0", 10);
			const depthB = parseInt(b.dataset.depth || "0", 10);
			return depthB - depthA;
		});

		for (const dirHeader of dirHeaders) {
			const dirContent = dirHeader.nextElementSibling as HTMLElement;
			if (!dirContent || !dirContent.classList.contains("pic-dir-content")) continue;

			const dirCb = dirHeader.querySelector<HTMLInputElement>(".pic-cloud-checkbox");
			if (!dirCb) continue;

			// 文件夹可能直接包含文件项，也可能只包含子文件夹；任一情况都参与聚合
			const state = computeState(dirContent);

			dirCb.checked = state.checked;
			dirCb.indeterminate = state.indeterminate;
			// 文件夹头高亮：全选→选中态（蓝条+底色），半选→强调色背景，否则移除
			dirHeader.toggleClass("pic-dir-header--selected", state.checked);
			dirHeader.toggleClass("pic-dir-header--partial", state.indeterminate);
		}
	}

	/**
	 * 打开指定笔记并跳转到此图片的引用位置
	 */
	private async jumpToFile(img: ImageLink, filePath: string, lineNumber?: number) {
		const abstractFile = this.plugin.app.vault.getAbstractFileByPath(filePath);
		if (!abstractFile || !(abstractFile instanceof TFile)) {
			new Notice(`笔记不存在：${filePath}`);
			return;
		}

		try {
			const leaf = this.plugin.app.workspace.getLeaf(false);
			await leaf.openFile(abstractFile, { active: true });

			// 尝试在编辑器中定位到图片
			const editorView = this.plugin.app.workspace.activeEditor;
			if (editorView?.editor) {
				// 如果有行号，直接跳转到该行
				if (lineNumber && lineNumber > 0) {
					const line = Math.max(0, lineNumber - 1); // 转为 0-based
					editorView.editor.setCursor({ line: line, ch: 0 });
					editorView.editor.scrollIntoView({ from: { line: Math.max(0, line - 3), ch: 0 }, to: { line: line + 5, ch: 0 } }, true);
				} else {
					// 搜索图片路径定位
					const content = editorView.editor.getValue();
					const searchStr = img.raw || img.pure;
					const pos = content.indexOf(searchStr);
					if (pos !== -1) {
						const { line } = editorView.editor.offsetToPos(pos);
						editorView.editor.setCursor({ line: line, ch: 0 });
						editorView.editor.scrollIntoView({ from: { line: Math.max(0, line - 3), ch: 0 }, to: { line: line + 5, ch: 0 } }, true);
					}
				}
			}
		} catch {
			new Notice(`无法打开笔记：${filePath}`);
		}
	}

	/**
	 * 获取本地未引用的图片（库中存在但未被任何笔记引用的图片文件）
	 */
	/** 未引用图片缓存（localImages 变更时置 null 失效） */
	private unreferencedCache: TFile[] | null = null;

	private getLocalUnreferencedImages(): TFile[] {
		if (this.unreferencedCache !== null) return this.unreferencedCache;
		// 基于 path 精确判断是否被引用：按文件名误判会隐藏「同名但未引用」的文件（如
		// assets/a.png 被引用、assets/backup/b.png 未引用且同名 → b.png 会被错误隐藏）。
		const referencedPaths = new Set<string>();
		for (const img of this.localImages) {
			if (img.type === "local") {
				referencedPaths.add(img.resolvedPath || img.pure);
			}
		}
		this.unreferencedCache = this.app.vault.getFiles().filter((f) => {
			const ext = f.extension.toLowerCase();
			if (!IMAGE_EXTENSIONS.has(ext)) return false;
			if (referencedPaths.has(f.path)) return false;
			return true;
		});
		return this.unreferencedCache;
	}

	/**
	 * 获取云端未引用的图片（不被任何本地笔记引用的）
	 */
	private getCloudOnlyFiles(): CloudFile[] {
		// 按 URL 判定引用（笔记里的远程图片链接 pure 即云端 URL），
		// 不再按文件名引用计数——同名不同图的本地文件会误遮蔽云端未引用文件
		const referencedUrls = new Set(
			this.localImages.filter(img => img.type !== "local").map(img => img.pure)
		);
		return this.cloudFiles.filter(
			(f) => !f.isDirectory && !referencedUrls.has(f.url)
		);
	}

	/**
	 * 获取空白文件夹（不包含任何文件或子文件夹的文件夹）
	 */
	private getEmptyFolders(): string[] {
		if (this.emptyFoldersCache) return this.emptyFoldersCache;
		const emptyFolders: string[] = [];

		// 本地空白文件夹
		const allFiles = this.app.vault.getFiles();
		const allFolders = this.app.vault.getAllLoadedFiles().filter(
			(f): f is TFolder => f instanceof TFolder
		);

		// 预建路径前缀集合，避免 O(n*m) 遍历
		const filePaths = new Set(allFiles.map(f => f.path));
		const folderPaths = new Set(allFolders.map(f => f.path));
		const nonEmptyFolders = new Set<string>();
		// 任何文件或子文件夹的存在意味着其所有祖先目录都非空
		for (const fp of filePaths) {
			const parts = fp.split("/");
			for (let i = 1; i < parts.length; i++) {
				nonEmptyFolders.add(parts.slice(0, i).join("/"));
			}
		}
		for (const fp of folderPaths) {
			const parts = fp.split("/");
			for (let i = 1; i < parts.length; i++) {
				nonEmptyFolders.add(parts.slice(0, i).join("/"));
			}
		}

		for (const folder of allFolders) {
			if (!folder.path || folder.path === "/" || folder.path.startsWith(".")) continue;
			if (!nonEmptyFolders.has(folder.path)) {
				emptyFolders.push(folder.path);
			}
		}

		// 云端空白文件夹（从 delimiter 列表获取所有目录，与文件列表对比找空目录）
		if (this.cloudLoaded && this.cloudAllDirs.length > 0) {
			// 收集有文件的目录前缀
			const dirsHasFile = new Set<string>();
			for (const f of this.cloudFiles) {
				if (!f.isDirectory && f.prefix) {
					const parts = f.prefix.split("/");
					for (let i = 1; i < parts.length; i++) {
						dirsHasFile.add(parts.slice(0, i).join("/") + "/");
					}
				}
			}

			// 空目录 = 在 allDirs 中但不在 hasFile 中
			for (const { dir, bedType } of this.cloudAllDirs) {
				if (!dirsHasFile.has(dir)) {
					emptyFolders.push(`[cloud:${bedType}] ${dir}`);
				}
			}
		}

		// 去重 + 按路径深度降序排列
		const unique = [...new Set(emptyFolders)];
		this.emptyFoldersCache = unique.sort((a, b) => {
			const depthA = a.split("/").length;
			const depthB = b.split("/").length;
			return depthB - depthA;
		});
		return this.emptyFoldersCache;
	}

	private applyCloudFilter(files: CloudFile[]): CloudFile[] {
		if (!this.searchKeyword) return files;
		const kw = this.searchKeyword.toLowerCase();
		return files.filter(f => {
			const name = f.name?.toLowerCase() || "";
			const prefix = f.prefix?.toLowerCase() || "";
			return name.includes(kw) || prefix.includes(kw);
		});
	}

	// ==================== 云端未引用清理 ====================

	private async cleanupUnreferenced(files: CloudFile[]) {
		const count = files.length;
		if (!(await confirmAsync(this.app, { message: `确定要删除选中的 ${count} 个云端图片吗？`, title: "删除云端图片" }))) return;

		let success = 0;
		let failed = 0;
		for (const file of files) {
			const bedType = file.bedType || this.selectedBed;
			const result = await this.plugin.deleteCloudFile(file.prefix || file.name, bedType);
			if (result.success) success++; else failed++;
		}

		this.selection.clear(SelectionSection.CloudFiles);
		new Notice(`批量删除完成：成功 ${success} 个，失败 ${failed} 个`);
		await this.refresh();
	}

	/** 更新删除选中按钮的计数和禁用状态 */

	// ==================== 批量操作相关 ====================


	/** 批量复制云端文件为 Markdown 格式 */

	/** 批量复制云端文件为 HTML 格式 */

	/** 批量下载云端文件 */

	// ==================== 通用批量删除 ====================

	/**
	 * 通用批量删除方法
	 * @param section 选中区域
	 * @param confirmMessage 确认对话框消息
	 * @param items 要删除的项目列表
	 * @param deleteReferences 是否删除笔记引用
	 * @param onDeleteLocal 删除本地文件的回调
	 * @param onDeleteCloud 删除云端文件的回调
	 * @param onAfterDelete 删除完成后的回调（用于清理数据）
	 */

	/** 批量删除选中的本地未引用图片 */

	// ==================== 工具方法 ====================






}

