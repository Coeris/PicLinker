/**
 * GitHub 图床实现
 */

import { ImageBed, CloudFile, PicLinkerSettings } from "../types";
import { cleanInvisible } from "../utils/Common";
import { directFetch, DirectFetchResponse } from "../utils/http";

export class GitHubImageBed implements ImageBed {
	private token = "";
	private owner = "";
	private repo = "";
	private branch = "main";
	private path = "";

	configure(settings: PicLinkerSettings) {
		// 清除不可见字符（零宽空格等，从网页复制密钥时可能混入）
		this.token = cleanInvisible(settings.githubToken || "");
		this.owner = (settings.githubOwner || "").trim();
		this.repo = (settings.githubRepo || "").trim();
		this.branch = settings.githubBranch || "main";
		this.path = settings.githubPath || "images";
	}

	async listFiles(): Promise<CloudFile[]> {
		if (!this.token || !this.owner || !this.repo) return [];

		const files: CloudFile[] = [];

		// 递归获取目录内容
		await this.fetchDirectoryContents(this.path, files);

		return files;
	}

	/**
	 * 递归获取指定目录下的所有文件
	 * 通过 GitHub API Link header 实现分页，自动拉取所有页
	 */
	private async fetchDirectoryContents(dirPath: string, files: CloudFile[]): Promise<void> {
		const encodedDir = dirPath.split("/").map(encodeURIComponent).join("/");
		let pageUrl: string | null = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodedDir}?ref=${this.branch}&per_page=100`;

		while (pageUrl) {
			try {
				const response = await directFetch(pageUrl, {
					headers: {
						Authorization: `Bearer ${this.token}`,
						Accept: "application/vnd.github.v3+json",
					},
				});

				if (!response.ok) return;

				const data = await response.json<Array<{ type?: string; name?: string; path?: string; download_url?: string }>>();
				if (!Array.isArray(data)) return;

				for (const item of data) {
					if (item.type === "file") {
						const name = item.name ?? "";
						const prefix = item.path ?? "";
						const downloadUrl = item.download_url || `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${prefix}`;
						files.push({ name, url: downloadUrl, prefix });
					} else if (item.type === "dir") {
						// 递归获取子目录
						await this.fetchDirectoryContents(item.path ?? "", files);
					}
				}

				// 从 Link header 解析下一页 URL
				pageUrl = this.parseNextPageHeader(response);
			} catch (e) {
				console.warn("[PicLinker] GitHub 目录列表获取失败:", e instanceof Error ? e.message : String(e));
				return;
			}
		}
	}

	/**
	 * 从 GitHub API 响应 Link header 解析下一页 URL。
	 * GitHub 列表 API 默认每页 30 条（本插件已通过 per_page=100 提升上限），
	 * 超出部分通过 Link 头分页。格式示例：
	 *   Link: <https://api.github.com/.../contents/images?ref=main&page=2>; rel="next", <...>; rel="last"
	 * 仅当存在 rel="next" 时返回其 URL，否则（已是末页）返回 null。
	 */
	private parseNextPageHeader(response: DirectFetchResponse): string | null {
		const linkHeader = response.headers?.link;
		if (!linkHeader) return null;
		const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
		return nextMatch ? nextMatch[1] : null;
	}

	async delete(filename: string): Promise<{ success: boolean; error?: string }> {
		if (!this.token || !this.owner || !this.repo) {
			return { success: false, error: "GitHub 图床配置不完整" };
		}

		const basePath = this.path ? `${this.path}/` : "";
		const path = `${basePath}${filename}`;
		const encodedPath = path.split("/").map(encodeURIComponent).join("/");
		const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodedPath}`;

		try {
			// 先获取文件 SHA
			const getResponse = await directFetch(`${url}?ref=${this.branch}`, {
				headers: {
					Authorization: `Bearer ${this.token}`,
					Accept: "application/vnd.github.v3+json",
				},
			});

			if (!getResponse.ok) {
				return { success: false, error: "文件不存在" };
			}

			const data = await getResponse.json<{ sha: string }>();
			const sha = data.sha;

			const deleteResponse = await directFetch(url, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${this.token}`,
					"Content-Type": "application/json",
					Accept: "application/vnd.github.v3+json",
				},
				body: JSON.stringify({
					message: `Delete ${filename} via PicLinker`,
					sha,
					branch: this.branch,
				}),
			});

			if (!deleteResponse.ok) {
				const err = await deleteResponse.json<{ message?: string }>();
				return { success: false, error: err.message || "删除失败" };
			}

			return { success: true };
		} catch (e) {
			return { success: false, error: `删除异常: ${e}` };
		}
	}

	/**
	 * 测试连接：尝试获取仓库信息
	 */
	async testConnection(): Promise<{ success: boolean; error?: string }> {
		if (!this.token || !this.owner || !this.repo) {
			const missing = [
				!this.token && "Token",
				!this.owner && "Owner",
				!this.repo && "Repo",
			].filter(Boolean).join("、");
			return { success: false, error: `请填写：${missing}` };
		}

		try {
			const response = await directFetch(
				`https://api.github.com/repos/${this.owner}/${this.repo}`,
				{
					headers: {
						Authorization: `Bearer ${this.token}`,
						Accept: "application/vnd.github.v3+json",
					},
				}
			);

			if (response.ok) {
				return { success: true };
			}
			if (response.status === 401) return { success: false, error: "Token 无效或已过期，请重新生成" };
			if (response.status === 404) return { success: false, error: `仓库 ${this.owner}/${this.repo} 不存在` };
			if (response.status === 403) return { success: false, error: "权限不足，请确认 Token 有 repo 权限" };

			const err = await response.json<{ message?: string }>();
			return { success: false, error: err.message || `HTTP ${response.status}` };
		} catch {
			return { success: false, error: `网络异常，请检查网络连接` };
		}
	}

	async createDirectory(_dirName: string): Promise<{ success: boolean; error?: string }> {
		return { success: false, error: "GitHub 图床不支持创建目录" };
	}

	testCreateDirectoryCapability(): Promise<{ supported: boolean; reason?: string }> {
		return Promise.resolve({ supported: false, reason: "GitHub 图床不支持创建目录" });
	}
}
