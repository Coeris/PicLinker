/**
 * DedupCache - 去重哈希缓存
 * 缓存本地文件和云端文件的 SHA-256 哈希，避免重复下载和计算
 */

import { DedupHashEntry } from "../types";

const MAX_CACHE_SIZE = 20000;

export class DedupCache {
	private cache: Map<string, DedupHashEntry>;

	constructor(serialized?: string) {
		this.cache = new Map();
		if (serialized) {
			try {
				const arr = JSON.parse(serialized) as unknown[];
				if (Array.isArray(arr)) {
					for (const entry of arr) {
						if (entry && typeof entry === "object" && "path" in entry && "hash" in entry) {
							const e = entry as unknown as DedupHashEntry;
							if (e.path && e.hash) this.cache.set(e.path, e);
						}
					}
				}
			} catch (e) { console.warn("[PicLinker] DedupCache 数据损坏，已清空重建", e); }
		}
	}

	/** 获取缓存的哈希（LRU：更新访问顺序） */
	get(path: string): DedupHashEntry | null {
		const entry = this.cache.get(path);
		if (entry) {
			this.cache.delete(path);
			this.cache.set(path, entry);
		}
		return entry || null;
	}

	/** 存入缓存 */
	set(entry: DedupHashEntry): void {
		// LRU 淘汰
		if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(entry.path)) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) this.cache.delete(firstKey);
		}
		this.cache.set(entry.path, entry);
	}

	/** 检查是否有缓存 */
	has(path: string): boolean {
		return this.cache.has(path);
	}

	/** 移除缓存 */
	remove(path: string): void {
		this.cache.delete(path);
	}

	/** 序列化 */
	serialize(): string {
		return JSON.stringify([...this.cache.values()]);
	}
}
