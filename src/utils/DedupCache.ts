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

	/**
	 * 获取缓存的哈希（LRU：更新访问顺序）。
	 * 注意：云端条目不再做 TTL 自动过期——缓存是否失效完全由用户手动「清除缓存」决定，
	 * 避免图床数据未变时缓存被静默丢弃、已展示的去重组与实际缓存对不上产生歧义。
	 */
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

	/** 缓存中的条目数量 */
	get size(): number {
		return this.cache.size;
	}

	/** 移除缓存 */
	remove(path: string): void {
		this.cache.delete(path);
	}

	/** 清空整个缓存（用于主动清理哈希缓存，强制下次去重重新计算） */
	clear(): void {
		this.cache.clear();
	}

	/** 序列化 */
	serialize(): string {
		return JSON.stringify([...this.cache.values()]);
	}
}
