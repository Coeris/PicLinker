/**
 * 统一的 HTTP 请求工具
 *
 * - 桌面端（Electron）：优先使用 Node.js HTTPS 模块直连，避免 Obsidian 代理
 *   改写签名所需的请求头（Host / Content-Length / 时间戳等）。
 * - 移动端（无 Node require）：使用 Obsidian 官方 `requestUrl()`，走原生代理，
 *   桌面与移动端均不受浏览器 CORS 限制。
 * - 桌面端 Node 请求在 DNS/网络层失败时，GET 类请求回退到 `requestUrl()`；
 *   DELETE 类请求因签名对头部敏感，Node 失败则直接 reject，不回退。
 */

import { requestUrl } from "obsidian";

/** Electron 环境 Node.js require 类型 */
interface NodeRequireFn {
	(moduleName: string): unknown;
}

/** Node.js HTTPS 模块最小接口 */
interface NodeHttpsModule {
	request(
		opts: Record<string, unknown>,
		callback: (res: NodeHttpResponse) => void,
	): NodeHttpRequest;
}

interface NodeHttpRequest {
	setTimeout(ms: number, callback: () => void): void;
	write(data: string | Uint8Array): void;
	end(): void;
	destroy(error?: Error): void;
	on(event: "error", callback: (e: Error) => void): void;
}

interface NodeHttpResponse {
	statusCode: number;
	on(event: "data" | "end", callback: (chunk?: Buffer) => void): void;
}

/** Node.js URL 模块 */
interface NodeUrlModule {
	URL: typeof window.URL;
}

export interface DirectFetchOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: string | ArrayBuffer;
}

export interface DirectFetchResponse {
	ok: boolean;
	status: number;
	text: () => Promise<string>;
	json: <T = unknown>() => Promise<T>;
	arrayBuffer: () => Promise<ArrayBuffer>;
}

/**
 * 移动端 / 无 Node 环境的回退请求：走 Obsidian 原生 requestUrl（绕过 CORS）。
 */
async function fallbackRequest(
	url: string,
	options: DirectFetchOptions,
): Promise<DirectFetchResponse> {
	const resp = await requestUrl({
		url,
		method: options.method || "GET",
		headers: options.headers || {},
		body: options.body,
	});
	const buf = resp.arrayBuffer;
	const text = resp.text ?? new TextDecoder().decode(buf);
	return {
		ok: resp.status >= 200 && resp.status < 300,
		status: resp.status,
		text: async () => text,
		json: async <T = unknown>() => JSON.parse(text) as T,
		arrayBuffer: async () => buf,
	};
}

/**
 * 直接 HTTP 请求。
 * 桌面端优先 Node.js https 模块，其余情况（移动端 / Node 失败）回退 requestUrl。
 */
export async function directFetch(
	url: string,
	options: DirectFetchOptions = {},
): Promise<DirectFetchResponse> {
	if (typeof window !== "undefined" && "require" in window) {
		let https: NodeHttpsModule;
		let URL: NodeUrlModule;
		try {
			const req = (window as unknown as { require: NodeRequireFn }).require;
			https = req("https") as NodeHttpsModule;
			URL = req("url") as NodeUrlModule;
		} catch (reqErr) {
			console.warn(`[PicLinker] directFetch: require("https"/"url") 失败 → requestUrl 回退: ${reqErr}`);
			return fallbackRequest(url, options);
		}

		return new Promise((resolve, reject) => {
			const parsed = new URL.URL(url);
			const reqOpts = {
				hostname: parsed.hostname,
				port: parsed.port || 443,
				path: parsed.pathname + parsed.search,
				method: options.method || "GET",
				headers: options.headers || {},
			};
			const req = https.request(reqOpts, (res: NodeHttpResponse) => {
				const chunks: Buffer[] = [];
				res.on("data", (chunk?: Buffer) => { if (chunk) chunks.push(chunk); });
				res.on("end", () => {
					const buf = Buffer.concat(chunks);
					const text = buf.toString("utf-8");
					resolve({
						ok: res.statusCode >= 200 && res.statusCode < 300,
						status: res.statusCode,
						text: async () => text,
						json: async <T = unknown>() => JSON.parse(text) as T,
						arrayBuffer: async () =>
							buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
					});
				});
			});
			req.on("error", (e: Error) => {
				// DELETE 请求对签名头部敏感，Node 失败不回退，直接报错。
				if (options.method === "DELETE") {
					console.warn("[PicLinker] directFetch: Node.js 请求错误 (DELETE)", e);
					reject(e);
					return;
				}
				// 其余请求回退到 Obsidian requestUrl（移动端 / Node DNS 异常）。
				console.warn(`[PicLinker] directFetch: Node.js 请求失败 → requestUrl 回退: ${e.message || e}`);
				fallbackRequest(url, options).then(
					(result) => resolve(result),
					(fe) => {
						console.warn("[PicLinker] directFetch: requestUrl 回退也失败", fe);
						reject(e); // 保留原始 Node 错误
					},
				);
			});
			// 超时处理：15 秒无响应则中止
			req.setTimeout(15000, () => {
				req.destroy(new Error("directFetch: 请求超时 (15s)"));
			});
			if (options.body) {
				const bodyData =
					typeof options.body === "string"
						? options.body
						: Buffer.from(options.body);
				req.write(bodyData);
			}
			req.end();
		});
	}

	// 无 Node 环境（移动端）：直接走 requestUrl
	return fallbackRequest(url, options);
}
