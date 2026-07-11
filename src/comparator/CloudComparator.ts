/**
 * 本地 ↔ 云端比对器
 * 检查本地图片是否存在于图床
 * 支持 GitHub、阿里云 OSS、腾讯云 COS、其他图床（含 SM.MS）
 *
 * 比对策略：
 * - 阿里云/腾讯云/其他图床：优先使用云端文件列表按文件名匹配（避免 CORS 问题）
 * - GitHub：使用 HEAD 请求（raw.githubusercontent.com 通常允许跨域）
 */

import { ImageLink, PicLinkerSettings, CompareResult, ImageBedType, CloudFile } from "../types";
import { detectBedTypeFromUrl } from "../icons";
import { directFetch } from "../utils/http";

export class CloudComparator {
	private settings: PicLinkerSettings;

	constructor(settings: PicLinkerSettings) {
		this.settings = settings;
	}

	updateSettings(settings: PicLinkerSettings) {
		this.settings = settings;
	}

	/**
	 * 比对本地图片与云端
	 * @param cloudFiles 可选的云端文件列表，传入后将优先用于文件名匹配（避免 CORS）
	 * @param pathPrefix 可选的云端路径前缀（来自 frontmatter image-path）
	 */
	async compare(
		localImages: ImageLink[],
		bedType: ImageBedType = ImageBedType.GitHub,
		cloudFiles?: CloudFile[],
		pathPrefix?: string,
	): Promise<Map<string, CompareResult>> {
		const result = new Map<string, CompareResult>();

		if (!this.isBedSupported(bedType)) {
			for (const img of localImages) {
				result.set(img.pure, { exists: false });
			}
			return result;
		}

		// ===== 阿里云/腾讯云/其他图床：优先用云端文件列表做文件名匹配（避免 CORS） =====
		// 只要传入了 cloudFiles 参数就走此路径（包括空数组），绝不回退到 HEAD 请求
		if ((bedType === ImageBedType.Aliyun || bedType === ImageBedType.Tencent || bedType === ImageBedType.Other) && cloudFiles) {
			// 构建云端文件名集合（仅文件，排除目录项）
			// 注意：如果不同路径下有同名文件，后者会覆盖前者（已知限制）
			const cloudFileNames = new Set<string>();
			const cloudFileMap = new Map<string, string>(); // fileName → url
			for (const f of cloudFiles) {
				if (!f.isDirectory && f.prefix) {
					const name = f.prefix.split("/").pop() || f.name;
					cloudFileNames.add(name);
					cloudFileMap.set(name, f.url); // 同名文件取最后一个
				}
			}

			for (const img of localImages) {
				if (img.type !== "local") {
					// 远程 URL：检查是否已指向当前图床
					if (this.isUrlFromBed(img.pure, bedType)) {
						result.set(img.pure, { exists: true, url: img.pure });
					} else {
						result.set(img.pure, { exists: false });
					}
					continue;
				}
				const fileName = extractFileName(img.pure);
				const expectedUrl = this.generateExpectedUrl(img.pure, bedType, pathPrefix);

				if (fileName && cloudFileNames.has(fileName)) {
					result.set(img.pure, { exists: true, url: cloudFileMap.get(fileName) || expectedUrl });
				} else {
					result.set(img.pure, { exists: false, url: expectedUrl });
				}
			}
			return result;
		}

		// ===== GitHub 或无云端列表时：回退到 HTTP HEAD 请求 =====
		const checks = localImages.map(async (img) => {
			if (img.type !== "local") {
				// 远程 URL：检查是否已指向当前图床
				if (this.isUrlFromBed(img.pure, bedType)) {
					return { key: img.pure, value: { exists: true, url: img.pure } };
				}
				return { key: img.pure, value: { exists: false } };
		}
		const expectedUrl = this.generateExpectedUrl(img.pure, bedType, pathPrefix);
		if (!expectedUrl) {
			return { key: img.pure, value: { exists: false } };
		}

		const exists = await this.checkUrlExists(expectedUrl);
		return { key: img.pure, value: { exists, url: expectedUrl } };
	});
		const results = await Promise.allSettled(checks);
		for (const r of results) {
			if (r.status === "fulfilled") {
				result.set(r.value.key, r.value.value);
			} else {
				console.warn("[PicLinker] compare HEAD request failed:", r.reason);
			}
		}

		// 确保所有 localImages 都有结果（HEAD 请求失败的标记为未找到）
		for (const img of localImages) {
			if (!result.has(img.pure)) {
				result.set(img.pure, { exists: false });
			}
		}

		return result;
	}

	/**
	 * 判断图床是否支持 URL 比对
	 */
	private isBedSupported(bedType: ImageBedType): boolean {
		switch (bedType) {
			case ImageBedType.GitHub:
				return !!(this.settings.githubOwner && this.settings.githubRepo);
			case ImageBedType.Aliyun:
				return !!(this.settings.aliyunEndpoint && this.settings.aliyunBucket);
			case ImageBedType.Tencent:
				return !!(this.settings.tencentBucket && this.settings.tencentRegion);
			case ImageBedType.Other:
				return !!(this.settings.smmsToken || this.settings.otherBedUrl);
			default:
				return false;
		}
	}

	private generateExpectedUrl(localPure: string, bedType: ImageBedType, pathPrefix?: string): string | undefined {
		switch (bedType) {
			case ImageBedType.GitHub:
				return this.generateGitHubUrl(localPure);
			case ImageBedType.Aliyun:
				return this.generateAliyunUrl(localPure, pathPrefix);
			case ImageBedType.Tencent:
				return this.generateTencentUrl(localPure, pathPrefix);
			default:
				return undefined;
		}
	}

	private generateGitHubUrl(localPure: string): string | undefined {
		const { githubOwner, githubRepo, githubBranch, githubPath } = this.settings;
		if (!githubOwner || !githubRepo) return undefined;

		const fileName = extractFileName(localPure);
		if (!fileName) return undefined;

		const basePath = githubPath ? `${githubPath}/` : "";
		return `https://raw.githubusercontent.com/${githubOwner}/${githubRepo}/${githubBranch}/${basePath}${fileName}`;
	}

	private generateAliyunUrl(localPure: string, pathPrefix?: string): string | undefined {
		const { aliyunEndpoint, aliyunBucket } = this.settings;
		if (!aliyunEndpoint || !aliyunBucket) return undefined;

		const fileName = extractFileName(localPure);
		if (!fileName) return undefined;

		const basePath = pathPrefix ? `${pathPrefix.replace(/^\/+|\/+$/g, "")}/` : "images/";
		const ep = aliyunEndpoint.replace(/^https?:\/\//, "");
		return `https://${aliyunBucket}.${ep}/${basePath}${fileName}`;
	}

	private generateTencentUrl(localPure: string, pathPrefix?: string): string | undefined {
		const { tencentBucket, tencentRegion } = this.settings;
		if (!tencentBucket || !tencentRegion) return undefined;

		const fileName = extractFileName(localPure);
		if (!fileName) return undefined;

		const basePath = pathPrefix ? `${pathPrefix.replace(/^\/+|\/+$/g, "")}/` : "images/";
		return `https://${tencentBucket}.cos.${tencentRegion}.myqcloud.com/${basePath}${fileName}`;
	}

	/**
	 * 检查远程 URL 是否属于指定图床（通过域名匹配）
	 */
	private isUrlFromBed(url: string, bedType: ImageBedType): boolean {
		const detected = detectBedTypeFromUrl(url);
		return detected === bedType;
	}

	private async checkUrlExists(url: string): Promise<boolean> {
		try {
			const response = await directFetch(url, { method: "HEAD" });
			return response.ok;
		} catch (e) { console.warn("[PicLinker] HEAD 请求失败:", e instanceof Error ? e.message : String(e)); return false; }
	}
}

/** 共享的文件名提取工具函数 */
export function extractFileName(localPure: string): string | undefined {
	const normalized = localPure.replace(/\\/g, "/");
	const parts = normalized.split("/");
	return parts[parts.length - 1] || undefined;
}
