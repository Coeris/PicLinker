/**
 * PicLinker - 图床管家
 * 全库图片扫描、同名文件检测、图片去重、图床比对
 */

import { Plugin, TFile, TAbstractFile, Notice } from "obsidian";
import { PicLinkerSettingTab } from "./settings/SettingTab";
import { PicLinkerView, VIEW_TYPE_PIC_LINKER } from "./view/PicLinkerView";
import { LinkParser } from "./parser/LinkParser";
import { VaultScanner } from "./scanner/VaultScanner";
import { CloudComparator } from "./comparator/CloudComparator";
import { ImageBedManager } from "./imagebed/ImageBedManager";
import { GitHubImageBed } from "./imagebed/GitHubImageBed";
import { AliyunOssImageBed } from "./imagebed/AliyunOssImageBed";
import { TencentCosImageBed } from "./imagebed/TencentCosImageBed";
import { SmmsImageBed } from "./imagebed/SmmsImageBed";
import { ImageLink, PicLinkerSettings, ImageBedType, CloudFile } from "./types";
import { HashCache } from "./utils/HashCache";
import { DedupCache } from "./utils/DedupCache";
import { parseFrontmatter } from "./utils/FrontmatterParser";
import { encryptSensitiveFields, decryptSensitiveFields, migrateLegacyToNewSalt, generateSalt } from "./utils/SecureStorage";
import { LinkEditor } from "./editor/LinkEditor";
import { WebDAVSync, WebDAVMeta } from "./sync/WebDAVSync";

/** 取文件路径中的文件名（含扩展名） */
function getBasename(p: string): string {
	const i = p.lastIndexOf("/");
	return i >= 0 ? p.substring(i + 1) : p;
}
import { IMAGE_EXTENSIONS } from "./utils/Common";
import { deferAsync } from "./utils/AsyncHandler";

const DEFAULT_SETTINGS: PicLinkerSettings = {
	// 插件通用设置
	showPath: true,

	// 插件功能
	showLocalImages: true,
	showCloudImages: true,
	showLocalUnreferenced: true,
	showCloudUnreferenced: true,
	showNotFoundImages: true,
	showEmptyFolders: true,
	showDuplicates: true,
	showSameNameFiles: true,

	// WebDAV 同步
	webdavUrl: "",
	webdavUsername: "",
	webdavPassword: "",
	webdavRemotePath: "/PicLinker/settings.json",
	webdavAutoSync: false,

	// 图床配置
	githubToken: "",
	githubOwner: "",
	githubRepo: "",
	githubBranch: "main",
	githubPath: "images",
	aliyunEndpoint: "",
	aliyunBucket: "",
	aliyunAccessKeyId: "",
	aliyunAccessKeySecret: "",
	aliyunPath: "images",
	tencentSecretId: "",
	tencentSecretKey: "",
	tencentBucket: "",
	tencentRegion: "",
	tencentPath: "images",
	smmsToken: "",
	otherBedName: "",
	otherBedUrl: "",
	otherBedUsername: "",
	otherBedPassword: "",
	otherBedPath: "",
};

export default class PicLinkerPlugin extends Plugin {
	settings: PicLinkerSettings = DEFAULT_SETTINGS;
	view: PicLinkerView | null = null;
	linkParser!: LinkParser;
	vaultScanner!: VaultScanner;
	cloudComparator!: CloudComparator;
	imageBedManager!: ImageBedManager;
	/** 文件哈希缓存（SHA-256 → HashEntry{url, bedType, uploadedAt}，用于去重和比对） */
	hashCache: HashCache = new HashCache();
	/** 图片去重哈希缓存（文件路径 → DedupHashEntry{hash, source, mtime}，避免重复计算） */
	dedupCache: DedupCache = new DedupCache();
	/** 链接编辑服务 */
	linkEditor!: LinkEditor;
	/** WebDAV 同步服务 */
	webDAVSync!: WebDAVSync;
	/** 持久随机加密 salt（Base64），存于 data.json 的 `_encSalt`，替代 vault 名，根除改名清空凭据 */
	private _encSaltB64?: string;
	/** 临时存储的 WebDAV 元数据（loadSettings 时暂存，webDAVSync 初始化后恢复） */
	private _pendingWebdavMeta?: WebDAVMeta;
	/** 文件变更防抖定时器 */
	private fileDebounceTimer: number | null = null;
	/** 活跃文件切换防抖定时器 */
	private activeDebounceTimer: number | null = null;

	async onload() {
		// 初始化核心模块（loadSettings 需要 vaultScanner）
		this.linkParser = new LinkParser();
		this.vaultScanner = new VaultScanner(this.app, this.linkParser);
		this.linkEditor = new LinkEditor(this.app);

		await this.loadSettings();

		// WebDAV 同步服务（依赖已加载的 settings）
		this.webDAVSync = new WebDAVSync(
			this.settings,
			this.getEncSaltB64(),
			async (updated) => { this.settings = updated; await this.saveSettings(); },
		);
		if (this._pendingWebdavMeta) {
			this.webDAVSync.meta = this._pendingWebdavMeta;
			this._pendingWebdavMeta = undefined;
		}

		// 开发模式热加载检测
		this.startDevReloadWatch();
		this.cloudComparator = new CloudComparator(this.settings);
		this.imageBedManager = new ImageBedManager();

		// 注册图床
		this.registerImageBeds();

		// 注册视图
		this.registerView(VIEW_TYPE_PIC_LINKER, (leaf) => {
			return new PicLinkerView(leaf, this);
		});

		// 添加功能区按钮 - 打开面板
		this.addRibbonIcon("cloud-check", "打开图床管家", () => {
			void this.activateView();
		});

		// 添加命令 - 打开面板
		this.addCommand({
			id: "open",
			name: "打开图床管家",
			callback: () => this.activateView(),
		});

		// 添加命令 - 刷新扫描
		this.addCommand({
			id: "refresh",
			name: "刷新图片扫描",
			callback: () => this.refreshView(),
		});

		// 添加命令 - 诊断测试
		this.addCommand({
			id: "test",
			name: "运行诊断测试",
			callback: () => this.runDiagnostics(),
		});

		// 监听文件变更事件（所有文件类型，用于实时更新空白文件夹等）
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile) {
					this.onFileChanged(file.path);
				}
			})
		);

		// 监听元数据解析完成（链接解析后触发，比 modify 更可靠）
		// 注意：'resolved' 事件回调无参数（全局解析完成），直接触发刷新
		this.registerEvent(
			this.app.metadataCache.on("resolved", () => {
				this.debounceFileRefresh();
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				this.onFileChanged(file.path, false);
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				this.onFileRenamed(file, oldPath);
			})
		);

		this.registerEvent(
			this.app.vault.on("create", (file) => {
				this.onFileChanged(file.path, false);
			})
		);

		// 监听活跃文件切换
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.onActiveFileChanged();
			})
		);

		// 注册设置面板
		this.addSettingTab(new PicLinkerSettingTab(this.app, this));
	}

	onunload() {
		// 清理 debounce timers
		if (this.fileDebounceTimer) {
			window.clearTimeout(this.fileDebounceTimer);
			this.fileDebounceTimer = null;
		}
		if (this.activeDebounceTimer) {
			window.clearTimeout(this.activeDebounceTimer);
			this.activeDebounceTimer = null;
		}
	}

	private registerImageBeds() {
		const github = new GitHubImageBed();
		github.configure(this.settings);
		this.imageBedManager.register(ImageBedType.GitHub, github);

		const aliyun = new AliyunOssImageBed();
		aliyun.configure(this.settings);
		this.imageBedManager.register(ImageBedType.Aliyun, aliyun);

		const tencent = new TencentCosImageBed();
		tencent.configure(this.settings);
		this.imageBedManager.register(ImageBedType.Tencent, tencent);

		const smms = new SmmsImageBed();
		smms.configure(this.settings);
		this.imageBedManager.register(ImageBedType.Other, smms);
	}

	async activateView() {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_PIC_LINKER);
		if (existing.length > 0) {
			void this.app.workspace.revealLeaf(existing[0]);
			const view = existing[0].view;
			if (view instanceof PicLinkerView) this.view = view;
			return;
		}

		const newLeaf = this.app.workspace.getLeaf('tab');
		if (newLeaf) {
			await newLeaf.setViewState({ type: VIEW_TYPE_PIC_LINKER, active: true });
			const view = newLeaf.view;
			if (view instanceof PicLinkerView) this.view = view;
			void this.app.workspace.revealLeaf(newLeaf);
		}
	}

	onFileChanged(filePath: string, markDirty: boolean = true) {
		// markdown 文件变更：标记脏 + 刷新
		if (filePath.endsWith(".md")) {
			if (markDirty) this.vaultScanner.markDirty(filePath);
			this.debounceFileRefresh();
			return;
		}
		// 图片文件变更（delete/create/rename）：仅刷新视图（影响未引用/空白文件夹分区）
		const ext = filePath.split(".").pop()?.toLowerCase();
		if (ext && IMAGE_EXTENSIONS.has(ext)) {
			this.debounceFileRefresh();
		}
	}

	/**
	 * 文件重命名处理。
	 * - 图片被重命名：扫描全库 markdown 笔记，把引用了旧路径/旧文件名的图片链接
	 *   更新为新路径/新文件名（覆盖 markdown 链接、wikilink、frontmatter 裸路径字段）。
	 * - 其余情况（含非图片文件，如 md 笔记改名）：保持原有仅刷新视图的行为，不改动笔记内容。
	 * @param file 重命名后的文件
	 * @param oldPath 重命名前的完整路径（vault.on rename 的第二个参数）
	 */
	onFileRenamed(file: TAbstractFile, oldPath: string): void {
		// 仅当「旧路径」是图片时才需要更新引用。
		const oldExt = oldPath.split(".").pop()?.toLowerCase();
		if (oldExt && IMAGE_EXTENSIONS.has(oldExt)) {
			void this.updateImageLinksOnRename(oldPath, file.path);
		} else {
			// 非图片文件：维持旧行为
			this.onFileChanged(file.path, false);
		}
	}

	/**
	 * 图片重命名后更新全库笔记中的图片引用。
	 * 复用 LinkEditor.replaceImageReferencesOnRename（内部会精确匹配旧路径，避免同名误伤）。
	 */
	private async updateImageLinksOnRename(oldPath: string, newPath: string): Promise<void> {
		try {
			const count = await this.linkEditor.replaceImageReferencesOnRename(oldPath, newPath);
			if (count > 0) {
				new Notice(`PicLinker：已更新 ${count} 个笔记中指向「${getBasename(oldPath)}」的图片引用`);
			}
		} catch (e) {
			console.error("[PicLinker] 重命名更新图片引用失败:", e);
			new Notice("PicLinker：重命名后更新图片引用失败，详见控制台", 8000);
		} finally {
			// 无论如何都刷新视图（未引用/空白文件夹分区等需要更新）
			this.debounceFileRefresh();
		}
	}

	onActiveFileChanged() {
		// 活跃文件切换防抖：延迟更新视图
		this.debounceActiveRefresh();
	}

	private debounceFileRefresh() {
		if (this.fileDebounceTimer) window.clearTimeout(this.fileDebounceTimer);
		this.fileDebounceTimer = window.setTimeout(deferAsync(async () => {
			// 等待 Obsidian 元数据缓存更新（链接解析需要时间）
			await new Promise(r => window.setTimeout(r, 300));
			// 视图打开时刷新视图，未打开时只更新扫描缓存
			const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PIC_LINKER);
			if (leaves.length > 0 && this.view) {
				await this.view.refresh();
				// 等待云端数据加载完成后，补充一次刷新确保 metadataCache 完全解析后链接路径准确
				const view = this.view;
				window.setTimeout(() => {
					void (async () => {
						if (view && view.waitForCloudLoad) {
							await view.waitForCloudLoad();
							if (view && !(view as unknown as { isClosed?: boolean }).isClosed) {
								void view.refresh();
							}
						}
					})();
				}, 1000);
			} else {
				// 视图未打开，增量更新扫描缓存（下次打开时用最新数据）
				this.vaultScanner.invalidateChangedFiles();
				await this.vaultScanner.scan();
			}
		}), 500);
	}

	private debounceActiveRefresh() {
		if (this.activeDebounceTimer) window.clearTimeout(this.activeDebounceTimer);
		this.activeDebounceTimer = window.setTimeout(() => {
			if (this.view) this.refreshView();
		}, 500);
	}

	refreshView() {
		if (this.view) {
			void this.view.refresh();
		}
	}

	async loadSettings() {
		const data = ((await this.loadData()) as unknown as Record<string, unknown>) || {};
		const { _encSalt, _hashcache, _webdavmeta, _dedupcache, _scancache, ...settingsData } = data;
		// 清理已废弃的旧字段
		const deprecatedKeys = ["autoRefreshOnOpen", "showUnreferenced", "deleteConfirm", "debounceDelay"];
		for (const key of deprecatedKeys) {
			delete settingsData[key];
		}
		const raw = Object.assign({}, DEFAULT_SETTINGS, settingsData);

		// 恢复缓存（先恢复，便于后续迁移写回时一并持久化）
		if (_hashcache && typeof _hashcache === "string") {
			this.hashCache = new HashCache(_hashcache);
		}
		if (_dedupcache && typeof _dedupcache === "string") {
			this.dedupCache = new DedupCache(_dedupcache);
		}
		if (_scancache && typeof _scancache === "string") {
			this.vaultScanner.loadSerialized(_scancache);
		}
		if (_webdavmeta) {
			this._pendingWebdavMeta = _webdavmeta;
		}

		// ===== 加密 salt 解析 + 升级迁移（关键：绝不丢失凭据） =====
		const legacySalt = `imagelmgr:${this.app.vault.getName()}`;
		let encSaltB64 = typeof _encSalt === "string" && _encSalt ? _encSalt : undefined;
		let working: Record<string, unknown> = raw;
		// 是否需要在 loadSettings 末尾把迁移结果写回 data.json
		let persistMigration = false;

		if (encSaltB64) {
			// 已是新方案：用持久随机 salt 解密 v2 字段
			working = await decryptSensitiveFields(raw, encSaltB64);
		} else {
			// 老用户（或全新用户）：尝试用旧方案（vault 名 salt）迁移
			const mig = await migrateLegacyToNewSalt(raw, legacySalt);
			if (mig.hadLegacy && mig.allDecrypted) {
				// 路径 A：旧密文全部成功解出 → in-memory 保持明文，用新随机 salt 重新加密后写盘
				working = mig.settings;
				encSaltB64 = mig.newSaltB64;
				persistMigration = true;
				new Notice("PicLinker：凭据已无缝迁移到更安全的加密方案");
			} else if (mig.hadLegacy && !mig.allDecrypted) {
				// 路径 B：改名后升级等导致旧密文无法解密 → 保留原密文，绝不清空
				working = raw;
				encSaltB64 = mig.newSaltB64;
				persistMigration = true;
				const msg = "PicLinker 警告：部分图床凭据无法自动迁移（可能曾在升级前重命名过 vault），请重新检查并填写图床配置。";
				console.warn(`[PicLinker] ${msg}`);
				new Notice(msg, 15000);
			} else {
				// 路径 C：无历史密文（全新用户/从未填凭据）→ 仅生成并持久化新 salt
				working = raw;
				encSaltB64 = mig.newSaltB64;
				persistMigration = true;
			}
		}

		this._encSaltB64 = encSaltB64;
		this.settings = working as PicLinkerSettings;

		// 将迁移结果写回 data.json（幂等：仅当 salt 为新生成/迁移时）
		if (persistMigration && this._encSaltB64) {
			try {
				await this.saveData(this.buildSavePayload(this.settings, this._encSaltB64));
			} catch (e) {
				console.warn("[PicLinker] 迁移结果持久化失败（下次启动将重试）", e);
			}
		}
	}

	/** 获取持久随机 salt（Base64），确保已生成 */
	private getEncSaltB64(): string {
		if (!this._encSaltB64) {
			this._encSaltB64 = generateSalt();
		}
		return this._encSaltB64;
	}

	/** 构建完整保存负载（含加密字段、持久 salt 与各类缓存） */
	private buildSavePayload(encrypted: Record<string, unknown>, encSaltB64: string): Record<string, unknown> {
		const savePayload: Record<string, unknown> = { ...encrypted, _encSalt: encSaltB64 };
		if (this.hashCache.isDirty() || this.hashCache.size > 0) {
			savePayload._hashcache = this.hashCache.serialize();
			this.hashCache.markClean();
		}
		if (this.dedupCache) {
			savePayload._dedupcache = this.dedupCache.serialize();
		}
		if (this.webDAVSync?.meta) {
			// 记录本地最后修改时间，用于三方比较冲突检测
			this.webDAVSync.meta.lastLocalModifiedAt = new Date().toISOString();
			savePayload._webdavmeta = this.webDAVSync.meta;
		}
		// 持久化扫描缓存（加速下次启动）
			try {
			savePayload._scancache = this.vaultScanner.serialize();
		} catch (e) { console.warn("[PicLinker] 扫描缓存序列化失败，已跳过", e); }
		return savePayload;
	}

	async saveSettings() {
		// 加密敏感字段后保存（新方案：持久随机 salt + 600k）
		const encSaltB64 = this.getEncSaltB64();
		const encrypted = await encryptSensitiveFields(this.settings, encSaltB64);
		const savePayload = this.buildSavePayload(encrypted, encSaltB64);
		await this.saveData(savePayload);
		// 更新各图床配置
		for (const bed of this.imageBedManager.getAll()) {
			bed.configure(this.settings);
		}
		this.cloudComparator.updateSettings(this.settings);
		this.webDAVSync?.updateSettings(this.settings);
		this.refreshView();
		// 下方 WebDAV 自动上传分支：上传成功会由 WebDAVSync 回写 meta.lastSyncedAt，
		// 不污染 lastLocalModifiedAt（那是“真实本地编辑”基准）。
		// #11 WebDAV 自动同步：设置保存时自动上传（需开启开关，且未从远程下载）
		// 注意：webdavEnable 已移除，开关由 webdavAutoSync 单一承担。
		if (this.settings.webdavAutoSync && this.settings.webdavUrl && this.settings.webdavUsername && this.settings.webdavPassword 
			&& !this.webDAVSync?.skipAutoUpload) {
			void this.webDAVSync.syncToRemote();
		}
		// 重置标记位（单次用途）
		if (this.webDAVSync) this.webDAVSync.skipAutoUpload = false;
	}

	/**
	 * 仅持久化图床连接测试结果（私键 _bedTestResults），不触碰其余 data.json。
	 * 以当前已保存的 data 为基准做 read-modify-write（而非以内存空对象为基准），
	 * 避免与 saveSettings / WebDAV 同步的整份保存互相覆盖（修复竞态丢配置）。
	 */
	async mergeBedTestResults(results: Record<string, boolean>): Promise<void> {
		const data = ((await this.loadData()) as Record<string, unknown>) || {};
		data._bedTestResults = results;
		await this.saveData(data);
	}

/**
	 * 获取当前活跃笔记的图片链接
	 */
	async getCurrentFileImages(): Promise<ImageLink[]> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== "md") return [];

		const content = await this.app.vault.read(activeFile);
		return this.linkParser.parse(content);
	}

	/**
	 * 获取全库图片链接统计
	 */
	async getVaultImages(): Promise<Map<string, ImageLink>> {
		return await this.vaultScanner.scan();
	}

	/**
	 * 比对本地图片与云端
	 * @param cloudFiles 可选的云端文件列表（用于文件名匹配，避免 CORS）
	 * @param pathPrefix 可选的云端路径前缀（来自 frontmatter image-path）
	 */
	async compareLocalWithCloud(
		localImages: ImageLink[],
		bedType?: ImageBedType,
		cloudFiles?: CloudFile[],
		pathPrefix?: string,
	): Promise<Map<string, { exists: boolean; url?: string }>> {
		return await this.cloudComparator.compare(localImages, bedType, cloudFiles, pathPrefix);
	}

	/**
	 * 删除云端文件
	 */
	async deleteCloudFile(filename: string, bedType: ImageBedType): Promise<{ success: boolean; error?: string }> {
		const bed = this.imageBedManager.get(bedType);
		if (!bed) return { success: false, error: "图床未注册" };

		return bed.delete(filename);
	}

	/**
	 * 获取云端文件列表
	 */
	async listCloudFiles(bedType: ImageBedType): Promise<CloudFile[]> {
		const bed = this.imageBedManager.get(bedType);
		if (!bed) return [];

		return bed.listFiles();
	}

	/**
	 * 创建云端目录
	 */
	async createCloudDirectory(dirName: string, bedType: ImageBedType): Promise<{ success: boolean; error?: string }> {
		const bed = this.imageBedManager.get(bedType);
		if (!bed) return { success: false, error: "图床未注册" };

		return bed.createDirectory(dirName);
	}

	/**
	 * #6 测试图床连接
	 */
	async testBedConnection(bedType: ImageBedType): Promise<{ success: boolean; error?: string }> {
		const bed = this.imageBedManager.get(bedType);
		if (!bed) return { success: false, error: "图床未注册" };
		if (bed.testConnection) return bed.testConnection();
		return { success: false, error: "该图床不支持连接测试" };
	}

	async testCreateDirectoryCapability(bedType: ImageBedType): Promise<{ supported: boolean; reason?: string }> {
		const bed = this.imageBedManager.get(bedType);
		if (!bed) return { supported: false, reason: "图床未注册" };
		if (bed.testCreateDirectoryCapability) return bed.testCreateDirectoryCapability();
		return { supported: false, reason: "未知是否支持创建目录" };
	}

	/**
	 * #10 解析当前活跃文件的 Frontmatter 配置
	 */
	async getFileFrontmatter(): Promise<Record<string, string | boolean | null>> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== "md") return {};

		const content = await this.app.vault.read(activeFile);
		const config = parseFrontmatter(content);
		if (!config) return {};

		const result: Record<string, string | boolean | null> = {};
		if (config.imageBed !== undefined) result.imageBed = config.imageBed;
		if (config.autoUpload !== undefined) result.autoUpload = config.autoUpload;
		if (config.imagePath !== undefined) result.imagePath = config.imagePath;
		return result;
	}

// ==================== 诊断测试 ====================

	/** 运行诊断测试，检查各模块功能 */
	private async runDiagnostics() {
		const results: string[] = [];
		const add = (ok: boolean, msg: string) => results.push(`${ok ? "✅" : "❌"} ${msg}`);

		// 1. 基础模块检查
		add(!!this.linkParser, "LinkParser 初始化");
		add(!!this.vaultScanner, "VaultScanner 初始化");
		add(!!this.cloudComparator, "CloudComparator 初始化");
		add(!!this.imageBedManager, "ImageBedManager 初始化");
		add(!!this.linkEditor, "LinkEditor 初始化");
		add(!!this.webDAVSync, "WebDAVSync 初始化");
		add(!!this.hashCache, "HashCache 初始化");
		add(!!this.dedupCache, "DedupCache 初始化");

		// 2. 图床配置检查
		const s = this.settings;
		const githubOk = !!(s.githubToken && s.githubOwner && s.githubRepo);
		const aliyunOk = !!(s.aliyunAccessKeyId && s.aliyunAccessKeySecret && s.aliyunEndpoint && s.aliyunBucket);
		const tencentOk = !!(s.tencentSecretId && s.tencentSecretKey && s.tencentBucket && s.tencentRegion);
		const smmsOk = !!s.smmsToken;
		add(githubOk || aliyunOk || tencentOk || smmsOk, `至少配置一个图床 (GitHub:${githubOk} Aliyun:${aliyunOk} Tencent:${tencentOk} SM.MS:${smmsOk})`);

		// 3. 图床注册检查
		const beds = this.imageBedManager.getAll();
		add(beds.length === 4, `图床注册数量: ${beds.length}/4`);

		// 4. Settings 保存/加载测试
		try {
			const original = { ...this.settings };
			await this.saveSettings();
			await this.loadSettings();
			const match = JSON.stringify(original) === JSON.stringify(this.settings);
			add(match, "Settings 保存/加载一致性");
		} catch (e) {
			add(false, `Settings 保存/加载异常: ${e}`);
		}

		// 5. 加密/解密测试
		try {
			const salt = this.getEncSaltB64();
			const testValue = "test-token-12345";
			const encrypted = await encryptSensitiveFields({ githubToken: testValue }, salt);
			const decrypted = await decryptSensitiveFields(encrypted, salt);
			add(decrypted.githubToken === testValue, "敏感字段加密/解密");
		} catch (e) {
			add(false, `加密/解密异常: ${e}`);
		}

		// 6. WebDAV 配置检查
		const webdavOk = !!(s.webdavUrl && s.webdavUsername && s.webdavPassword);
		add(true, `WebDAV 配置: ${webdavOk ? "已配置" : "未配置"}`);
		if (webdavOk) {
			add(s.webdavUrl.startsWith("https://"), "WebDAV 使用 HTTPS");
		}

		// 7. 本地扫描测试
		try {
			const images = await this.getVaultImages();
			add(true, `本地图片扫描: ${images.size} 个`);
		} catch (e) {
			add(false, `本地扫描异常: ${e}`);
		}

		// 8. 云端连接测试
		if (githubOk) {
			try {
				const result = await this.testBedConnection(ImageBedType.GitHub);
				add(result.success, `GitHub 连接: ${result.success ? "成功" : result.error}`);
			} catch (e) {
				add(false, `GitHub 连接异常: ${e}`);
			}
		}
		if (aliyunOk) {
			try {
				const result = await this.testBedConnection(ImageBedType.Aliyun);
				add(result.success, `阿里云 OSS 连接: ${result.success ? "成功" : result.error}`);
			} catch (e) {
				add(false, `阿里云 OSS 连接异常: ${e}`);
			}
		}
		if (tencentOk) {
			try {
				const result = await this.testBedConnection(ImageBedType.Tencent);
				add(result.success, `腾讯云 COS 连接: ${result.success ? "成功" : result.error}`);
			} catch (e) {
				add(false, `腾讯云 COS 连接异常: ${e}`);
			}
		}

		// 9. LinkEditor 测试
		try {
			const testLine = "![test](images/test.png) 和一些文字";
			const cleaned = this.linkEditor.removeImageFromLine(testLine, "images/test.png");
			add(cleaned === " 和一些文字", "LinkEditor.removeImageFromLine");
		} catch (e) {
			add(false, `LinkEditor 异常: ${e}`);
		}

		// 输出结果
		const summary = `PicLinker 诊断报告\n${"─".repeat(30)}\n${results.join("\n")}\n${"─".repeat(30)}\n通过: ${results.filter(r => r.startsWith("✅")).length}/${results.length}`;
		// 诊断结果仅通过 Notice 展示，不输出到 console
		new Notice(summary, 15000);
	}

	/**
	 * 开发模式：检测 main.js 修改时间变化时自动刷新视图
	 */
	private startDevReloadWatch() {
		// 仅在 Electron 环境下启用
		if (!("require" in window)) return;

		try {
			const fs = (window as unknown as { require: (m: string) => typeof import("fs") }).require("fs");
			const path = (window as unknown as { require: (m: string) => typeof import("path") }).require("path");
			const pluginDir = this.manifest.dir;
			if (!pluginDir) return;
			const srcDir = path.join(pluginDir, "src");
			if (!fs.existsSync(srcDir)) return;

			const mainJsPath = path.join(pluginDir, "main.js");

			let lastMtime = "";
			const interval = window.setInterval(() => {
				try {
					const stat = fs.statSync(mainJsPath);
					const mtime = stat.mtimeMs.toString();
					if (mtime && mtime !== lastMtime) {
						lastMtime = mtime;
						this.refreshView?.();
					}
				} catch (e) { console.warn("[PicLinker] 文件变化检测异常:", e instanceof Error ? e.message : String(e)); }
			}, 1000);

			this.register(() => window.clearInterval(interval));
		} catch {
			// 非 Electron 环境，跳过
		}
	}
}


