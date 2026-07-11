/**
 * 文件哈希缓存
 * 基于 SHA-256 文件哈希，用于图片去重和云端比对
 */

import { ImageBedType } from "../types";
import { getNodeCrypto, hasNodeRequire } from "./nodeCrypto";

export interface HashEntry {
	/** 文件 SHA-256 哈希值 */
	hash: string;
	/** 云端 URL */
	url: string;
	/** 图床类型 */
	bedType: ImageBedType;
	/** 记录时间戳 */
	uploadedAt: number;
	/** 原始文件名 */
	fileName: string;
}

const MAX_CACHE_SIZE = 10000;

export class HashCache {
	private cache: Map<string, HashEntry> = new Map();
	private dirty = false;

	constructor(serialized?: string) {
		if (serialized) {
			try {
				const data = JSON.parse(serialized) as Array<Record<string, unknown>>;
				if (Array.isArray(data)) {
					for (const entry of data) {
						if (entry.hash && entry.url) {
							this.cache.set(entry.hash as string, entry as unknown as HashEntry);
						}
					}
				}
			} catch (e) {
				console.warn("[PicLinker] HashCache 数据损坏，已清空重建", e);
			}
		}
	}

	/**
	 * 计算文件/Blob 的 SHA-256 哈希
	 * - 桌面端（Electron）：使用 Node.js crypto 模块
	 * - 移动端：使用 Web Crypto API
	 */
	static async computeHash(file: Blob): Promise<string> {
		const buffer = await file.arrayBuffer();

		// Node.js 环境（桌面端 Electron）：使用 crypto 模块
		if (hasNodeRequire()) {
			const nodeCrypto = getNodeCrypto();
			const hash = nodeCrypto.createHash("sha256");
			hash.update(Buffer.from(buffer));
			return hash.digest("hex");
		}

		// Web Crypto API（移动端）
		const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	}

	/**
	 * 查询哈希缓存（LRU：更新访问顺序）
	 */
	get(hash: string): HashEntry | undefined {
		const entry = this.cache.get(hash);
		if (entry) {
			this.cache.delete(hash);
			this.cache.set(hash, entry);
		}
		return entry;
	}

	/**
	 * 记录哈希缓存
	 */
	set(hash: string, entry: HashEntry): void {
		// LRU: 超过容量时删除最旧条目
		if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(hash)) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) this.cache.delete(oldestKey);
		}
		this.cache.set(hash, { ...entry, uploadedAt: Date.now() });
		this.dirty = true;
	}

	/**
	 * 序列化用于持久化存储
	 */
	serialize(): string {
		return JSON.stringify(Array.from(this.cache.values()));
	}

	/**
	 * 是否有未保存的更改
	 */
	isDirty(): boolean {
		return this.dirty;
	}

	/**
	 * 标记为已保存
	 */
	markClean(): void {
		this.dirty = false;
	}

	/** 缓存中的条目数量 */
	get size(): number {
		return this.cache.size;
	}
}
