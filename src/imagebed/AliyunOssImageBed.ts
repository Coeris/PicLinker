/**
 * 阿里云 OSS 图床实现
 * 使用 OSS V4 预签名 URL 方式，前端直接调用 REST API
 */

import { ImageBed, CloudFile, PicLinkerSettings } from "../types";
import { cleanInvisible, parseXml, parseXmlFileList } from "../utils/Common";
import { directFetch } from "../utils/http";
import { signOssV4, getRegion } from "../utils/OssV4Signer";

export class AliyunOssImageBed implements ImageBed {
	private endpoint = "";
	private bucket = "";
	private accessKeyId = "";
	private accessKeySecret = "";
	private path = "images";

	configure(settings: PicLinkerSettings) {
		this.endpoint = (settings.aliyunEndpoint || "").trim().replace(/\/+$/, "");
		this.bucket = (settings.aliyunBucket || "").trim();
		this.accessKeyId = cleanInvisible((settings.aliyunAccessKeyId || "").trim());
		this.accessKeySecret = cleanInvisible((settings.aliyunAccessKeySecret || "").trim());
		this.path = (settings.aliyunPath || "images").trim().replace(/^\/+|\/+$/g, "");
	}

	private getBaseUrl(): string {
		const ep = this.endpoint.replace(/^https?:\/\//, "");
		return `https://${this.bucket}.${ep}`;
	}

	/**
	 * 生成 OSS V4 预签名 URL（OSS4-HMAC-SHA256）
	 *
	 * @param method HTTP 方法
	 * @param objectPath object 路径，如 /images/a.jpg
	 * @param expiresSeconds 过期秒数（相对时间）
	 * @param subResources 子资源参数
	 */
	async signUrl(
		method: string,
		objectPath: string,
		expiresSeconds: number,
		subResources?: Record<string, string>,
		headers?: Record<string, string>,
	): Promise<string> {
		const region = getRegion(this.endpoint);
		// OSS V4 canonical URI 需要包含 bucket 前缀
		const encodedObjectPath = objectPath.split("/").map(encodeURIComponent).join("/");
		const canonicalUri = `/${this.bucket}${encodedObjectPath}`;

		return signOssV4({
			method,
			canonicalUri,
			accessKeyId: this.accessKeyId,
			accessKeySecret: this.accessKeySecret,
			region,
			expiresSeconds,
			subResources,
			headers,
			baseUrl: this.getBaseUrl(),
			urlPath: encodedObjectPath,
		});
	}

	/**
	 * 生成服务级签名 URL（ListBuckets，不含 bucket 前缀）
	 */
	private async signServiceUrl(method: string, expiresSeconds: number): Promise<string> {
		const region = getRegion(this.endpoint);

		return signOssV4({
			method,
			canonicalUri: "/",
			accessKeyId: this.accessKeyId,
			accessKeySecret: this.accessKeySecret,
			region,
			expiresSeconds,
			baseUrl: `https://oss-${region}.aliyuncs.com`,
		});
	}

	async listFiles(): Promise<CloudFile[]> {
		if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
			return [];
		}

		const files: CloudFile[] = [];
		let continuationToken = "";

		try {
			do {
				const expires = 3600;
				const resource = "/";

				// 不使用 delimiter，递归列出所有文件
				const subResources: Record<string, string> = {
					"list-type": "2",
					"max-keys": "1000",
					"encoding-type": "url",
				};

				if (continuationToken) {
					subResources["continuation-token"] = continuationToken;
				}

				const url = await this.signUrl("GET", resource, expires, subResources);

				const response = await directFetch(url);
				if (!response.ok) {
					console.error("OSS ListObjects failed:", response.status);
					break;
				}

				const xmlText = await response.text();
				const { doc, error } = parseXml(xmlText);

				if (error) {
					console.error("OSS API Error:", error.code, error.message);
					break;
				}

				const baseUrl = this.getBaseUrl();
				const parsedFiles = parseXmlFileList(doc, baseUrl);
				for (const f of parsedFiles) {
					files.push({ ...f, isDirectory: false });
				}

				// 检查是否还有下一页
				const nextToken = doc.querySelector("NextContinuationToken")?.textContent || "";
				const isTruncated = doc.querySelector("IsTruncated")?.textContent === "true";
				continuationToken = isTruncated ? nextToken : "";

			} while (continuationToken);

			// 从文件路径中提取目录结构
			const dirSet = new Set<string>();
			for (const file of files) {
				const key = file.prefix || "";
				const parts = key.split("/");
				// 从路径中提取每层目录
				for (let i = 1; i < parts.length; i++) {
					const dirPath = parts.slice(0, i).join("/") + "/";
					if (!dirSet.has(dirPath)) {
						dirSet.add(dirPath);
						const baseUrl = this.getBaseUrl();
						files.push({
							name: parts[i - 1] + "/",
							url: `${baseUrl}/${dirPath}`,
							isDirectory: true,
							prefix: dirPath,
						});
					}
				}
			}

		} catch (e) {
			console.error("OSS listFiles error:", e instanceof Error ? e.message : String(e));
		}

		return files;
	}

	/**
	 * 列出所有目录（含空目录）
	 * 使用 delimiter=/ 获取 CommonPrefixes
	 */
	async listEmptyDirs(): Promise<string[]> {
		if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) return [];

		const dirs: Set<string> = new Set();
		let continuationToken = "";

		try {
			do {
				const expires = 3600;
				const resource = "/";
				const subResources: Record<string, string> = {
					"list-type": "2",
					"max-keys": "1000",
					"delimiter": "/",
					"encoding-type": "url",
				};
				if (continuationToken) {
					subResources["continuation-token"] = continuationToken;
				}

				const url = await this.signUrl("GET", resource, expires, subResources);
				const response = await directFetch(url);
				if (!response.ok) break;

				const xmlText = await response.text();
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlText, "application/xml");

				// CommonPrefixes = 目录（含空目录）
				const prefixes = xmlDoc.querySelectorAll("CommonPrefixes > Prefix");
				for (const node of prefixes) {
					const prefix = decodeURIComponent(node.textContent?.trim() || "");
					if (prefix) dirs.add(prefix);
				}

				const nextToken = xmlDoc.querySelector("NextContinuationToken")?.textContent || "";
				const isTruncated = xmlDoc.querySelector("IsTruncated")?.textContent === "true";
				continuationToken = isTruncated ? nextToken : "";
			} while (continuationToken);
		} catch (e) {
			console.warn("[PicLinker] listEmptyDirs error:", e instanceof Error ? e.message : String(e));
		}

		return [...dirs];
	}

	/**
	 * 删除文件
	 */
	async delete(filename: string): Promise<{ success: boolean; error?: string }> {
		if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
			return { success: false, error: "阿里云 OSS 配置不完整" };
		}

		try {
			const expires = 3600;
			const prefix = this.path ? `${this.path}/` : "images/";
			const objectKey = filename.includes("/") ? filename : `${prefix}${filename}`;
			const resource = `/${objectKey}`;

			const url = await this.signUrl("DELETE", resource, expires);

			const response = await directFetch(url, { method: "DELETE" });

			if (!response.ok) {
				return { success: false, error: `删除失败: HTTP ${response.status}` };
			}

			return { success: true };
		} catch (e) {
			return { success: false, error: `删除异常: ${e}` };
		}
	}

	/**
	 * 测试连接：尝试列出文件（限制 1 条）
	 */
	async testConnection(): Promise<{ success: boolean; error?: string }> {
		if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
			const missing = [
				!this.bucket && "Bucket",
				!this.endpoint && "Endpoint",
				!this.accessKeyId && "AccessKey ID",
				!this.accessKeySecret && "AccessKey Secret",
			].filter(Boolean).join("、");
			return { success: false, error: `请填写：${missing}` };
		}

		try {
			const expires = 60;
			const resource = "/";
			const subResources: Record<string, string> = { "list-type": "2", "max-keys": "1" };

			const url = await this.signUrl("GET", resource, expires, subResources);
			const response = await directFetch(url);

			if (response.ok || response.status === 404) {
				return { success: true };
			}

			// 解析 OSS 错误 XML 获取详细原因
			const errText = await response.text();
			let detail = "";
			try {
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(errText, "application/xml");
				const code = xmlDoc.querySelector("Code")?.textContent;
				const msg = xmlDoc.querySelector("Message")?.textContent;
				if (code) {
					const friendly: Record<string, string> = {
						"InvalidAccessKeyId": "AccessKey ID 无效",
						"SignatureDoesNotMatch": "AccessKey Secret 错误",
						"InvalidBucketName": "Bucket 名称无效",
						"NoSuchBucket": "Bucket 不存在",
						"AccessDenied": "权限不足，请检查 RAM 策略",
					};
					detail = friendly[code] || `${code}: ${msg}`;
				}
			} catch { /* 保持原文 */ }
			return { success: false, error: detail || `HTTP ${response.status}` };
		} catch {
			return { success: false, error: "网络异常，请检查 Endpoint 是否正确" };
		}
	}

	/**
	 * 创建目录（在 OSS 中 PUT 一个以 / 结尾的空对象）
	 */
	async createDirectory(dirName: string): Promise<{ success: boolean; error?: string }> {
		if (!this.endpoint || !this.bucket || !this.accessKeyId || !this.accessKeySecret) {
			return { success: false, error: "请先完成阿里云 OSS 配置" };
		}

		try {
			const expires = 3600;
			// 确保目录名以 / 结尾
			const dirKey = dirName.endsWith("/") ? dirName : `${dirName}/`;
			const resource = `/${dirKey}`;

			const url = await this.signUrl("PUT", resource, expires);

			const response = await directFetch(url, {
				method: "PUT",
				body: "",
				headers: {
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
	 * 获取可用 Bucket 列表
	 */
	async listBuckets(): Promise<Array<{ name: string; endpoint: string }>> {
		if (!this.accessKeyId || !this.accessKeySecret) {
			return [];
		}

		try {
			const url = await this.signServiceUrl("GET", 60);
			const response = await directFetch(url);

			if (!response.ok) {
				const errText = await response.text();
				console.warn("[PicLinker] listBuckets: 请求失败", response.status, errText.slice(0, 200));
				return [];
			}

			const xmlText = await response.text();
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlText, "application/xml");

			// 检查错误
			const errorCode = xmlDoc.querySelector("Code");
			if (errorCode) {
				console.warn("[PicLinker] listBuckets: API 错误", errorCode.textContent, xmlDoc.querySelector("Message")?.textContent);
				return [];
			}

			const buckets: Array<{ name: string; endpoint: string }> = [];
			const bucketNodes = xmlDoc.querySelectorAll("Bucket");
			for (const node of bucketNodes) {
				const name = node.querySelector("Name")?.textContent?.trim();
				const ep = node.querySelector("ExtranetEndpoint")?.textContent?.trim();
				if (name) buckets.push({ name, endpoint: ep || "" });
			}
			return buckets;
		} catch (e) {
			console.warn("[PicLinker] listBuckets: 异常", e instanceof Error ? e.message : String(e));
			return [];
		}
	}
}
