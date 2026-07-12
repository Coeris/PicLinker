/**
 * 统一的 HTTP 请求工具
 *
 * - 桌面端（Electron）：优先使用 Node.js HTTP/HTTPS 模块直连，避免 Obsidian 代理
 *   改写签名所需的请求头（Host / Content-Length / 时间戳等）。
 * - 移动端（无 Node require）：使用 Obsidian 官方 `requestUrl()`，走原生代理，
 *   桌面与移动端均不受浏览器 CORS 限制。
 * - 桌面端 Node 请求在 DNS/网络层失败时，GET 类请求回退到 `requestUrl()`；
 *   DELETE 类请求因签名对头部敏感，Node 失败则直接 reject，不回退。
 * - 桌面端 Node 请求按 URL 协议选择 http/https 模块，跟随 3xx 重定向
 *   （最多 5 次，303 → GET），并对响应体积设上限（100MB）防 OOM。
 */

import { requestUrl } from "obsidian";

/** Electron 环境 Node.js require 类型 */
interface NodeRequireFn {
	(moduleName: string): unknown;
}

/** Node.js HTTP(S) 客户端模块最小接口（http 与 https 模块签名一致） */
interface NodeHttpClientModule {
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
	headers: Record<string, string | string[] | undefined>;
	on(event: "data", callback: (chunk: Buffer) => void): void;
	on(event: "end", callback: () => void): void;
	on(event: "error", callback: (e: Error) => void): void;
	destroy?(error?: Error): void;
}

/** Node.js URL 模块 */
interface NodeUrlModule {
	URL: typeof window.URL;
}

/** 最大重定向跟随次数，防止重定向循环 */
const MAX_REDIRECTS = 5;
/** 响应体积上限（100MB），超限 abort 以防 OOM */
const MAX_RESPONSE_SIZE = 100 * 1024 * 1024;

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

/** 取得 Electron window.require 包装（类型安全） */
function getRequire(): NodeRequireFn {
	return (window as unknown as { require: NodeRequireFn }).require;
}

/**
 * 实际执行一次 Node 端 HTTP(S) 请求（含重定向跟随 / 体积上限 / 协议选择）。
 * 不直接回退 requestUrl：由外层 directFetch 统一处理回退语义，
 * 以保证 DELETE 请求签名敏感时不回退。
 */
function nodeFetch(
	url: string,
	options: DirectFetchOptions,
	urlModule: NodeUrlModule,
	redirectCount: number,
): Promise<DirectFetchResponse> {
	const requireFn = getRequire();

	return new Promise((resolve, reject) => {
		const parsed = new urlModule.URL(url);
		const useHttps = parsed.protocol === "https:";
		const client = (useHttps ? requireFn("https") : requireFn("http")) as NodeHttpClientModule;
		const reqOpts = {
			hostname: parsed.hostname,
			port: parsed.port || (useHttps ? "443" : "80"),
			path: parsed.pathname + parsed.search,
			method: options.method || "GET",
			headers: options.headers || {},
		};

		// 显式设置 Content-Length：带签名的 API 请求（COS/OSS 等）依赖精确的
		// Content-Length 计算签名；chunked 编码会改变传输内容导致签名校验失败。
		// 仅在调用方未显式提供 Content-Length 时补充，避免覆盖既有值。
		if (options.body) {
			const hasContentLength =
				"content-length" in (reqOpts.headers as Record<string, string>) ||
				"Content-Length" in (reqOpts.headers as Record<string, string>);
			if (!hasContentLength) {
				const bodyData =
					typeof options.body === "string"
						? Buffer.from(options.body, "utf-8")
						: Buffer.from(options.body);
				(reqOpts.headers as Record<string, string>)["Content-Length"] =
					String(bodyData.length);
			}
		}
		const req = client.request(reqOpts, (res: NodeHttpResponse) => {
			// 响应流中途出错 → reject，否则 Promise 会永久挂起。
			res.on("error", (e: Error) => reject(e));

			const statusCode = res.statusCode ?? 0; // 兜底：undefined 视为失败（0 不在 2xx 区间）

			// 重定向跟随（301/302/303/307/308）
			if (statusCode >= 300 && statusCode < 400) {
				const rawLocation = res.headers.location;
				const location = Array.isArray(rawLocation) ? rawLocation[0] : rawLocation;
				if (!location) {
					reject(new Error(`directFetch: 重定向响应缺少 Location 头 (status ${statusCode})`));
					return;
				}
				if (redirectCount >= MAX_REDIRECTS) {
					reject(new Error(`directFetch: 重定向次数超过上限 (${MAX_REDIRECTS})`));
					return;
				}
				// 相对 Location 基于当前 URL 解析为绝对地址
				const nextUrl = new urlModule.URL(location, url).toString();
				// 303 强制改为 GET，并丢弃 body；其余方法保留语义
				const nextMethod = statusCode === 303 ? "GET" : (options.method || "GET");
				const nextOptions: DirectFetchOptions = {
					...options,
					method: nextMethod,
					body: nextMethod === "GET" ? undefined : options.body,
				};
				// 不再需要原响应体，释放连接后跟随重定向
				res.destroy?.();
				nodeFetch(nextUrl, nextOptions, urlModule, redirectCount + 1).then(resolve, reject);
				return;
			}

			const chunks: Buffer[] = [];
			let total = 0;
			res.on("data", (chunk: Buffer) => {
				total += chunk.length;
				if (total > MAX_RESPONSE_SIZE) {
					const err = new Error(
						`directFetch: 响应体积超过上限 (${MAX_RESPONSE_SIZE} 字节)`,
					);
					// 中止请求与响应，size 超限触发 error → 已通过 res.on("error") 与下方 reject 处理
					res.destroy?.(err);
					req.destroy(err);
					reject(err);
					return;
				}
				chunks.push(chunk);
			});
			res.on("end", () => {
				const buf = Buffer.concat(chunks);
				const text = buf.toString("utf-8");
				resolve({
					ok: statusCode >= 200 && statusCode < 300,
					status: statusCode,
					text: async () => text,
					json: async <T = unknown>() => JSON.parse(text) as T,
					arrayBuffer: async () =>
						buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
				});
			});
		});
		req.on("error", (e: Error) => {
			reject(e);
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

/**
 * 直接 HTTP 请求。
 * 桌面端优先 Node.js http/https 模块，其余情况（移动端 / Node 失败）回退 requestUrl。
 */
export async function directFetch(
	url: string,
	options: DirectFetchOptions = {},
): Promise<DirectFetchResponse> {
	if (typeof window !== "undefined" && "require" in window) {
		let urlModule: NodeUrlModule;
		try {
			urlModule = getRequire()("url") as NodeUrlModule;
		} catch (reqErr) {
			console.warn(`[PicLinker] directFetch: require("url") 失败 → requestUrl 回退: ${reqErr}`);
			return fallbackRequest(url, options);
		}

		try {
			return await nodeFetch(url, options, urlModule, 0);
		} catch (e) {
			// DELETE 请求对签名头部敏感，Node 失败不回退，直接抛出原始错误。
			if (options.method === "DELETE") {
				console.warn("[PicLinker] directFetch: Node.js 请求错误 (DELETE)", e);
				throw e;
			}
			// 其余请求回退到 Obsidian requestUrl（移动端 / Node DNS 异常）。
			console.warn(`[PicLinker] directFetch: Node.js 请求失败 → requestUrl 回退: ${(e as Error)?.message || e}`);
			try {
				return await fallbackRequest(url, options);
			} catch (fe) {
				console.warn("[PicLinker] directFetch: requestUrl 回退也失败", fe);
				throw e; // 保留原始 Node 错误
			}
		}
	}

	// 无 Node 环境（移动端）：直接走 requestUrl
	return fallbackRequest(url, options);
}
