/**
 * PicLinker - 图床管家
 * 全库图片扫描、同名文件检测、图片去重、图床比对
 */

import { Plugin, TFile, Notice } from "obsidian";
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
import { encryptSensitiveFields, decryptSensitiveFields } from "./utils/SecureStorage";
import { LinkEditor } from "./editor/LinkEditor";
import { WebDAVSync, WebDAVMeta } from "./sync/WebDAVSync";
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
	webdavEnable: false,
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
	/** 临时存储的 WebDAV 元数据（loadSettings 时暂存，webDAVSync 初始化后恢复） */
	private _pendingWebdavMeta?: WebDAVMeta;

	async onload() {
		// 初始化核心模块（loadSettings 需要 vaultScanner）
		this.linkParser = new LinkParser();
		this.vaultScanner = new VaultScanner(this.app, this.linkParser);
		this.linkEditor = new LinkEditor(this.app);

		await this.loadSettings();

		// WebDAV 同步服务（依赖已加载的 settings）
		this.webDAVSync = new WebDAVSync(
			this.settings,
			this.app.vault.getName(),
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
			this.app.vault.on("rename", (file) => {
				this.onFileChanged(file.path, false);
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

	onActiveFileChanged() {
		// 活跃文件切换防抖：延迟更新视图
		this.debounceActiveRefresh();
	}

	private fileDebounceTimer: number | null = null;
	private activeDebounceTimer: number | null = null;

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
		const { _hashcache, _webdavmeta, _dedupcache, _scancache, ...settingsData } = data;
		// 清理已废弃的旧字段
		const deprecatedKeys = ["autoRefreshOnOpen", "showUnreferenced", "deleteConfirm", "debounceDelay"];
		for (const key of deprecatedKeys) {
			delete settingsData[key];
		}
		const raw = Object.assign({}, DEFAULT_SETTINGS, settingsData);
		// 解密敏感字段（自动兼容旧的明文数据）
		const salt = `imagelmgr:${this.app.vault.getName()}`;
		this.settings = await decryptSensitiveFields(raw, salt) as PicLinkerSettings;
		// 恢复去重缓存
		if (_hashcache && typeof _hashcache === "string") {
			this.hashCache = new HashCache(_hashcache);
		}
		// 恢复去重哈希缓存
		if (_dedupcache && typeof _dedupcache === "string") {
			this.dedupCache = new DedupCache(_dedupcache);
		}
		// 恢复 WebDAV 同步元数据（延迟到 webDAVSync 初始化后赋值）
		if (_webdavmeta) {
			this._pendingWebdavMeta = _webdavmeta;
		}
		// 恢复扫描缓存（避免每次启动全量扫描）
		if (_scancache && typeof _scancache === "string") {
			this.vaultScanner.loadSerialized(_scancache);
		}
	}

	async saveSettings() {
		// 加密敏感字段后保存
		const salt = `imagelmgr:${this.app.vault.getName()}`;
		const encrypted = await encryptSensitiveFields(this.settings, salt);
		// 将 hash cache、dedup cache 和 webdav meta 合并到主数据对象
		const savePayload: Record<string, unknown> = { ...encrypted };
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
		await this.saveData(savePayload);
		// 更新各图床配置
		for (const bed of this.imageBedManager.getAll()) {
			bed.configure(this.settings);
		}
		this.cloudComparator.updateSettings(this.settings);
		this.webDAVSync?.updateSettings(this.settings);
		this.refreshView();
		// #11 WebDAV 自动同步：设置保存时自动上传（需开启开关，且未从远程下载）
		if (this.settings.webdavEnable && this.settings.webdavAutoSync && this.settings.webdavUrl && this.settings.webdavUsername && this.settings.webdavPassword 
			&& !this.webDAVSync?.skipAutoUpload) {
			void this.webDAVSync.syncToRemote();
		}
		// 重置标记位（单次用途）
		if (this.webDAVSync) this.webDAVSync.skipAutoUpload = false;
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
			const salt = `imagelmgr:${this.app.vault.getName()}`;
			const testValue = "test-token-12345";
			const encrypted = await encryptSensitiveFields({ testField: testValue }, salt);
			const decrypted = await decryptSensitiveFields(encrypted, salt);
			add(decrypted.testField === testValue, "敏感字段加密/解密");
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
		console.info("[PicLinker 诊断]", summary);
		new Notice(summary, 15000);
	}

// ==================== 开发模式热加载 ====================

/** 开发模式：检测 main.js 修改时间变化时自动刷新视图 */
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


