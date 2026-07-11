/**
 * 去重与同名文件数据持久化服务
 * 从 PicLinkerView 提取的 app localStorage 读写逻辑
 */

import { App } from "obsidian";
import { DedupGroup, ImageBedType } from "../types";

export interface SameNameGroup {
	fileName: string;
	items: Array<{
		source: "local" | "cloud";
		path: string;
		url?: string;
		bedType?: ImageBedType;
		count?: number;
		section?: string;
	}>;
}

export class DedupService {
	constructor(private app: App, private getStorageKey: (key: string) => string) {}

	// ==================== 去重结果 ====================

	saveDedupGroups(groups: DedupGroup[]): void {
		try {
			const serialized = groups.map((group) => ({
				hash: group.hash,
				type: group.type,
				items: group.items.map((item) => ({
					path: item.path,
					source: item.source,
					bedType: item.bedType,
					referenced: item.referenced,
				})),
			}));
			this.app.saveLocalStorage(this.getStorageKey("dedupGroups"), JSON.stringify(serialized));
		} catch (e) {
			console.warn("[PicLinker] 保存去重数据失败", e);
		}
	}

	loadDedupGroups(): DedupGroup[] {
		try {
			const raw = this.app.loadLocalStorage(this.getStorageKey("dedupGroups")) as string | null;
			if (!raw) return [];
			const parsed = JSON.parse(raw) as unknown;
			if (!Array.isArray(parsed)) return [];

			return parsed
				.map((group: Record<string, unknown>) => ({
					hash: group.hash as string,
					type: group.type as "local" | "cloud" | "cross",
					items: (group.items as Array<Record<string, unknown>>)
						.filter((item) => item.path !== undefined && typeof item.path === "string" && !item.path.endsWith("/"))
						.map((item) => ({
							path: item.path as string,
							source: item.source as "local" | "cloud",
							bedType: item.bedType as ImageBedType | undefined,
							referenced: item.referenced as number | undefined,
						})),
				})).filter((group) => group.items.length >= 2);
		} catch (e) {
			console.warn("[PicLinker] 加载去重数据失败，已重置", e);
			return [];
		}
	}

	clearDedupGroups(): void {
		this.app.saveLocalStorage(this.getStorageKey("dedupGroups"), null);
	}

	// ==================== 同名文件 ====================

	saveSameNameData(groups: SameNameGroup[]): void {
		try {
			this.app.saveLocalStorage(this.getStorageKey("sameName"), JSON.stringify(groups));
		} catch (e) {
			console.warn("[PicLinker] 保存同名文件数据失败", e);
		}
	}

	loadSameNameData(): SameNameGroup[] {
		try {
			const raw = this.app.loadLocalStorage(this.getStorageKey("sameName")) as string | null;
			if (!raw) return [];
			const parsed = JSON.parse(raw) as unknown;
			return Array.isArray(parsed) ? (parsed as SameNameGroup[]) : [];
		} catch (e) {
			console.warn("[PicLinker] 加载同名文件数据失败，已重置", e);
			return [];
		}
	}

	clearSameNameData(): void {
		this.app.saveLocalStorage(this.getStorageKey("sameName"), null);
	}

	// ==================== 空白文件夹 ====================

	saveEmptyFoldersCleared(value: boolean): void {
		if (value) {
			this.app.saveLocalStorage(this.getStorageKey("emptyFoldersCleared"), "true");
		} else {
			this.app.saveLocalStorage(this.getStorageKey("emptyFoldersCleared"), null);
		}
	}

	loadEmptyFoldersCleared(): boolean {
		return this.app.loadLocalStorage(this.getStorageKey("emptyFoldersCleared")) === "true";
	}

	// ==================== 展开状态 ====================

	saveExpandState(sectionExpanded: Set<string>, dirExpanded: Set<string>): void {
		try {
			this.app.saveLocalStorage(this.getStorageKey("sectionExpanded"), JSON.stringify([...sectionExpanded]));
			this.app.saveLocalStorage(this.getStorageKey("dirExpanded"), JSON.stringify([...dirExpanded]));
		} catch (e) {
			console.warn("[PicLinker] 保存展开状态失败", e);
		}
	}

	loadExpandState(): { sectionExpanded: string[]; dirExpanded: string[] } {
		return {
			sectionExpanded: this.safeParseArray(this.getStorageKey("sectionExpanded")),
			dirExpanded: this.safeParseArray(this.getStorageKey("dirExpanded")),
		};
	}

	private safeParseArray(key: string): string[] {
		try {
			const raw = this.app.loadLocalStorage(key) as string | null;
			if (!raw) return [];
			const parsed = JSON.parse(raw) as unknown;
			return Array.isArray(parsed) ? (parsed as string[]) : [];
		} catch (e) {
			console.warn("[PicLinker] 加载展开状态数据失败，已重置", e);
			return [];
		}
	}
}
