/**
 * 文件哈希缓存
 * 基于 SHA-256 文件哈希，用于图片去重和云端比对
 */

import { App, TFile } from "obsidian";
import { ImageBedType } from "../types";
import { getNodeCrypto, getNodeFs, hasNodeRequire } from "./nodeCrypto";

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
						// 反序列化时对所有字段做类型校验；类型不符则跳过该条（视为损坏）。
						if (!HashCache.isValidEntry(entry)) continue;
						this.cache.set(entry.hash, entry);
					}
				}
			} catch (e) {
				console.warn("[PicLinker] HashCache 数据损坏，已清空重建", e);
			}
		}
	}

	/**
	 * 计算文件/Blob 的 SHA-256 哈希
	 * - 桌面端（Electron）：使用 Node.js crypto 模块（增量哈希）
	 * - 移动端：使用 Web Crypto API
	 *
	 * 参数兼容原签名：传入 Blob / ArrayBuffer 时保持原有行为（内存中计算）。
	 * 额外支持传入 TFile（配合 app）：桌面端改用分块读取
	 * （app.vault.adapter.read 按块读取），避免把整张大图一次性读入内存，
	 * 降低大图内存峰值；哈希结果与一次性读取完全一致（同 SHA-256 输出）。
	 *
	 * @param file Blob / ArrayBuffer / TFile
	 * @param app  仅当 file 为 TFile 且需要分块读取时必填（用于获取 adapter）
	 */
	static async computeHash(file: Blob | ArrayBuffer | TFile, app?: App): Promise<string> {
		// TFile 路径：优先分块读取以降低内存峰值
		if (file instanceof TFile) {
			return HashCache.computeHashOfTFile(file, app);
		}

		const buffer: ArrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();

		// Node.js 环境（桌面端 Electron）：使用 crypto 模块（增量哈希）
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
	 * 对 TFile 计算 SHA-256，桌面端分块读取以显著降低内存峰值。
	 * 哈希结果与一次性 readBinary 后计算完全一致。
	 *
	 * 实现：桌面端（Electron）通过 require("fs") 用 `openSync` + `readSync` 循环按块读取，
	 * 每块的 Buffer 在 update 后即被回收，内存峰值仅为一个分块（默认 1MB）而非整张图。
	 * 移动端无 require("fs")，回退到原 readBinary 逻辑（保持语义不变，仅去掉 Blob 多余拷贝）。
	 */
	private static async computeHashOfTFile(file: TFile, app?: App): Promise<string> {
		if (hasNodeRequire()) {
			try {
				const nodeFs = getNodeFs();
				const fsAdapter = app?.vault.adapter as unknown as { getFullPath?: (p: string) => string } | undefined;
				if (!fsAdapter || typeof fsAdapter.getFullPath !== "function") {
					throw new Error("adapter.getFullPath 不可用");
				}
				const fullPath = fsAdapter.getFullPath(file.path);

				const nodeCrypto = getNodeCrypto();
				const hash = nodeCrypto.createHash("sha256");
				const fd = nodeFs.openSync(fullPath, "r");
				try {
					const size = file.stat.size;
					const CHUNK = 1024 * 1024; // 1MB 分块
					let offset = 0;
					const buf = Buffer.alloc(CHUNK);
					while (offset < size) {
						const length = Math.min(CHUNK, size - offset);
						const bytesRead = nodeFs.readSync(fd, buf, 0, length, offset);
						if (bytesRead <= 0) break;
						hash.update(buf.subarray(0, bytesRead));
						offset += bytesRead;
					}
				} finally {
					nodeFs.closeSync(fd);
				}
				return hash.digest("hex");
			} catch (e) {
				console.warn("[PicLinker] 分块读取失败，回退 readBinary 计算哈希:", file.path, e);
			}
		}

		// 回退：移动端 / 分块读取不可用（不含整份多余拷贝，语义与原 readBinary→Blob 一致）
		const buffer = await app!.vault.readBinary(file);
		return HashCache.computeHash(buffer);
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

	/**
	 * 校验反序列化条目是否结构正确、类型合规。
	 * 任一必需/已知字段类型不符则返回 false（视为损坏，跳过该条）。
	 */
	private static isValidEntry(entry: unknown): entry is HashEntry {
		if (!entry || typeof entry !== "object") return false;
		const e = entry as Record<string, unknown>;
		// hash：必需，非空字符串
		if (typeof e.hash !== "string" || e.hash.length === 0) return false;
		// url：必需，字符串
		if (typeof e.url !== "string") return false;
		// bedType：可选，但若存在必须是 ImageBedType 枚举值
		if (e.bedType !== undefined && !Object.values(ImageBedType).includes(e.bedType as ImageBedType)) {
			return false;
		}
		// uploadedAt：可选，但若存在必须是 number
		if (e.uploadedAt !== undefined && typeof e.uploadedAt !== "number") return false;
		// fileName：可选，但若存在必须是 string
		if (e.fileName !== undefined && typeof e.fileName !== "string") return false;
		return true;
	}
}
