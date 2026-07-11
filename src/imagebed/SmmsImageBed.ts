/**
 * 其他图床实现（含 SM.MS）
 */

import { ImageBed, CloudFile, PicLinkerSettings } from "../types";
import { cleanInvisible } from "../utils/Common";
import { directFetch } from "../utils/http";

const SMMS_API = "https://smms.app/api/v2";
const HASH_CACHE_MAX = 500;

export class SmmsImageBed implements ImageBed {
	private token = "";

	/** 文件名 → hash 缓存，避免删除时重复拉取上传历史 */
	private hashCache = new Map<string, string>();
	/** 上次 listFiles 返回的文件列表缓存（有 5 分钟有效期，避免 SM.MS API 频率限制） */
	private cachedFiles: CloudFile[] | null = null;
	/** 上次 listFiles 拉取时间戳 */
	private lastListFetchAt = 0;

	configure(settings: PicLinkerSettings) {
		const newToken = cleanInvisible(settings.smmsToken || "").trim();
		if (this.token !== newToken) {
			// Token 变更时清空缓存（不同账号上传历史不同）
			this.cachedFiles = null;
			this.lastListFetchAt = 0;
			this.hashCache.clear();
		}
		this.token = newToken;
	}

	async listFiles(): Promise<CloudFile[]> {
		if (!this.token) return [];

		// 5 分钟内的重复调用直接返回缓存，避免 SM.MS API 频率限制
		const now = Date.now();
		if (this.cachedFiles && (now - this.lastListFetchAt) < 300_000) {
			return this.cachedFiles;
		}

		try {
			const response = await directFetch(`${SMMS_API}/upload_history`, {
				headers: {
					Authorization: this.token,
				},
			});

			if (!response.ok) return this.cachedFiles || [];

			const data = await response.json<{ success?: boolean; data?: Array<Record<string, string>>; message?: string }>();
			if (!data.success || !Array.isArray(data.data)) return this.cachedFiles || [];

			// 填充 hash 缓存
			for (const item of data.data) {
				const name = item.filename || item.origin_name || "";
				if (name && item.hash) {
					if (this.hashCache.size >= HASH_CACHE_MAX) {
						const firstKey = this.hashCache.keys().next().value;
						if (firstKey) this.hashCache.delete(firstKey);
					}
					this.hashCache.set(name, item.hash);
				}
			}

			const mappedFiles: CloudFile[] = data.data.map((item: Record<string, string>) => ({
				name: item.filename || item.origin_name || "",
				url: item.url || "",
				isDirectory: false,
				prefix: item.filename || item.origin_name || "",
			}));

			this.cachedFiles = mappedFiles;
			this.lastListFetchAt = now;
			return mappedFiles;
		} catch (e) {
			console.warn("[PicLinker] SM.MS 获取文件列表失败:", e instanceof Error ? e.message : String(e));
			return this.cachedFiles || [];
		}
	}

	async delete(filename: string): Promise<{ success: boolean; error?: string }> {
		if (!this.token) {
			return { success: false, error: "SM.MS Token 未配置" };
		}

		try {
			// 优先查缓存获取 hash
			let hash = this.hashCache.get(filename);

			if (!hash) {
				// 缓存未命中，拉取上传历史查找
				const historyRes = await directFetch(`${SMMS_API}/upload_history`, {
					headers: { Authorization: this.token },
				});

				if (!historyRes.ok) return { success: false, error: "查询文件失败" };

				const historyData = await historyRes.json<{ success?: boolean; data?: Array<Record<string, string>> }>();
				if (!historyData.success || !Array.isArray(historyData.data)) {
					return { success: false, error: "查询文件列表失败" };
				}

				// 顺便填充缓存
				for (const item of historyData.data) {
					const name = item.filename || item.origin_name || "";
					if (name && item.hash) {
						if (this.hashCache.size >= HASH_CACHE_MAX) {
							const firstKey = this.hashCache.keys().next().value;
							if (firstKey) this.hashCache.delete(firstKey);
						}
						this.hashCache.set(name, item.hash);
					}
				}

				hash = this.hashCache.get(filename);
			}

			if (!hash) {
				return { success: false, error: "未找到文件" };
			}

			const deleteRes = await directFetch(`${SMMS_API}/delete/${hash}`, {
				method: "POST",
				headers: { Authorization: this.token },
			});

			const deleteData = await deleteRes.json<{ success?: boolean; message?: string }>();
			if (!deleteData.success) {
				return { success: false, error: deleteData.message || "删除失败" };
			}

			// 删除成功后从缓存中移除
			this.hashCache.delete(filename);

			return { success: true };
		} catch (e) {
			return { success: false, error: `删除异常: ${e}` };
		}
	}

	/**
	 * 测试连接：尝试获取上传历史（验证 Token 有效性）
	 */
	async testConnection(): Promise<{ success: boolean; error?: string }> {
		if (!this.token) return { success: false, error: "请填写 API Token" };

		try {
			const response = await directFetch(`${SMMS_API}/upload_history`, {
				headers: { Authorization: this.token },
			});

			if (response.status === 401) {
				return { success: false, error: "Token 无效，请在 sm.ms 后台重新获取" };
			}

			if (response.ok) {
				const data = await response.json<{ success?: boolean; message?: string }>();
				if (data.success === false && data.message) {
					return { success: false, error: data.message };
				}
				return { success: true };
			}

			return { success: false, error: `HTTP ${response.status}` };
		} catch {
			return { success: false, error: "网络异常，请检查网络连接" };
		}
	}

	async createDirectory(_dirName: string): Promise<{ success: boolean; error?: string }> {
		return { success: false, error: "SM.MS 不支持创建目录" };
	}

	testCreateDirectoryCapability(): Promise<{ supported: boolean; reason?: string }> {
		return Promise.resolve({ supported: false, reason: "SM.MS 不支持创建目录" });
	}
}
