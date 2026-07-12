/**
 * 全库扫描器
 * 扫描整个库，统计每个图片链接的使用次数与位置
 * 支持增量扫描（mtime 缓存）和批量并行读取
 */

import { App, TFile } from "obsidian";
import { LinkParser } from "../parser/LinkParser";
import { ImageLink } from "../types";

/**
 * 缓存版本号。解析逻辑变更时递增，迫使全量重扫。
 * v2: 支持 [[image.png]] 无 ! 前缀的 wiki 链接
 */
const CACHE_VERSION = 3;

/** 扫描缓存条目 */
interface ScanCacheEntry {
	/** 文件最后修改时间 */
	mtime: number;
	/** 缓存版本号 */
	version: number;
	/** 该文件中的图片链接 */
	links: ImageLink[];
}

export class VaultScanner {
	private app: App;
	private parser: LinkParser;
	/** 扫描缓存：文件路径 → 缓存条目 */
	private scanCache: Map<string, ScanCacheEntry> = new Map();
	/** 脏文件集合：通过事件标记需要重扫的文件路径 */
	private dirtyFiles: Set<string> = new Set();

	constructor(app: App, parser: LinkParser) {
		this.app = app;
		this.parser = parser;
	}

	/** 标记文件为脏（需要重扫），由文件事件调用 */
	markDirty(filePath: string): void {
		this.dirtyFiles.add(filePath);
	}

	/** 当前脏文件数量（调试用） */
	get dirtyCount(): number {
		return this.dirtyFiles.size;
	}

	/**
	 * 扫描整个库，返回所有图片链接的使用统计
	 * 支持增量扫描：仅重新扫描修改过的文件
	 * 批量并行读取未缓存文件，提升大库扫描速度
	 */
	async scan(): Promise<Map<string, ImageLink>> {
		const result = new Map<string, ImageLink>();
		const mdFiles = this.app.vault.getMarkdownFiles();

		// 第一步：收集需要读取的文件（缓存未命中）
		const filesToRead: TFile[] = [];
		const fileLinksMap = new Map<string, ImageLink[]>();
		for (const file of mdFiles) {
			const mtime = file.stat.mtime;
			const cached = this.scanCache.get(file.path);

			if (cached && cached.version === CACHE_VERSION && cached.mtime === mtime) {
				// 缓存命中（版本匹配 + mtime 未变）
				fileLinksMap.set(file.path, cached.links);
			} else {
				// 需要读取
				filesToRead.push(file);
			}
		}

		// 第二步：批量并行读取（限制并发数避免内存爆炸）
		const CONCURRENCY = 20;
		for (let i = 0; i < filesToRead.length; i += CONCURRENCY) {
			const batch = filesToRead.slice(i, i + CONCURRENCY);
			// 用 allSettled：单个文件读取失败（权限/损坏/竞态删除）只跳过该文件，
			// 不影响其余文件，避免整批扫描结果丢失导致视图空白/旧数据。
			const settled = await Promise.allSettled(
				batch.map(async (file) => {
					const content = await this.app.vault.read(file);
					return { file, content };
				})
			);
			for (const outcome of settled) {
				if (outcome.status === "rejected") {
					console.warn("[PicLinker] VaultScanner: 读取文件失败，已跳过:", outcome.reason as unknown);
					continue;
				}
				const { file, content } = outcome.value;
				const links = this.parser.parse(content);
				// 补充 frontmatter 中的裸路径图片字段（如 cover: a.png），
				// 这些值无 ![[...]] 包裹，普通解析器识别不到，单独后置扫描纳入。
				const fmImages = this.parser.parseFrontmatterImages(content);
				if (fmImages.length > 0) links.push(...fmImages);
				// 修复 (a) TOCTOU：vault.read 拿到内容后，重新取一次「读后的当前 mtime」存入缓存。
				// 否则文件在「读内容」与「存缓存」之间被并发修改，会存下「旧内容 + 新 mtime」，
				// 导致下次扫描误判为未变化而不重读。重新从 vault 取文件，拿到最新 stat。
				const currentFile = this.app.vault.getAbstractFileByPath(file.path);
				const mtime = currentFile instanceof TFile ? currentFile.stat.mtime : file.stat.mtime;
				this.scanCache.set(file.path, { mtime, version: CACHE_VERSION, links });
				fileLinksMap.set(file.path, links);
			}
		}

		// 第三步：聚合所有链接
		for (const file of mdFiles) {
			const links = fileLinksMap.get(file.path) || [];
			for (const link of links) {
				let resolvedPath: string | undefined;
				let found = true;
				if (link.type === "local") {
					const dest = this.app.metadataCache.getFirstLinkpathDest(link.pure, file.path);
					if (dest) {
						resolvedPath = dest.path;
					} else {
						// 元数据缓存未更新时，手动解析路径
						const srcDir = file.path.substring(0, file.path.lastIndexOf("/"));
						const tryPath = srcDir ? `${srcDir}/${link.pure}` : link.pure;
						const tryFile = this.app.vault.getAbstractFileByPath(tryPath);
						if (tryFile) {
							resolvedPath = tryPath;
						} else {
							// 尝试按文件名在全库中查找（仅处理相对路径如 ../images/photo.jpg）
							const fileName = link.pure.split("/").pop() || link.pure;
							// 仅当链接是相对路径（含 /）时才允许全库同名兜底，
							// 避免同名文件（如多目录下的 photo.jpg）命中错误目标导致引用计数错配 / 误删。
							// 纯文件名链接（无 /）不做盲目兜底：保持 tryPath，found=false 交由视图判断。
							const isRelative = link.pure.includes("/");
							if (isRelative) {
								const matchByName = this.app.vault.getFiles().find(f => f.name === fileName);
								if (matchByName) {
									resolvedPath = matchByName.path;
								} else {
									resolvedPath = tryPath;
									found = false;
								}
							} else {
								resolvedPath = tryPath;
								found = false;
							}
							// 解码 URL 编码的文件名后再尝试解析（如 my%20image.png → my image.png）
							const decodedPure = this.safeDecode(link.pure);
							if (decodedPure !== link.pure) {
								const tryDecodedPath = srcDir ? `${srcDir}/${decodedPure}` : decodedPure;
								const decodedFile = this.app.vault.getAbstractFileByPath(tryDecodedPath);
								if (decodedFile) {
									resolvedPath = tryDecodedPath;
									found = true;
								}
							}
						}
					}
				}

				const key = resolvedPath || link.pure;
				const line = link.line || 1;

				if (result.has(key)) {
					const existing = result.get(key)!;
					existing.count++;
					if (!existing.files.includes(file.path)) {
						existing.files.push(file.path);
					}
					if (!existing.fileLines) {
						existing.fileLines = new Map();
					}
					if (!existing.fileLines.has(file.path)) {
						existing.fileLines.set(file.path, []);
					}
					// 修复 (b)：同一行多次引用同一图时，行号数组会写入重复行号（如 [N, N]）。
					// 仅对行号数组去重（保留首次出现顺序），不改动 count，
					// 以保留「同一行多次引用同一图」的计数语义。
					const lineArr = existing.fileLines.get(file.path)!;
					if (!lineArr.includes(line)) {
						lineArr.push(line);
					}
				} else {
					const fileLines = new Map<string, number[]>();
					fileLines.set(file.path, [line]);
					result.set(key, {
						...link,
						resolvedPath,
						found,
						count: 1,
						files: [file.path],
						fileLines,
					});
				}
			}
		}

		// 清理已删除文件的缓存
		const currentFiles = new Set(mdFiles.map(f => f.path));
		for (const cachedPath of this.scanCache.keys()) {
			if (!currentFiles.has(cachedPath)) {
				this.scanCache.delete(cachedPath);
			}
		}

		return result;
	}

	/**
	 * 清除扫描缓存（强制下次全量扫描）
	 */
	clearCache(): void {
		this.scanCache.clear();
	}

	/**
	 * 增量失效：只清除已变更文件的缓存，保留未变化文件的缓存
	 * 优先使用事件标记的脏文件，回退到 mtime 检测
	 */
	invalidateChangedFiles(): void {
		const mdFiles = this.app.vault.getMarkdownFiles();
		const currentPaths = new Set(mdFiles.map(f => f.path));

		// 移除已删除文件的缓存
		for (const cachedPath of this.scanCache.keys()) {
			if (!currentPaths.has(cachedPath)) {
				this.scanCache.delete(cachedPath);
			}
		}

		// 优先：从脏文件集合中失效（事件驱动，O(1) 查找）
		if (this.dirtyFiles.size > 0) {
			for (const dirtyPath of this.dirtyFiles) {
				this.scanCache.delete(dirtyPath);
			}
			this.dirtyFiles.clear();
		}

		// 回退：mtime 检测（覆盖外部修改等非事件场景）
		for (const file of mdFiles) {
			const cached = this.scanCache.get(file.path);
			if (cached && cached.mtime !== file.stat.mtime) {
				this.scanCache.delete(file.path);
			}
		}
	}

	/**
	 * 安全解码 URL 编码的文件名（如 my%20image.png → my image.png）。
	 * 编码非法时返回原串，不影响正常链接。
	 */
	private safeDecode(pure: string): string {
		try {
			return decodeURIComponent(pure);
		} catch {
			return pure;
		}
	}

	/**
	 * 序列化扫描缓存（用于持久化存储）
	 * 将 Map 转换为可 JSON 序列化的数组格式
	 */
	serialize(): string {
		type SerializedLink = Omit<ImageLink, 'fileLines'> & { fileLines?: [string, number[]][] };
		const entries: Array<[string, { mtime: number; version: number; links: SerializedLink[] }]> = [];
		for (const [path, entry] of this.scanCache) {
			entries.push([path, {
				mtime: entry.mtime,
				version: entry.version || 0,
				links: entry.links.map(link => ({
					...link,
					fileLines: link.fileLines ? [...link.fileLines.entries()] : undefined,
				})),
			}]);
		}
		return JSON.stringify(entries);
	}

	/**
	 * 从序列化数据恢复扫描缓存
	 */
	loadSerialized(data: string): void {
		interface RawCacheEntry {
			mtime?: unknown;
			version?: unknown;
			links?: Array<{ fileLines?: [string, number[]][] } & Record<string, unknown>>;
		}
		try {
			const entries = JSON.parse(data) as Array<[string, RawCacheEntry]>;
			if (!Array.isArray(entries)) return;
			for (const [path, entry] of entries) {
				if (!path || typeof path !== "string" || !entry || typeof entry.mtime !== "number") continue;
				// 版本不匹配 → 跳过，等下次 scan() 重新生成
				if (entry.version !== CACHE_VERSION) continue;
				const links: ImageLink[] = (entry.links || []).map((link) => {
					const fileLines = Array.isArray(link.fileLines) ? new Map(link.fileLines) : undefined;
					return { ...link, fileLines } as ImageLink;
				});
				this.scanCache.set(path, { mtime: entry.mtime, version: CACHE_VERSION, links });
			}
		} catch (e) {
			console.warn("[PicLinker] 扫描缓存数据损坏，已忽略", e);
		}
	}
}
