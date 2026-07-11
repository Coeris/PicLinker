/**
 * 统一的选中状态管理
 * 统一管理 12 个区域的选中状态（8 个数据区 + 4 个标签区）
 */

export enum SelectionSection {
	LocalImages = "localImages",
	CloudImages = "cloudImages",
	LocalUnref = "localUnref",
	CloudFiles = "cloudFiles",
	NotFound = "notFound",
	Dedup = "dedup",
	SameName = "sameName",
	EmptyFolders = "emptyFolders",
	LocalTags = "localTags",
	CloudTags = "cloudTags",
	SameNameTags = "sameNameTags",
	DedupTags = "dedupTags",
}

export type SelectionChangeCallback = (section: SelectionSection) => void;

export class SelectionManager {
	private selections = new Map<SelectionSection, Set<string>>();
	private onChangeCallbacks: SelectionChangeCallback[] = [];

	constructor() {
		// 初始化所有 section 的选中集
		for (const section of Object.values(SelectionSection)) {
			this.selections.set(section, new Set());
		}
	}

	/** 注册选中变化回调 */
	onChange(callback: SelectionChangeCallback): void {
		this.onChangeCallbacks.push(callback);
	}

	/** 移除选中变化回调 */
	off(callback: SelectionChangeCallback): void {
		this.onChangeCallbacks = this.onChangeCallbacks.filter(cb => cb !== callback);
	}

	/** 触发变化通知 */
	private notify(section: SelectionSection): void {
		for (const cb of this.onChangeCallbacks) cb(section);
	}

	/** 切换选中状态 */
	toggle(section: SelectionSection, key: string): void {
		const set = this.selections.get(section)!;
		if (set.has(key)) {
			set.delete(key);
		} else {
			set.add(key);
		}
		this.notify(section);
	}

	/** 批量选中 */
	select(section: SelectionSection, keys: string[]): void {
		const set = this.selections.get(section)!;
		for (const key of keys) { set.add(key); }
		this.notify(section);
	}

	/** 取消选中 */
	deselect(section: SelectionSection, key: string): void {
		this.selections.get(section)?.delete(key);
		this.notify(section);
	}

	/** 清空指定 section */
	clear(section: SelectionSection): void {
		this.selections.get(section)?.clear();
		this.notify(section);
	}

	/** 清空所有 section */
	clearAll(): void {
		for (const set of this.selections.values()) {
			set.clear();
		}
	}

	/** 是否已选中 */
	isSelected(section: SelectionSection, key: string): boolean {
		return this.selections.get(section)?.has(key) ?? false;
	}

	/** 获取选中的 key 列表 */
	getSelected(section: SelectionSection): string[] {
		return [...(this.selections.get(section) ?? [])];
	}

	/** 获取选中数量 */
	getCount(section: SelectionSection): number {
		return this.selections.get(section)?.size ?? 0;
	}

	/** 获取指定 section 的选中集（用于批量操作需要 Set 的场景） */
	getSet(section: SelectionSection): Set<string> {
		return this.selections.get(section) ?? new Set();
	}

	/** 检查是否有任何 section 有选中项 */
	hasAnySelection(): boolean {
		for (const set of this.selections.values()) {
			if (set.size > 0) return true;
		}
		return false;
	}
}
