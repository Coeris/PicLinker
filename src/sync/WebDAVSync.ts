/**
 * WebDAV 同步服务
 * 从 main.ts 提取的 WebDAV 上传/下载/冲突检测逻辑
 */

import { PicLinkerSettings } from "../types";
import { safeBtoa, BED_SETTINGS_KEYS } from "../utils/Common";
import { decryptSensitiveFields } from "../utils/SecureStorage";
import { directFetch } from "../utils/http";

/** WebDAV 同步元数据 */
export interface WebDAVMeta {
	lastSyncedAt?: string;
	lastSyncSource?: string;
	lastLocalModifiedAt?: string;
	lastRemoteModifiedAt?: string;
}

/** 远程配置数据结构 */
export interface RemoteConfigData {
	_syncedAt?: string;
	[key: string]: string | undefined;
}

/** 冲突检测结果 */
export interface ConflictResult {
	success: boolean;
	error?: string;
	conflict?: boolean;
	remoteNewer?: boolean;
	localNewer?: boolean;
}

export class WebDAVSync {
	meta: WebDAVMeta | null = null;
	/** 标记位：syncFromRemote 下载后禁止自动上传回远程，防止循环 */
	skipAutoUpload = false;

	constructor(
		private settings: PicLinkerSettings,
		private vaultName: string,
		private onSettingsChanged: (updatedSettings: PicLinkerSettings) => Promise<void>,
	) {}

	updateSettings(settings: PicLinkerSettings) {
		this.settings = settings;
	}

	/**
	 * 获取图床配置的明文数据（用于 WebDAV 同步）
	 * 解密敏感字段后再返回，确保远程存储的是明文，
	 * 其他设备下载后可以用本地密钥重新加密
	 */
	async getDecryptedBedSettings(): Promise<Record<string, string>> {
		const salt = `imagelmgr:${this.vaultName}`;
		const decrypted = await decryptSensitiveFields(this.settings, salt);
		const bedData: Record<string, string> = {};
		for (const k of BED_SETTINGS_KEYS) {
			bedData[k] = typeof decrypted[k] === "string" ? decrypted[k] : "";
		}
		return bedData;
	}

	/**
	 * WebDAV 静默自动上传（不弹 Notice）
	 */
	async syncToRemote(): Promise<void> {
		await this.uploadToWebdav();
	}

	/**
	 * 公共上传逻辑：MKCOL 创建目录 → PUT 上传配置
	 * 同时被 SettingTab.syncToRemote() 和本类的 syncToRemote() 调用
	 * @returns { ok: boolean, status?: number, message?: string }
	 */
	async uploadToWebdav(): Promise<{ ok: boolean; status?: number; message?: string }> {
		if (!this.settings.webdavUrl || !this.settings.webdavUsername || !this.settings.webdavPassword) {
			return { ok: false, message: "WebDAV 配置不完整" };
		}
		if (!this.settings.webdavUrl.startsWith("https://")) {
			console.warn("[PicLinker] WebDAV 仅支持 HTTPS，已跳过同步");
			return { ok: false, message: "WebDAV 仅支持 HTTPS" };
		}

		try {
			const url = `${this.settings.webdavUrl}${this.settings.webdavRemotePath.replace(/^\//, "")}`;
			const auth = safeBtoa(`${this.settings.webdavUsername}:${this.settings.webdavPassword}`);

			// 先创建目录（MKCOL），忽略已存在的错误
			const dirUrl = url.substring(0, url.lastIndexOf("/"));
			await directFetch(dirUrl + "/", {
				method: "MKCOL",
				headers: { Authorization: `Basic ${auth}` },
			});

			const bedData = await this.getDecryptedBedSettings();
			bedData._syncedAt = new Date().toISOString();

			const response = await directFetch(url, {
				method: "PUT",
				headers: {
					Authorization: `Basic ${auth}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(bedData, null, 2),
			});

			if (response.ok || response.status === 201 || response.status === 204) {
				return { ok: true, status: response.status };
			}
			return { ok: false, status: response.status, message: `HTTP ${response.status}` };
		} catch (e) {
			console.warn("[PicLinker] syncToRemote: 异常", e);
			return { ok: false, message: `异常: ${e}` };
		}
	}

	/**
	 * 从服务器下载并带冲突检测
	 * @returns 冲突信息或 null
	 */
	async syncFromRemote(): Promise<ConflictResult | null> {
		if (!this.settings.webdavUrl || !this.settings.webdavUsername || !this.settings.webdavPassword) {
			return { success: false, error: "请先填写 WebDAV 服务器配置", conflict: false };
		}
		if (!this.settings.webdavUrl.startsWith("https://")) {
			return { success: false, error: "WebDAV 仅支持 HTTPS 连接", conflict: false };
		}

		let localSyncedAt: string | undefined;
		let remoteSyncedAt: string | undefined;

		try {
			const url = `${this.settings.webdavUrl}${this.settings.webdavRemotePath.replace(/^\//, "")}`;
			const auth = safeBtoa(`${this.settings.webdavUsername}:${this.settings.webdavPassword}`);

			// 获取远程数据
			const response = await directFetch(url, { headers: { Authorization: `Basic ${auth}` } });
			if (!response.ok) {
				return { success: false, error: `下载失败: HTTP ${response.status}`, conflict: false };
			}

			const remoteData = await response.json<RemoteConfigData>();
			if (!remoteData || typeof remoteData !== "object") {
				return { success: false, error: "远程数据格式无效", conflict: false };
			}

			remoteSyncedAt = remoteData._syncedAt;

			// 尝试获取本地上次同步时间
			if (this.meta) localSyncedAt = this.meta.lastSyncedAt;

			// 冲突检测：三方比较
			// 1. 本地上次同步时间 (lastSyncedAt)
			// 2. 本地最后修改时间 (lastLocalModifiedAt)
			// 3. 远程最后修改时间 (remoteSyncedAt)
			if (localSyncedAt && remoteSyncedAt) {
				const lastSyncTime = new Date(localSyncedAt).getTime();
				const remoteTime = new Date(remoteSyncedAt).getTime();
				const localModifiedAt = this.meta?.lastLocalModifiedAt;
				const localModifiedTime = localModifiedAt ? new Date(localModifiedAt).getTime() : 0;

				// 检查是否两边都有修改
				const localModified = localModifiedTime > lastSyncTime;
				const remoteModified = remoteTime > lastSyncTime;

				if (localModified && remoteModified) {
					// 两边都有修改，存在冲突
					return {
						success: false,
						error: "检测到配置可能存在冲突",
						conflict: true,
						remoteNewer: remoteTime > localModifiedTime,
						localNewer: localModifiedTime > remoteTime,
					};
				}
			}

			// 无冲突，执行合并
			for (const k of BED_SETTINGS_KEYS) {
				if (k in remoteData && typeof remoteData[k] === "string") {
					this.settings[k] = remoteData[k];
				}
			}

			// 更新同步元数据
			this.meta = {
				lastSyncedAt: new Date().toISOString(),
				lastSyncSource: "download",
				lastRemoteModifiedAt: remoteSyncedAt,
			};

			// 标记禁止自动上传，防止 saveSettings 触发 syncToRemote 形成循环
			this.skipAutoUpload = true;

			// 通知插件保存设置
			await this.onSettingsChanged(this.settings);
			return { success: true, conflict: false };
		} catch (e) {
			return { success: false, error: `下载异常: ${e}`, conflict: false };
		}
	}
}
