/**
 * PicLinker 设置面板
 * 折叠式布局：插件设置 + WebDAV同步 + 图床配置
 */

import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import { setSafeHTML } from "../view/utils/ViewUtils";
import { confirmAsync } from "../utils/DangerConfirmModal";
import { onAsyncClick, deferAsync } from "../utils/AsyncHandler";
import PicLinkerPlugin from "../main";
import { directFetch } from "../utils/http";
import { ImageBedType, BedTestResults } from "../types";
import { safeBtoa, BED_SETTINGS_KEYS } from "../utils/Common";
import { getBedFaviconSvg } from "../icons";
import type { RemoteConfigData } from "../sync/WebDAVSync";

interface BedConfig {
	name: string;
	desc: string;
	guide: string;
	fields: { name: string; desc: string; placeholder: string; key: string; isSecret?: boolean; required?: boolean }[];
}

/** 图床名称 → 类型映射 */
const BED_NAME_TYPE_MAP: Record<string, ImageBedType> = {
	"GitHub 图床": ImageBedType.GitHub,
	"阿里云 OSS": ImageBedType.Aliyun,
	"腾讯云 COS": ImageBedType.Tencent,
	"其他图床": ImageBedType.Other,
};

const BED_CONFIGS: BedConfig[] = [
	{
		name: "GitHub 图床",
		desc: "",
		guide:
			"【获取 Token】\n" +
			"1. 打开 https://github.com/settings/tokens\n" +
			"2. Generate new token (classic) → 勾选 repo 权限 → 生成并复制 Token\n" +
			"\n【创建仓库】\n" +
			"3. 打开 https://github.com/new 创建公开仓库（Public）\n" +
			"4. 填写下方配置：\n" +
			"   - Owner：GitHub 用户名\n" +
			"   - Repo：仓库名\n" +
			"   - Branch：分支（默认 main）\n" +
			"   - Path：子目录（默认 images）",
		fields: [
			{ name: "Token", desc: "Personal Access Token（需 repo 权限）", placeholder: "ghp_xxxx", key: "githubToken", isSecret: true, required: true },
			{ name: "Owner", desc: "GitHub 用户名", placeholder: "username", key: "githubOwner", required: true },
			{ name: "Repo", desc: "图片仓库名（需为 Public）", placeholder: "image-repo", key: "githubRepo", required: true },
			{ name: "Branch", desc: "分支名", placeholder: "main", key: "githubBranch" },
			{ name: "Path", desc: "子目录路径（可选）", placeholder: "images", key: "githubPath" },
		],
	},
	{
		name: "阿里云 OSS",
		desc: "",
		guide:
			"【获取密钥】\n" +
			"1. 打开 https://ram.console.aliyun.com → AccessKey 管理\n" +
			"2. 创建 AccessKey（建议使用 RAM 子账号，仅授予 OSS 权限）\n" +
			"3. 填写 AccessKey ID 和 Secret\n" +
			"\n【自动获取 Bucket】\n" +
			"4. 填写密钥后自动获取 Bucket 列表\n" +
			"5. 选择 Bucket 后自动填入 Endpoint\n" +
			"6. 如果自动获取失败，可手动填写 Bucket 和 Endpoint\n" +
			"\n【创建 Bucket】\n" +
			"7. 打开 https://oss.console.aliyun.com → 创建 Bucket\n" +
			"8. 读写权限设为「公共读」（图片需要公开访问）\n" +
			"\n【配置跨域】\n" +
			"9. Bucket → 数据安全 → 跨域设置 → 创建规则\n" +
			"10. 来源：app://obsidian.md\n" +
			"11. 方法：GET, PUT, DELETE\n" +
			"12. 允许 Header：*",
		fields: [
			{ name: "AccessKey ID", desc: "AccessKey 管理页面获取", placeholder: "LTAI...", key: "aliyunAccessKeyId", required: true },
			{ name: "AccessKey Secret", desc: "仅创建时显示一次，注意保存", placeholder: "", key: "aliyunAccessKeySecret", isSecret: true, required: true },
		],
	},
	{
		name: "腾讯云 COS",
		desc: "",
		guide:
			"【获取密钥】\n" +
			"1. 打开 https://console.cloud.tencent.com/cam → API 密钥管理\n" +
			"2. 新建密钥（建议使用 CAM 子用户，仅授予 COS 权限）\n" +
			"3. 填写 SecretId 和 SecretKey\n" +
			"\n【自动获取 Bucket】\n" +
			"4. 填写密钥后自动获取 Bucket 列表\n" +
			"5. 选择 Bucket 后自动填入 Region\n" +
			"6. 如果自动获取失败，可手动填写 Bucket 和 Region\n" +
			"\n【创建存储桶】\n" +
			"7. 打开 https://console.cloud.tencent.com/cos → 创建存储桶\n" +
			"8. 访问权限设为「公有读私有写」\n" +
			"9. Bucket 格式：名称-APPID（如 my-images-1250000000）\n" +
			"\n【配置跨域】\n" +
			"10. 存储桶 → 基础配置 → 跨域访问 CORS → 添加规则\n" +
			"11. 来源：app://obsidian.md\n" +
			"12. 方法：GET, PUT, DELETE\n" +
			"13. 允许 Header：*",
		fields: [
			{ name: "SecretId", desc: "API 密钥管理页面获取", placeholder: "AKID...", key: "tencentSecretId", isSecret: true, required: true },
			{ name: "SecretKey", desc: "密钥密码", placeholder: "", key: "tencentSecretKey", isSecret: true, required: true },
		],
	},
	{
		name: "其他图床",
		desc: "",
		guide:
			"【支持的图床】\n" +
			"1. SM.MS：免费图床，只需填写 Token\n" +
			"2. 兰空图床 Lsky Pro：自建图床，需要 API URL + Token 或用户名密码\n" +
			"3. EasyImage：简单图床，需要 API URL + Token\n" +
			"4. Chevereto：商业图床，需要 API URL + Token\n" +
			"5. 其他自建图床：需要 API URL + 认证信息\n" +
			"\n【SM.MS Token 获取】\n" +
			"1. 打开 https://sm.ms → 注册并登录\n" +
			"2. Dashboard → API Token → 复制 Token\n" +
			"\n【自建图床配置】\n" +
			"3. Name：自定义名称（便于识别）\n" +
			"4. API URL：图床接口地址（如 https://your-domain.com/api/v1/upload）\n" +
			"5. Token：认证密钥（部分图床不需要）\n" +
			"6. Username/Password：部分图床需要\n" +
			"7. Path：图片存储子目录（可选）",
		fields: [
			{ name: "Name", desc: "自定义名称，便于识别", placeholder: "SM.MS", key: "otherBedName" },
			{ name: "API URL", desc: "图床接口地址", placeholder: "https://smms.app/api/v2", key: "otherBedUrl", required: true },
			{ name: "Token", desc: "认证密钥（部分图床不需要）", placeholder: "your-token", key: "smmsToken", isSecret: true },
			{ name: "Username", desc: "部分图床需要", placeholder: "admin", key: "otherBedUsername" },
			{ name: "Password", desc: "部分图床需要", placeholder: "••••••", key: "otherBedPassword", isSecret: true },
			{ name: "Path", desc: "图片存储子目录（可选）", placeholder: "images", key: "otherBedPath" },
		],
	},
];

export class PicLinkerSettingTab extends PluginSettingTab {
	private plugin: PicLinkerPlugin;
	/** 防抖保存计时器 */
	private settingsSaveTimer: number | null = null;

	/** 同步操作进行中标志，防止重复点击 */
	private syncing = false;

	/** 同步状态元素引用 */
	private webdavStatusEl: HTMLDivElement | null = null;

	/** 图床连接测试状态 */
	private bedTestResults: BedTestResults = {};

	constructor(app: App, plugin: PicLinkerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * 防抖保存设置：延迟 600ms 后真正写入，
	 * 避免用户快速输入时每个字符都触发 saveSettings → 刷新视图 → WebDAV上传
	 */
	private debouncedSaveSettings(): void {
		if (this.settingsSaveTimer) window.clearTimeout(this.settingsSaveTimer);
		this.settingsSaveTimer = window.setTimeout(deferAsync(async () => {
			try { await this.plugin.saveSettings(); } catch (e) { console.error("[PicLinker] 保存失败:", e); }
			this.settingsSaveTimer = null;
	}), 600);
	}

	private renderSettings(): void {
		void (async () => {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("pic-settings");

		// 清理旧的防抖定时器，防止刷新视图后旧定时器仍触发 saveSettings
		if (this.settingsSaveTimer) {
			window.clearTimeout(this.settingsSaveTimer);
			this.settingsSaveTimer = null;
		}

		// 加载持久化的测试结果
		const data = (await this.plugin.loadData()) as Record<string, unknown>;
		this.bedTestResults = (data?._bedTestResults as BedTestResults) || {};

		// 直接进入设置项，不再显示顶部主标题
		this.renderGeneralSettings(containerEl);

		// 功能开关卡片
		this.renderSectionVisibilitySettings(containerEl);

		// 图床配置卡片
		for (const bed of BED_CONFIGS) {
			this.renderCollapsibleBed(containerEl, bed);
		}

		// WebDAV 同步卡片（放在最后，表示同步所有配置）
		this.renderWebdavSettings(containerEl);
		})();
	}

	display(): void {
		this.renderSettings();
	}

	// ========== 通用设置 ==========

	private renderGeneralSettings(container: HTMLElement) {
		new Setting(container)
			.setName("显示路径")
			.setDesc('开启后显示"根目录/image/photo.jpg"，关闭则只显示"photo.jpg"')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.showPath)
				.onChange((value) => {
					this.plugin.settings.showPath = value;
					this.plugin.refreshView();
					this.debouncedSaveSettings();
				})
			);
	}

	// ========== 插件通用设置 ==========

	// 插件设置已移至顶部独立设置项

	// ========== 插件功能 ==========

	private renderSectionVisibilitySettings(container: HTMLElement) {
		// 卡片容器：与图床/WebDAV 折叠卡片统一的视觉语言，但此处不需要外圈边框与标题
		const card = container.createDiv({ cls: "pic-settings-card pic-settings-card--bare" });

		// 功能项列表
		const items = [
			{ key: "showLocalImages" as const, name: "本地图片" },
			{ key: "showCloudImages" as const, name: "云端图片" },
			{ key: "showLocalUnreferenced" as const, name: "本地未引用" },
			{ key: "showCloudUnreferenced" as const, name: "云端未引用" },
			{ key: "showNotFoundImages" as const, name: "未找到图片" },
			{ key: "showSameNameFiles" as const, name: "同名文件" },
			{ key: "showDuplicates" as const, name: "重复图片" },
			{ key: "showEmptyFolders" as const, name: "空白文件夹" },
		];

		// 创建表格（放在 card 内，与标题同处一个卡片容器）
		const table = card.createEl("table", { cls: "pic-settings-table" });

		for (const item of items) {
			const row = table.createEl("tr");
			row.createEl("td", { text: item.name });

			const toggleCell = row.createEl("td", { cls: "pic-table-toggle" });
			// 创建开关容器
			const toggleWrapper = toggleCell.createDiv({ cls: "pic-toggle-switch" });
			const toggleInput = toggleWrapper.createEl("input", { type: "checkbox" });
			toggleInput.checked = this.plugin.settings[item.key];
			const slider = toggleWrapper.createEl("span", { cls: "pic-toggle-slider" });

			// 点击滑块：仅委托给 toggleInput，由浏览器标准地翻转 checked 并触发 change
			// （保证一次点击只切换一次，避免手动翻转 + change 事件导致的双重执行）
			slider.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				toggleInput.click(); // 浏览器标准翻转 checked 并触发 change
			});

			// 输入框变化事件（唯一的处理入口：保存 + 刷新视图）
			toggleInput.addEventListener("change", () => {
				this.plugin.settings[item.key] = toggleInput.checked;
				this.plugin.refreshView();
				this.debouncedSaveSettings();
			});
		}

		// 添加分割线
		card.createDiv({ cls: "pic-section-divider" });
	}

	// ========== WebDAV 同步 ==========

	private renderWebdavSettings(container: HTMLElement) {
		const collapsible = container.createDiv({ cls: "pic-collapsible" });

		const header = collapsible.createDiv({ cls: "pic-collapsible-header" });
		const titleRow = header.createDiv({ cls: "pic-collapsible-title-row" });
		titleRow.createSpan({ cls: "pic-collapsible-arrow", text: "▶" });
		titleRow.createSpan({ cls: "pic-collapsible-title", text: "WebDAV 同步设置" });

		// 同步状态指示
		const syncStatus = titleRow.createSpan({ cls: "pic-webdav-header-status" });
		this.updateWebdavHeaderStatus(syncStatus);

		header.createSpan({ cls: "pic-collapsible-subtitle", text: "" });

		const content = collapsible.createDiv({ cls: "pic-collapsible-content" });
		collapsible.classList.add("is-collapsed");

		// 服务器配置分组
		content.createDiv({ cls: "pic-setting-category-title", text: "服务器配置" });

		// 服务器地址
		new Setting(content)
			.setName("服务器地址")
			.addText((text) => {
				text.inputEl.addClass("pic-webdav-url-input");
				text
					.setPlaceholder("https://dav.jianguoyun.com/dav/")
					.setValue(this.plugin.settings.webdavUrl)
					.onChange((value) => {
						this.plugin.settings.webdavUrl = value;
						this.debouncedSaveSettings();
					});
				return text;
			});

		// 远程路径提示
		content.createDiv({
			cls: "pic-webdav-path-hint",
			text: `配置文件存储路径：${this.plugin.settings.webdavRemotePath || "/PicLinker/settings.json"}`,
		});

		// 用户名
		new Setting(content)
			.setName("用户名")
			.addText((text) => {
				text.inputEl.addClass("pic-webdav-username-input");
				text
					.setPlaceholder("username")
					.setValue(this.plugin.settings.webdavUsername)
					.onChange((value) => {
						this.plugin.settings.webdavUsername = value;
						this.debouncedSaveSettings();
					});
				return text;
			});

		// 密码
		const pwdSetting = new Setting(content)
			.setName("密码")
			.addText((text) => {
				text.inputEl.type = "password";
				text.inputEl.addClass("pic-webdav-userpwd-input");
				text.inputEl.placeholder = "输入密码";
				text.inputEl.value = this.plugin.settings.webdavPassword;
				text.inputEl.addEventListener("input", () => {
					this.plugin.settings.webdavPassword = text.inputEl.value;
					this.debouncedSaveSettings();
				});
				return text;
			});
		pwdSetting.addButton((btn) => {
			btn.setIcon("eye");
			btn.setTooltip("显示/隐藏");
			btn.onClick(() => {
				const input = pwdSetting.settingEl.querySelector("input") as HTMLInputElement;
				if (input) {
					const isHidden = input.type === "password";
					input.type = isHidden ? "text" : "password";
					btn.setIcon(isHidden ? "eye-off" : "eye");
				}
			});
		});

		// 自动同步开关
		new Setting(content)
			.setName("自动上传")
			.setDesc("保存设置时自动同步到 WebDAV 服务器")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.webdavAutoSync)
					.onChange((value) => {
						// webdavEnable 已移除，开关由 webdavAutoSync 单一承担
					this.plugin.settings.webdavAutoSync = value;
												void this.plugin.saveSettings();
					});
			});

		// 操作按钮区域（手动同步 + 覆盖本地 + 测试连接）
		const actionRow = content.createDiv({ cls: "pic-webdav-actions" });

		const uploadBtn = actionRow.createEl("button", {
			text: "手动同步",
			cls: "mod-cta pic-webdav-btn",
		});
		uploadBtn.addEventListener("click", () => { void this.syncToRemote(uploadBtn); });

		const downloadBtn = actionRow.createEl("button", {
			text: "覆盖本地",
			cls: "pic-webdav-btn",
		});
		downloadBtn.addEventListener("click", () => { void this.syncFromRemoteSmart(downloadBtn); });

		// 测试连接（靠右）
		const testStatus = actionRow.createSpan({ cls: "pic-test-status" });
		const testBtn = actionRow.createEl("button", {
			text: "测试连接",
			cls: "mod-cta",
		});
		testBtn.addEventListener("click", onAsyncClick(async () => {
			testStatus.textContent = "检测中...";
			testStatus.className = "pic-test-status pic-testing";
			try {
				const result = await this.testWebdavConnection();
				if (result.success) {
					testStatus.textContent = "已连接";
					testStatus.className = "pic-test-status pic-ok";
				} else {
					testStatus.textContent = result.error || "连接失败";
					testStatus.className = "pic-test-status pic-fail";
				}
			} catch {
				testStatus.textContent = "测试异常";
				testStatus.className = "pic-test-status pic-fail";
			}
		}));

		// 同步状态显示
		this.webdavStatusEl = content.createDiv({ cls: "pic-webdav-status" });

		// 折叠/展开事件：统一由 .is-collapsed 类驱动（CSS 控制显隐 + 箭头旋转）
		header.addEventListener("click", () => {
			collapsible.classList.toggle("is-collapsed");
		});
	}

	/** 更新 WebDAV 标题栏状态指示 */
	private updateWebdavHeaderStatus(statusEl: HTMLElement) {
		const { webdavUrl, webdavUsername, webdavPassword } = this.plugin.settings;
		const isConfigured = webdavUrl && webdavUsername && webdavPassword;

		if (isConfigured) {
			statusEl.textContent = "已配置";
			statusEl.className = "pic-webdav-header-status pic-webdav-status-enabled";
		} else {
			statusEl.textContent = "未配置";
			statusEl.className = "pic-webdav-header-status pic-webdav-status-disabled";
		}
	}

	private async syncToRemote(btn?: HTMLButtonElement) {
		if (this.syncing) return;

		this.syncing = true;
		this.setButtonLoading(btn, true);
		this.updateSyncStatus("正在上传...");

		try {
			const result = await this.plugin.webDAVSync.uploadToWebdav();
			if (result.ok) {
				new Notice("配置已上传到 WebDAV 服务器");
				this.updateSyncStatus(`上传成功 (${new Date().toLocaleTimeString()})`);
			} else {
				const msg = result.message || `上传失败: HTTP ${result.status}`;
				new Notice(msg);
				this.updateSyncStatus(msg);
			}
		} catch (e) {
			new Notice(`上传异常: ${e}`);
			this.updateSyncStatus(`上传异常: ${e}`);
		} finally {
			this.syncing = false;
			this.setButtonLoading(btn, false);
		}
	}

	private async syncFromRemote() {
		if (!this.plugin.settings.webdavUrl || !this.plugin.settings.webdavUsername || !this.plugin.settings.webdavPassword) {
			new Notice("请先填写 WebDAV 服务器配置");
			return;
		}
		if (!this.plugin.settings.webdavUrl.startsWith("https://")) {
			new Notice("WebDAV 仅支持 HTTPS 连接");
			return;
		}

		try {
			const url = `${this.plugin.settings.webdavUrl}${this.plugin.settings.webdavRemotePath.replace(/^\//, "")}`;
			const auth = safeBtoa(`${this.plugin.settings.webdavUsername}:${this.plugin.settings.webdavPassword}`);

			const response = await directFetch(url, {
				headers: { Authorization: `Basic ${auth}` },
			});

			if (!response.ok) {
				new Notice(`下载失败: HTTP ${response.status}`);
				return;
			}

			const remoteData = await response.json<RemoteConfigData>();
			if (!remoteData || typeof remoteData !== "object") {
				new Notice("远程数据格式无效");
				return;
			}

			// 合并远程图床配置到本地
			for (const k of BED_SETTINGS_KEYS) {
				if (k in remoteData && typeof remoteData[k] === "string") {
					this.plugin.settings[k] = remoteData[k];
				}
			}

			// 更新同步元数据（必须在 saveSettings 之前，否则元数据不会被持久化）
			this.plugin.webDAVSync.meta = {
				lastSyncedAt: new Date().toISOString(),
				lastSyncSource: "download",
			};
			await this.plugin.saveSettings();
			new Notice("已从 WebDAV 下载并应用配置");
			void this.renderSettings(); // 刷新设置页
		} catch (e) {
			new Notice(`下载异常: ${e}`);
		}
	}

	/**
	 * #11 智能下载（带冲突检测）
	 */
	private async syncFromRemoteSmart(btn?: HTMLButtonElement) {
		if (this.syncing) return;

		this.syncing = true;
		this.setButtonLoading(btn, true);
		this.updateSyncStatus("正在检查远程配置...");

		try {
			const result = await this.plugin.webDAVSync.syncFromRemote();

			if (!result) return; // 内部已弹过错误

			if (result.conflict) {
				const msg = result.remoteNewer
					? "远程配置比本地新，是否覆盖本地？"
					: "本地配置比远程新，是否用远程覆盖？";

				if (!(await confirmAsync(this.app, { message: `${result.error}\n\n${msg}` }))) return;

				// 用户确认覆盖 → 强制执行旧版同步逻辑
				this.updateSyncStatus("正在合并...");
				await this.syncFromRemote();
				this.updateSyncStatus(`合并完成 (${new Date().toLocaleTimeString()})`);
				return;
			}

			if (result.success) {
				new Notice("已从 WebDAV 智能合并配置");
				this.updateSyncStatus(`同步成功 (${new Date().toLocaleTimeString()})`);
				void this.renderSettings();
			} else {
				new Notice(result.error || "同步失败");
				this.updateSyncStatus(result.error || "同步失败");
			}
		} finally {
			this.syncing = false;
			this.setButtonLoading(btn, false);
		}
	}

	/** 更新同步状态文本 */
	private updateSyncStatus(text: string): void {
		if (this.webdavStatusEl) {
			this.webdavStatusEl.textContent = text;
		}
	}

	/** 设置按钮加载状态 */
	private setButtonLoading(btn: HTMLButtonElement | undefined, loading: boolean): void {
		if (!btn) return;
		btn.disabled = loading;
		if (loading) {
			btn.dataset.originalText = btn.textContent || "";
			btn.textContent = "处理中...";
		} else {
			btn.textContent = btn.dataset.originalText || btn.textContent;
			delete btn.dataset.originalText;
		}
	}

	// ========== 图床折叠卡片 ==========

	private renderCollapsibleBed(container: HTMLElement, config: BedConfig) {
		const collapsible = container.createDiv({ cls: "pic-collapsible" });

		const header = collapsible.createDiv({ cls: "pic-collapsible-header" });
		const titleRow = header.createDiv({ cls: "pic-collapsible-title-row" });
		titleRow.createSpan({ cls: "pic-collapsible-arrow", text: "▶" });

		// 图床图标
		const bedType = BED_NAME_TYPE_MAP[config.name];
		if (bedType) {
			const iconSpan = titleRow.createSpan({ cls: "pic-bed-icon" });
			setSafeHTML(iconSpan, getBedFaviconSvg(bedType));
		}

		titleRow.createSpan({ cls: "pic-collapsible-title", text: config.name });

		// 配置状态指示器
		const statusSpan = titleRow.createSpan({ cls: "pic-bed-status" });
		this.updateBedStatus(statusSpan, config);

		header.createSpan({ cls: "pic-collapsible-subtitle", text: config.desc });

		const content = collapsible.createDiv({ cls: "pic-collapsible-content" });
		collapsible.classList.add("is-collapsed");

		for (const field of config.fields) {
			const setting = new Setting(content)
				.setDesc(field.desc);
			// 设置名称（必填项加红色星号）
			if (field.required) {
				setSafeHTML(setting.nameEl, `${field.name} <span class="pic-required">*</span>`);
			} else {
				setting.setName(field.name);
			}
			setting
				.addText((text) => {
					// 根据字段类型添加样式类
					text.inputEl.addClass(field.isSecret ? "pic-bed-secret-input" : "pic-bed-input");

					if (field.isSecret) {
						text.inputEl.type = "password";
						text.inputEl.placeholder = field.placeholder;
						text.inputEl.value = this.plugin.settings[field.key] as string;
						text.inputEl.addEventListener("input", () => {
							this.plugin.settings[field.key] = text.inputEl.value;
							this.debouncedSaveSettings();
							// 配置修改时重置测试状态
							if (bedType) void this.resetBedTestResult(bedType);
							this.updateBedStatus(statusSpan, config);
						});
					} else {
						text
							.setPlaceholder(field.placeholder)
							.setValue(this.plugin.settings[field.key] as string)
							.onChange((value) => {
								this.plugin.settings[field.key] = value;
								this.debouncedSaveSettings();
								// 配置修改时重置测试状态
								if (bedType) void this.resetBedTestResult(bedType);
								this.updateBedStatus(statusSpan, config);
							});
					}
					return text;
				});

			// 添加小眼睛按钮切换密码显示
			if (field.isSecret) {
				setting.addButton((btn) => {
					btn.setIcon("eye");
					btn.setTooltip("显示/隐藏");
					btn.onClick(() => {
						const input = setting.settingEl.querySelector("input") as HTMLInputElement;
						if (input) {
							const isHidden = input.type === "password";
							input.type = isHidden ? "text" : "password";
							btn.setIcon(isHidden ? "eye-off" : "eye");
						}
					});
				});
			}
		}

		// 阿里云 OSS：Bucket 选择器 + Endpoint（立即显示，自动获取）
		if (bedType === ImageBedType.Aliyun) {
			const aliyunBucketEl = content.createDiv({ cls: "pic-aliyun-bucket-section" });
			void this.autoFetchAliyunBuckets(aliyunBucketEl, config, statusSpan);
		}

		// 腾讯云 COS：Bucket 选择器 + Region（立即显示，自动获取）
		if (bedType === ImageBedType.Tencent) {
			const tencentBucketEl = content.createDiv({ cls: "pic-tencent-bucket-section" });
			void this.autoFetchTencentBuckets(tencentBucketEl, config, statusSpan);
		}

		// 测试连接按钮
		if (bedType) {
			const testRow = content.createDiv({ cls: "pic-test-connection-row" });
			const testStatus = testRow.createSpan({ cls: "pic-test-status" });
			const testBtn = testRow.createEl("button", {
				text: "测试连接",
				cls: "mod-cta",
			});
			testBtn.addEventListener("click", onAsyncClick(async () => {
				testStatus.textContent = "检测中...";
				testStatus.className = "pic-test-status pic-testing";
				try {
					const connResult = await this.plugin.testBedConnection(bedType);
					if (connResult.success) {
						testStatus.textContent = "已连接";
						testStatus.className = "pic-test-status pic-ok";
						this.bedTestResults[bedType] = true;
					} else {
						testStatus.textContent = connResult.error || "连接失败";
						testStatus.className = "pic-test-status pic-fail";
						this.bedTestResults[bedType] = false;
					}
				} catch {
					testStatus.textContent = "测试异常";
					testStatus.className = "pic-test-status pic-fail";
					this.bedTestResults[bedType] = false;
				}
				// 持久化测试结果
				await this.saveBedTestResults();
				// 更新标题栏状态指示器
				this.updateBedStatus(statusSpan, config);
			}));
		}

		// 配置指南（可折叠）
		this.renderGuide(content, config);

		header.addEventListener("click", () => {
			collapsible.classList.toggle("is-collapsed");
		});
	}

	/** 更新图床配置状态指示器 */
	private updateBedStatus(statusSpan: HTMLElement, config: BedConfig) {
		// 检查所有必填字段是否都已填写
		const allFieldsFilled = config.fields.every((field) => {
			const value = this.plugin.settings[field.key];
			return value && typeof value === "string" && value.trim().length > 0;
		});

		// 检查连接测试是否成功
		const bedType = BED_NAME_TYPE_MAP[config.name];
		const testPassed = bedType ? this.bedTestResults[bedType] === true : false;

		if (allFieldsFilled && testPassed) {
			statusSpan.textContent = "已连接";
			statusSpan.className = "pic-bed-status pic-bed-status-configured";
		} else if (allFieldsFilled) {
			statusSpan.textContent = "已配置";
			statusSpan.className = "pic-bed-status pic-bed-status-configured";
		} else {
			statusSpan.textContent = "未配置";
			statusSpan.className = "pic-bed-status pic-bed-status-unconfigured";
		}
	}

	/** 重置图床连接测试状态（配置修改时调用） */
	private async resetBedTestResult(bedType: string) {
		delete this.bedTestResults[bedType];
		await this.saveBedTestResults();
	}

	/** 持久化图床连接测试结果（仅写 _bedTestResults，避免覆盖真实设置，修复竞态） */
	private async saveBedTestResults() {
		await this.plugin.mergeBedTestResults(this.bedTestResults);
	}

	/** 测试 WebDAV 连接 */
	private async testWebdavConnection(): Promise<{ success: boolean; error?: string }> {
		const { webdavUrl, webdavUsername, webdavPassword } = this.plugin.settings;

		if (!webdavUrl || !webdavUsername || !webdavPassword) {
			return { success: false, error: "请先填写完整配置" };
		}

		if (!webdavUrl.startsWith("https://")) {
			return { success: false, error: "仅支持 HTTPS 连接" };
		}

		try {
			const auth = safeBtoa(`${webdavUsername}:${webdavPassword}`);

			// 使用 PROPFIND 只读请求测试连接，不创建任何文件
			const response = await directFetch(webdavUrl, {
				method: "PROPFIND",
				headers: {
					Authorization: `Basic ${auth}`,
					Depth: "0",
				},
			});

			if (response.ok) {
				return { success: true };
			}
			return { success: false, error: `连接失败: HTTP ${response.status}` };
		} catch (e) {
			return { success: false, error: `连接失败: ${e}` };
		}
	}

	/** 渲染阿里云 Bucket 选择器 + Endpoint（测试成功后显示） */
	private renderAliyunBucketSection(container: HTMLElement, buckets: Array<{ name: string; endpoint: string }>, config: BedConfig, statusSpan: HTMLElement) {
		container.empty();

		// 标题
		container.createDiv({ cls: "pic-setting-category-title", text: "存储桶配置" });

		if (buckets.length > 0) {
			// Bucket 选择器
			const bucketSetting = new Setting(container)
				.setName("Bucket")
				.setDesc("选择存储桶（自动获取列表）");

			const bucketControl = bucketSetting.controlEl;
			bucketControl.empty();

			const bucketSelect = bucketControl.createEl("select", { cls: "pic-bed-input" });
			bucketSelect.setCssStyles({ width: "180px" });
			for (const bucket of buckets) {
				bucketSelect.createEl("option", { value: bucket.name, text: bucket.name });
			}

			// 设置当前值
			const currentBucket = this.plugin.settings.aliyunBucket;
			if (buckets.some(b => b.name === currentBucket)) {
				bucketSelect.value = currentBucket;
			}

			// 新建文件夹
			const dirSetting = new Setting(container)
				.setName("新建文件夹")
				.setDesc("在当前 Bucket 中创建文件夹");

			const dirControl = dirSetting.controlEl;
			dirControl.empty();

			const dirInput = dirControl.createEl("input", {
				type: "text",
				cls: "pic-bed-input",
				attr: { placeholder: "文件夹名" },
			});
			dirInput.setCssStyles({ width: "160px" });

			const dirBtn = dirControl.createEl("button", { cls: "pic-btn-sm", text: "创建" });
			dirBtn.setCssStyles({ marginLeft: "4px" });

			dirBtn.addEventListener("click", onAsyncClick(async () => {
				const dir = dirInput.value.trim().replace(/\/+$/, "");
				if (!dir) { new Notice("请输入文件夹名"); dirInput.focus(); return; }

				const bucketName = bucketSelect.value;
				if (!bucketName) { new Notice("请先选择 Bucket"); return; }

				dirBtn.disabled = true;
				try {
					this.plugin.settings.aliyunBucket = bucketName;
					const selected = buckets.find(b => b.name === bucketName);
					if (selected?.endpoint) this.plugin.settings.aliyunEndpoint = `https://${selected.endpoint}`;
					const bed = this.plugin.imageBedManager.get(ImageBedType.Aliyun);
					if (bed) bed.configure(this.plugin.settings);

					const result = await this.plugin.createCloudDirectory(dir, ImageBedType.Aliyun);
					if (result.success) {
						new Notice(`文件夹已创建: ${dir}`);
						dirInput.value = "";
					} else {
						new Notice(`创建失败: ${result.error}`);
					}
				} catch (e) {
					new Notice(`创建异常: ${e instanceof Error ? e.message : String(e)}`);
				} finally {
					dirBtn.disabled = false;
				}
			}));

			dirInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") dirBtn.click();
			});

			// Endpoint 字段（选择 Bucket 后自动填入）
			let endpointInputEl: HTMLInputElement | null = null;
			new Setting(container)
				.setName("Endpoint")
				.setDesc("选择 Bucket 后自动填入")
				.addText((text) => {
					text.inputEl.addClass("pic-bed-input");
					text
						.setValue(this.plugin.settings.aliyunEndpoint)
						.setPlaceholder("https://oss-cn-hangzhou.aliyuncs.com")
						.onChange((value) => {
							this.plugin.settings.aliyunEndpoint = value;
							this.debouncedSaveSettings();
							this.updateBedStatus(statusSpan, config);
						});
					endpointInputEl = text.inputEl;
				});

			// 更新 Bucket 选择时自动填入 Endpoint（使用已保存的引用）
			bucketSelect.addEventListener("change", () => {
				const selected = buckets.find(b => b.name === bucketSelect.value);
				if (selected?.endpoint && endpointInputEl) {
					const newEndpoint = `https://${selected.endpoint}`;
					this.plugin.settings.aliyunEndpoint = newEndpoint;
					endpointInputEl.value = newEndpoint;
				}
				this.plugin.settings.aliyunBucket = bucketSelect.value;
				this.debouncedSaveSettings();
				this.updateBedStatus(statusSpan, config);
			});
		} else {
			// 无 Bucket 列表：提示手动填写
			new Setting(container)
				.setName("Endpoint")
				.setDesc("无法自动获取，请手动填写")
				.addText((text) => {
					text.inputEl.addClass("pic-bed-input");
					text
						.setValue(this.plugin.settings.aliyunEndpoint)
						.setPlaceholder("https://oss-cn-hangzhou.aliyuncs.com")
						.onChange((value) => {
							this.plugin.settings.aliyunEndpoint = value;
							this.debouncedSaveSettings();
							this.updateBedStatus(statusSpan, config);
						});
				});
		}
	}

	/** 阿里云：自动获取 Bucket 列表并渲染选择器 */
	/** 阿里云 Bucket 缓存（避免重复 API 调用） */
	private static aliyunBucketsCache: Array<{ name: string; endpoint: string }> | null = null;
	private static aliyunBucketsCacheKey = "";

	private async autoFetchAliyunBuckets(container: HTMLElement, config: BedConfig, statusSpan: HTMLElement) {
		const settings = this.plugin.settings;

		// 先渲染空状态
		this.renderAliyunBucketSection(container, [], config, statusSpan);

		// 如果有 AccessKey，自动获取
		if (settings.aliyunAccessKeyId && settings.aliyunAccessKeySecret) {
			try {
				// 检查缓存
				const cacheKey = settings.aliyunAccessKeyId;
				if (PicLinkerSettingTab.aliyunBucketsCache && PicLinkerSettingTab.aliyunBucketsCacheKey === cacheKey) {
					const buckets = PicLinkerSettingTab.aliyunBucketsCache;
					if (!settings.aliyunEndpoint && buckets[0]?.endpoint) {
						settings.aliyunEndpoint = `https://${buckets[0].endpoint}`;
					}
					this.renderAliyunBucketSection(container, buckets, config, statusSpan);
					return;
				}

				const bed = this.plugin.imageBedManager.get(ImageBedType.Aliyun);
				if (bed && bed.listBuckets) {
					bed.configure(settings);
					const buckets = await bed.listBuckets();
					// 缓存结果
					PicLinkerSettingTab.aliyunBucketsCache = buckets;
					PicLinkerSettingTab.aliyunBucketsCacheKey = cacheKey;
					if (buckets.length > 0) {
						if (!settings.aliyunEndpoint && buckets[0].endpoint) {
							settings.aliyunEndpoint = `https://${buckets[0].endpoint}`;
						}
						this.renderAliyunBucketSection(container, buckets, config, statusSpan);
					}
				}
			} catch (e) { console.warn("[PicLinker] 获取 Bucket 列表失败:", e instanceof Error ? e.message : String(e)); }
		}
	}

	/** 腾讯云 Bucket 缓存 */
	private static tencentBucketsCache: Array<{ name: string; endpoint: string }> | null = null;
	private static tencentBucketsCacheKey = "";

	/** 腾讯云：自动获取 Bucket 列表并渲染选择器 */
	private async autoFetchTencentBuckets(container: HTMLElement, config: BedConfig, statusSpan: HTMLElement) {
		const settings = this.plugin.settings;

		// 先渲染空状态
		this.renderTencentBucketSection(container, [], config, statusSpan);

		// 如果有 SecretId/SecretKey，自动获取
		if (settings.tencentSecretId && settings.tencentSecretKey) {
			try {
				// 检查缓存
				const cacheKey = settings.tencentSecretId;
				if (PicLinkerSettingTab.tencentBucketsCache && PicLinkerSettingTab.tencentBucketsCacheKey === cacheKey) {
					const buckets = PicLinkerSettingTab.tencentBucketsCache;
					if (!settings.tencentRegion && buckets[0]?.endpoint) {
						settings.tencentRegion = buckets[0].endpoint;
					}
					this.renderTencentBucketSection(container, buckets, config, statusSpan);
					return;
				}

				const bed = this.plugin.imageBedManager.get(ImageBedType.Tencent);
				if (bed && bed.listBuckets) {
					bed.configure(settings);
					const buckets = await bed.listBuckets();
					PicLinkerSettingTab.tencentBucketsCache = buckets;
					PicLinkerSettingTab.tencentBucketsCacheKey = cacheKey;
					if (buckets.length > 0) {
						if (!settings.tencentRegion && buckets[0].endpoint) {
							settings.tencentRegion = buckets[0].endpoint;
						}
						this.renderTencentBucketSection(container, buckets, config, statusSpan);
					}
				}
			} catch (e) { console.warn("[PicLinker] 获取 Bucket 列表失败:", e instanceof Error ? e.message : String(e)); }
		}
	}

	/** 渲染腾讯云 Bucket 选择器 + Region */
	private renderTencentBucketSection(container: HTMLElement, buckets: Array<{ name: string; endpoint: string }>, config: BedConfig, statusSpan: HTMLElement) {
		container.empty();

		// 标题
		container.createDiv({ cls: "pic-setting-category-title", text: "存储桶配置" });

		if (buckets.length > 0) {
			// Bucket 选择器
			const bucketSetting = new Setting(container)
				.setName("Bucket")
				.setDesc("选择存储桶（自动获取列表）");

			const bucketControl = bucketSetting.controlEl;
			bucketControl.empty();

			const bucketSelect = bucketControl.createEl("select", { cls: "pic-bed-input" });
			bucketSelect.setCssStyles({ width: "220px" });
			for (const bucket of buckets) {
				bucketSelect.createEl("option", { value: bucket.name, text: bucket.name });
			}

			// 设置当前值
			const currentBucket = this.plugin.settings.tencentBucket;
			if (buckets.some(b => b.name === currentBucket)) {
				bucketSelect.value = currentBucket;
			}

			// 新建文件夹
			const dirSetting = new Setting(container)
				.setName("新建文件夹")
				.setDesc("在当前 Bucket 中创建文件夹");

			const dirControl = dirSetting.controlEl;
			dirControl.empty();

			const dirInput = dirControl.createEl("input", {
				type: "text",
				cls: "pic-bed-input",
				attr: { placeholder: "文件夹名" },
			});
			dirInput.setCssStyles({ width: "160px" });

			const dirBtn = dirControl.createEl("button", { cls: "pic-btn-sm", text: "创建" });
			dirBtn.setCssStyles({ marginLeft: "4px" });

			dirBtn.addEventListener("click", onAsyncClick(async () => {
				const dir = dirInput.value.trim().replace(/\/+$/, "");
				if (!dir) { new Notice("请输入文件夹名"); dirInput.focus(); return; }

				const bucketName = bucketSelect.value;
				if (!bucketName) { new Notice("请先选择 Bucket"); return; }

				dirBtn.disabled = true;
				try {
					this.plugin.settings.tencentBucket = bucketName;
					const selected = buckets.find(b => b.name === bucketName);
					if (selected?.endpoint) this.plugin.settings.tencentRegion = selected.endpoint;
					const bed = this.plugin.imageBedManager.get(ImageBedType.Tencent);
					if (bed) bed.configure(this.plugin.settings);

					const result = await this.plugin.createCloudDirectory(dir, ImageBedType.Tencent);
					if (result.success) {
						new Notice(`文件夹已创建: ${dir}`);
						dirInput.value = "";
					} else {
						new Notice(`创建失败: ${result.error}`);
					}
				} catch (e) {
					new Notice(`创建异常: ${e instanceof Error ? e.message : String(e)}`);
				} finally {
					dirBtn.disabled = false;
				}
			}));

			dirInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") dirBtn.click();
			});

			// Region 字段（选择 Bucket 后自动填入）
			let regionInputEl: HTMLInputElement | null = null;
			new Setting(container)
				.setName("Region")
				.setDesc("选择 Bucket 后自动填入")
				.addText((text) => {
					text.inputEl.addClass("pic-bed-input");
					text
						.setValue(this.plugin.settings.tencentRegion)
						.setPlaceholder("ap-guangzhou")
						.onChange((value) => {
							this.plugin.settings.tencentRegion = value;
							this.debouncedSaveSettings();
							this.updateBedStatus(statusSpan, config);
						});
					regionInputEl = text.inputEl;
				});

			// 选择 Bucket 时更新 Region
			bucketSelect.addEventListener("change", () => {
				const selected = buckets.find(b => b.name === bucketSelect.value);
				if (selected?.endpoint && regionInputEl) {
					this.plugin.settings.tencentRegion = selected.endpoint;
					regionInputEl.value = selected.endpoint;
				}
				this.plugin.settings.tencentBucket = bucketSelect.value;
				this.debouncedSaveSettings();
				this.updateBedStatus(statusSpan, config);
			});
		} else {
			// 无 Bucket 列表：手动填写
			new Setting(container)
				.setName("Bucket")
				.setDesc("无法自动获取，请手动填写")
				.addText((text) => {
					text.inputEl.addClass("pic-bed-input");
					text
						.setValue(this.plugin.settings.tencentBucket)
						.setPlaceholder("bucket-1250000000")
						.onChange((value) => {
							this.plugin.settings.tencentBucket = value;
							this.debouncedSaveSettings();
							this.updateBedStatus(statusSpan, config);
						});
				});

			new Setting(container)
				.setName("Region")
				.setDesc("无法自动获取，请手动填写")
				.addText((text) => {
					text.inputEl.addClass("pic-bed-input");
					text
						.setValue(this.plugin.settings.tencentRegion)
						.setPlaceholder("ap-guangzhou")
						.onChange((value) => {
							this.plugin.settings.tencentRegion = value;
							this.debouncedSaveSettings();
							this.updateBedStatus(statusSpan, config);
						});
				});
		}
	}

	/** 渲染可折叠的配置指南 */
	private renderGuide(container: HTMLElement, config: BedConfig) {
		const guideWrapper = container.createDiv({ cls: "pic-guide-wrapper" });

		const guideHeader = guideWrapper.createDiv({ cls: "pic-guide-header" });
		guideHeader.createSpan({ cls: "pic-guide-icon", text: "📖" });
		guideHeader.createSpan({ text: "配置指南" });
		guideHeader.createSpan({ cls: "pic-guide-arrow", text: "▶" });

		const guideContent = guideWrapper.createDiv({ cls: "pic-guide-content" });

		// 格式化指南内容
		const formattedGuide = this.formatGuideContent(config.guide);
		setSafeHTML(guideContent, formattedGuide);

		guideWrapper.classList.add("is-collapsed");
		guideHeader.addEventListener("click", (e) => {
			// 如果点击的是链接，不切换展开/收起
			if ((e.target as HTMLElement).tagName === "A") {
				return;
			}
			e.stopPropagation();
			guideWrapper.classList.toggle("is-collapsed");
		});

		// 处理指南内容中的链接点击
		guideContent.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			// 使用 closest("a") 即使点到链接内部元素也能正确识别，确保冒泡被拦截
			const link = target.closest("a");
			if (link) {
				e.preventDefault();
				e.stopPropagation(); // 阻止冒泡到卡片 header，避免图床卡片意外折叠
				const url = link.getAttribute("href");
				if (url) {
					window.open(url, "_blank");
				}
			}
		});
	}

	/** 格式化指南内容为 HTML */
	private formatGuideContent(guide: string): string {
		// 先将 URL 转换为可点击的链接
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		const escapeHtml = (text: string) => text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");

		return guide
			.split("\n")
			.map((line) => {
				// 标题行：【xxx】
				if (line.match(/^【.+】$/)) {
					return `<div class="pic-guide-section-title">${escapeHtml(line)}</div>`;
				}
				// 步骤行：数字开头
				if (line.match(/^\d+\./)) {
					// 将 URL 转换为链接
					const linkedLine = escapeHtml(line).replace(urlRegex, (url) => {
						return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
					});
					return `<div class="pic-guide-step">${linkedLine}</div>`;
				}
				// 空行
				if (line.trim() === "") {
					return `<div class="pic-guide-spacer"></div>`;
				}
				// 普通行
				const linkedLine = escapeHtml(line).replace(urlRegex, (url) => {
					return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
				});
				return `<div class="pic-guide-text">${linkedLine}</div>`;
			})
			.join("");
	}
}

