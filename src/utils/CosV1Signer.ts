/**
 * 腾讯云 COS V1 签名工具
 * 参考: https://cloud.tencent.com/document/product/436/7778
 * 提取自 TencentCosImageBed，消除 signRequest / listBuckets 重复代码
 */

/** HMAC-SHA1 签名（返回原始字符串，非 hex） */
export async function hmacSha1(key: string, msg: string): Promise<string> {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(key),
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);
	const buf = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(msg));
	return Array.from(new Uint8Array(buf))
		.map((b) => String.fromCharCode(b))
		.join("");
}

/** SHA-1 哈希（返回 hex 字符串） */
export async function sha1Hex(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const buf = await crypto.subtle.digest("SHA-1", encoder.encode(data));
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/** COS V1 签名结果 */
export interface CosSignResult {
	url: string;
	authHeader: string;
}

/**
 * 生成 COS V1 Authorization 签名头
 */
export async function signCosV1(params: {
	method: string;
	path: string;
	host: string;
	secretId: string;
	secretKey: string;
	headers?: Record<string, string>;
	queryParams?: Record<string, string>;
}): Promise<CosSignResult> {
	const { method, path, host, secretId, secretKey, headers, queryParams } = params;

	const now = new Date();
	const timestamp = Math.floor(now.getTime() / 1000);
	const keyTime = `${timestamp};${timestamp + 3600}`;

	// 合并 headers（始终包含 host）
	const allHeaders: Record<string, string> = { host, ...headers };

	// 1. 整理 HeaderList 和 ParamList
	const sortedHeaderKeys = Object.keys(allHeaders)
		.map((k) => k.toLowerCase())
		.sort();
	const headerList = sortedHeaderKeys.join(";");
	const paramList = queryParams
		? Object.keys(queryParams).sort().join(";")
		: "";

	let canonicalQuery = "";
	if (queryParams) {
		const sortedKeys = Object.keys(queryParams).sort();
		canonicalQuery = sortedKeys
			.map((k) => `${k}=${encodeURIComponent(queryParams[k] ?? "")}`)
			.join("&");
	}

	// 2. 生成 SignKey = HMAC-SHA1(SecretKey, KeyTime)
	const signKey = await hmacSha1(secretKey, keyTime);

	// 3. 生成 StringToSign
	const canonicalHeaders =
		sortedHeaderKeys.map((k) => `${k}:${allHeaders[k]}`).join("\n") + "\n";
	const canonicalRequest = [
		method,
		path,
		canonicalQuery,
		canonicalHeaders,
		headerList,
		"",
	].join("\n");
	const canonicalReqHash = await sha1Hex(canonicalRequest);
	const stringToSign = `sha1\n${keyTime}\n${canonicalReqHash}\n`;

	// 4. 计算 Signature = HMAC-SHA1(SignKey, StringToSign)
	const signature = btoa(await hmacSha1(signKey, stringToSign));

	// 5. 组装 Authorization 头
	const authorization =
		`q-sign-algorithm=sha1` +
		`&q-ak=${secretId}` +
		`&q-sign-time=${keyTime}` +
		`&q-key-time=${keyTime}` +
		`&q-header-list=${headerList}` +
		`&q-url-param-list=${paramList}` +
		`&q-signature=${signature}`;

	// 构造完整 URL
	let url = `https://${host}${path}`;
	if (canonicalQuery) {
		url += "?" + canonicalQuery;
	}

	return { url, authHeader: authorization };
}
