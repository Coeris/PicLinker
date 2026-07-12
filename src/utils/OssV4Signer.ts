/**
 * 阿里云 OSS V4 签名工具（OSS4-HMAC-SHA256）
 * 提取自 AliyunOssImageBed，消除 signUrl / signServiceUrl 重复代码
 */

import { getNodeCrypto, hasNodeRequire } from "./nodeCrypto";

// SHA-256 哈希（返回 hex 字符串）
export async function sha256(data: Uint8Array): Promise<string> {
	if (hasNodeRequire()) {
		const nodeCrypto = getNodeCrypto();
		return nodeCrypto.createHash("sha256").update(Buffer.from(data)).digest("hex");
	}
	const hashBuf = await crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
	return Array.from(new Uint8Array(hashBuf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/** 从 endpoint 提取区域，如 oss-cn-chengdu.aliyuncs.com → cn-chengdu */
export function getRegion(endpoint: string): string {
	const match = endpoint.match(/oss-([^.]+)\./);
	return match ? match[1] : "oss-cn-hangzhou";
}

/** HMAC-SHA256 签名（Node.js / Web Crypto 双路径） */
async function hmacSha256(key: Uint8Array | ArrayBuffer | string, msg: string): Promise<Uint8Array> {
	if (hasNodeRequire()) {
		const nodeCrypto = getNodeCrypto();
		if (typeof key === "string") {
			return nodeCrypto.createHmac("sha256", key).update(msg).digest();
		}
		// key 是 Uint8Array 或 ArrayBuffer
		const keyBuf = key instanceof Uint8Array ? Buffer.from(key) : Buffer.from(key);
		return nodeCrypto.createHmac("sha256", keyBuf).update(msg).digest();
	}
	const enc = new TextEncoder();
	if (typeof key === "string") {
		const rawKey = new Uint8Array(enc.encode(key));
		const k = await crypto.subtle.importKey("raw", rawKey.buffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
		return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
	}
	// key 是 Uint8Array 或 ArrayBuffer
	const rawKey = new Uint8Array(key);
	const k = await crypto.subtle.importKey("raw", rawKey.buffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}

/**
 * 推导 V4 签名密钥
 * chain: aliyun_v4{secret} → date → region → service → "aliyun_v4_request"
 */
async function deriveSigningKey(
	accessKeySecret: string,
	date8: string,
	region: string,
): Promise<Uint8Array> {
	const kDate = await hmacSha256("aliyun_v4" + accessKeySecret, date8);
	const kRegion = await hmacSha256(kDate, region);
	const kService = await hmacSha256(kRegion, "oss");
	return hmacSha256(kService, "aliyun_v4_request");
}

/**
 * 生成 V4 签名
 * @returns 签名后的 URL（含 x-oss-signature 参数）
 */
export async function signOssV4(params: {
	method: string;
	canonicalUri: string;
	accessKeyId: string;
	accessKeySecret: string;
	region: string;
	expiresSeconds: number;
	subResources?: Record<string, string>;
	headers?: Record<string, string>;
	baseUrl: string;
	/** 最终 URL 中的路径（默认等于 canonicalUri，OSS 对象级签名时需传 encodedObjectPath） */
	urlPath?: string;
}): Promise<string> {
	const {
		method,
		canonicalUri,
		accessKeyId,
		accessKeySecret,
		region,
		expiresSeconds,
		subResources,
		headers,
		baseUrl,
		urlPath,
	} = params;

	const now = new Date();
	const dateStr = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
	const date8 = dateStr.slice(0, 8);

	// 1. 构造规范查询串
	const queryParams = new URLSearchParams();
	queryParams.set("x-oss-expires", String(expiresSeconds));
	queryParams.set("x-oss-date", dateStr);
	queryParams.set("x-oss-signature-version", "OSS4-HMAC-SHA256");
	queryParams.set(
		"x-oss-credential",
		`${accessKeyId}/${date8}/${region}/oss/aliyun_v4_request`,
	);

	if (subResources) {
		for (const [k, v] of Object.entries(subResources)) {
			queryParams.set(k, v);
		}
	}
	queryParams.sort();

	// 2. 处理需要签名的 headers
	// OSS V4 要求 signed headers 至少包含 host，否则返回 AuthorizationArgumentError
	const headerEntries: Array<[string, string]> = headers
		? Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
		: [];
	const hostValue = (() => {
		try {
			return new URL(baseUrl).host;
		} catch {
			return "";
		}
	})();
	if (hostValue && !headerEntries.some(([k]) => k === "host")) {
		headerEntries.push(["host", hostValue]);
	}
	let canonicalHeaders = "";
	let signedHeaders = "";
	if (headerEntries.length > 0) {
		headerEntries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
		canonicalHeaders = headerEntries.map(([k, v]) => `${k}:${v}`).join("\n") + "\n";
		signedHeaders = headerEntries.map(([k]) => k).join(";");
	}

	// OSS V4 query 签名必须显式携带 x-oss-additional-headers（注意：阿里云用的是 additional-headers 而非 signed-headers），且值须与 canonical request 的 signedHeaders 一致
	queryParams.set("x-oss-additional-headers", signedHeaders);
	queryParams.sort();

	// 3. 构造规范请求
	const canonicalRequest = [
		method,
		canonicalUri,
		queryParams.toString(),
		canonicalHeaders,
		signedHeaders,
		"UNSIGNED-PAYLOAD",
	].join("\n");

	// 4. 构造待签名字符串
	const credentialScope = `${date8}/${region}/oss/aliyun_v4_request`;
	const hashedCanonicalReq = await sha256(new TextEncoder().encode(canonicalRequest));
	const stringToSign = [
		"OSS4-HMAC-SHA256",
		dateStr,
		credentialScope,
		hashedCanonicalReq,
	].join("\n");

	// 5. 推导签名密钥并计算签名
	const signingKey = await deriveSigningKey(accessKeySecret, date8, region);
	const sigBuf = await hmacSha256(signingKey, stringToSign);
	const signature = Array.from(sigBuf)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	// 6. 组装最终 URL
	queryParams.set("x-oss-signature", signature);
	return `${baseUrl}${urlPath ?? canonicalUri}?${queryParams.toString()}`;
}
