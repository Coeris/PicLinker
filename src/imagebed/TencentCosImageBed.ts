/**
 * 腾讯云 COS 图床实现
 * 使用 COS V1 签名方式，前端直接调用 REST API
 */

import { ImageBed, CloudFile, PicLinkerSettings } from "../types";
import { cleanInvisible, parseXml, parseXmlFileList } from "../utils/Common";
import { signCosV1 } from "../utils/CosV1Signer";
import { directFetch } from "../utils/http";

export class TencentCosImageBed implements ImageBed {
	private secretId = "";
	private secretKey = "";
	private bucket = "";
	private region = "";
	private path = "images";

	configure(settings: PicLinkerSettings) {
		this.secretId = cleanInvisible((settings.tencentSecretId || "").trim());
		this.secretKey = cleanInvisible((settings.tencentSecretKey || "").trim());
		this.bucket = (settings.tencentBucket || "").trim();
		this.region = (settings.tencentRegion || "").trim();
		this.path = (settings.tencentPath || "images").trim().replace(/^\/+|\/+$/g, "");
	}

	private getBaseUrl(): string {
		return `https://${this.bucket}.cos.${this.region}.myqcloud.com`;
	}

	private getHost(): string {
		return `${this.bucket}.cos.${this.region}.myqcloud.com`;
	}

	/**
	 * 生成 COS Authorization 签名头（V1 签名）
	 */
	private async signRequest(
		method: string,
		path: string,
		headers?: Record<string, string>,
		queryParams?: Record<string, string>,
	): Promise<{ url: string; authHeader: string }> {
		return signCosV1({
			method,
			path,
			host: this.getHost(),
			secretId: this.secretId,
			secretKey: this.secretKey,
			headers,
			queryParams,
		});
	}

	async listFiles(): Promise<CloudFile[]> {
		if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
			return [];
		}

		const files: CloudFile[] = [];

		try {
			const baseUrl = this.getBaseUrl();
			let marker = "";

			do {
			const queryParams: Record<string, string> = {
				"max-keys": "1000",
				"prefix": "",
				"encoding-type": "url",
			};
			if (marker) {
				queryParams["marker"] = marker;
			}

				const { url, authHeader } = await this.signRequest("GET", "/", {}, queryParams);

				const response = await directFetch(url, {
					headers: { Authorization: authHeader },
				});

				if (!response.ok) {
					console.error("COS ListObjects failed:", response.status);
					break;
				}

				const xmlText = await response.text();
				const { doc, error } = parseXml(xmlText, response.status);

				if (error) {
					console.error("COS API Error:", error.code, error.message);
					break;
				}

				const parsedFiles = parseXmlFileList(doc, baseUrl);
				for (const f of parsedFiles) {
					files.push({ ...f, isDirectory: false });
				}

				const rawMarker = doc.querySelector("IsTruncated")?.textContent === "true"
					? (doc.querySelector("NextMarker")?.textContent || "")
					: "";
				try {
					marker = rawMarker ? decodeURIComponent(rawMarker) : "";
				} catch {
					marker = rawMarker; // 解码失败时使用原始值
				}
			} while (marker);

			// 从文件路径中提取目录结构
			const dirSet = new Set<string>();
			for (const file of files) {
				const parts = (file.prefix || "").split("/");
				for (let i = 1; i < parts.length; i++) {
					const dirPath = parts.slice(0, i).join("/") + "/";
					if (!dirSet.has(dirPath)) {
						dirSet.add(dirPath);
						files.push({
							name: parts[i - 1] + "/",
							url: `${this.getBaseUrl()}/${dirPath}`,
							isDirectory: true,
							prefix: dirPath,
						});
					}
				}
			}
		} catch (e) {
			console.error("COS listFiles error:", e instanceof Error ? e.message : String(e));
		}

		return files;
	}

	async delete(filename: string): Promise<{ success: boolean; error?: string }> {
		if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
			return { success: false, error: "腾讯云 COS 配置不完整" };
		}

		try {
			const prefix = this.path ? `${this.path}/` : "images/";
			const objectKey = filename.includes("/") ? filename : `${prefix}${filename}`;
			const { url, authHeader } = await this.signRequest("DELETE", `/${objectKey}`);

			const response = await directFetch(url, {
				method: "DELETE",
				headers: { Authorization: authHeader },
			});

			if (!response.ok) {
				return { success: false, error: `删除失败: HTTP ${response.status}` };
			}

			return { success: true };
		} catch (e) {
			return { success: false, error: `删除异常: ${e}` };
		}
	}

	/**
	 * 测试连接：尝试 ListObjects（限制 1 条）
	 */
	async testConnection(): Promise<{ success: boolean; error?: string }> {
		if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
			const missing = [
				!this.secretId && "SecretId",
				!this.secretKey && "SecretKey",
				!this.bucket && "Bucket",
				!this.region && "Region",
			].filter(Boolean).join("、");
			return { success: false, error: `请填写：${missing}` };
		}

		try {
			const queryParams: Record<string, string> = {
				"max-keys": "1",
				"prefix": "",
			};
			const { url, authHeader } = await this.signRequest("GET", "/", {}, queryParams);

			const response = await directFetch(url, { headers: { Authorization: authHeader } });

			// 200 表示成功，404 表示桶为空（也算连接成功）
			if (response.ok || response.status === 404) {
				return { success: true };
			}

			// 403 通常是签名错误或权限不足
			if (response.status === 403) {
				return { success: false, error: "权限不足，请检查密钥和桶的 ACL/策略配置" };
			}

			const errText = await response.text();
			return { success: false, error: `HTTP ${response.status}: ${errText.slice(0, 100)}` };
		} catch {
			return { success: false, error: "网络异常，请检查 Region 是否正确" };
		}
	}

	async createDirectory(dirName: string): Promise<{ success: boolean; error?: string }> {
		if (!this.secretId || !this.secretKey || !this.bucket || !this.region) {
			return { success: false, error: "请先完成腾讯云 COS 配置" };
		}

		try {
			const dirKey = dirName.endsWith("/") ? dirName : `${dirName}/`;
			const { url, authHeader } = await this.signRequest("PUT", `/${dirKey}`);

			const response = await directFetch(url, {
				method: "PUT",
				body: "",
				headers: {
					Authorization: authHeader,
					"Content-Length": "0",
				},
			});

			if (!response.ok && response.status !== 200) {
				return { success: false, error: `创建目录失败: HTTP ${response.status}` };
			}

			return { success: true };
		} catch (e) {
			return { success: false, error: `创建目录异常: ${e}` };
		}
	}

	async testCreateDirectoryCapability(): Promise<{ supported: boolean; reason?: string }> {
		return { supported: true };
	}

	/**
	 * 获取可用 Bucket 列表（使用 GetService API）
	 * 参考: https://cloud.tencent.com/document/product/436/8291
	 */
	async listBuckets(): Promise<Array<{ name: string; endpoint: string }>> {
		if (!this.secretId || !this.secretKey) return [];

		try {
			// GetService 使用 service 域名签名（host=service.cos.myqcloud.com，path="/"，无 query/headers）
			const { url, authHeader } = await signCosV1({
				method: "GET",
				path: "/",
				host: "service.cos.myqcloud.com",
				secretId: this.secretId,
				secretKey: this.secretKey,
			});

			const response = await directFetch(url, {
				headers: { Authorization: authHeader },
			});

			if (!response.ok) return [];

			const xmlText = await response.text();
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlText, "application/xml");

			const buckets: Array<{ name: string; endpoint: string }> = [];
			const bucketNodes = xmlDoc.querySelectorAll("Bucket");
			for (const node of bucketNodes) {
				const name = node.querySelector("Name")?.textContent?.trim() || "";
				const loc = node.querySelector("Location")?.textContent?.trim() || "";
				if (name) {
					buckets.push({ name, endpoint: loc });
				}
			}
			return buckets;
		} catch (e) {
			console.warn("[PicLinker] COS listBuckets 失败:", e instanceof Error ? e.message : String(e));
			return [];
		}
	}

	/**
	 * 列出所有目录（含空目录，使用 delimiter 获取 CommonPrefixes）
	 */
	async listEmptyDirs(): Promise<string[]> {
		if (!this.secretId || !this.secretKey || !this.bucket || !this.region) return [];

		const dirs: Set<string> = new Set();
		let marker = "";

		try {
			do {
				const queryParams: Record<string, string> = {
					"max-keys": "1000",
					"delimiter": "/",
					"encoding-type": "url",
				};
				if (marker) queryParams["marker"] = marker;

				const { url, authHeader } = await this.signRequest("GET", "/", {}, queryParams);
				const response = await directFetch(url, { headers: { Authorization: authHeader } });
				if (!response.ok) break;

				const xmlText = await response.text();
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlText, "application/xml");

				const prefixes = xmlDoc.querySelectorAll("CommonPrefixes > Prefix");
				for (const node of prefixes) {
					const prefix = decodeURIComponent(node.textContent?.trim() || "");
					if (prefix) dirs.add(prefix);
				}

				const rawMarker = xmlDoc.querySelector("IsTruncated")?.textContent === "true"
					? (xmlDoc.querySelector("NextMarker")?.textContent || "")
					: "";
				try { marker = rawMarker ? decodeURIComponent(rawMarker) : ""; }
				catch { marker = rawMarker; }
			} while (marker);
		} catch (e) {
			console.warn("[PicLinker] COS listEmptyDirs 失败:", e instanceof Error ? e.message : String(e));
		}

		return [...dirs];
	}
}
