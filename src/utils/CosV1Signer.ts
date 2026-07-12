/**
 * 腾讯云 COS V1（XML 请求签名）工具
 * 参考: https://cloud.tencent.com/document/product/436/7778
 * 与官方 Node.js SDK util.js 的 getAuth 对齐
 * 提取自 TencentCosImageBed，消除 signRequest / listBuckets 重复代码
 *
 * 算法要点（对齐官方规范 / 官方 SDK getAuth）：
 *  - HttpMethod 必须小写
 *  - SignKey = HMAC-SHA1(SecretKey, KeyTime) 的「十六进制字符串」（非原始二进制）
 *  - HttpString（FormatString）= [method, path, HttpParameters, HttpHeaders, ""].join("\n")
 *      HttpParameters / HttpHeaders 为 key=value（value 需 UrlEncode），字典序用 & 连接
 *      末尾空段对应 HttpString 结尾的换行符
 *  - StringToSign = ["sha1", KeyTime, SHA1(HttpString), ""].join("\n")
 *  - Signature = HMAC-SHA1(SignKey 的十六进制字符串, StringToSign) 的「十六进制字符串」
 *  - Authorization 中的 q-header-list / q-url-param-list 仅用分号连接 key 列表，
 *    该列表不进入 HttpString（不照搬 AWS V4 的 SignedHeaders 概念）
 */

/** HMAC-SHA1 签名，返回原始字节（Uint8Array） */
export async function hmacSha1(key: string, msg: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(key),
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);
	const buf = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(msg));
	return new Uint8Array(buf);
}

/** 将 Uint8Array 转为十六进制小写字符串 */
function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/** SHA-1 哈希，返回十六进制字符串 */
export async function sha1Hex(data: string): Promise<string> {
	const encoder = new TextEncoder();
	const buf = await crypto.subtle.digest("SHA-1", encoder.encode(data));
	return toHex(new Uint8Array(buf));
}

/**
 * 与官方 SDK 一致的 UrlEncode（在 encodeURIComponent 基础上额外转义 ! ' ( ) *）
 */
function camSafeUrlEncode(str: string): string {
	return encodeURIComponent(str)
		.replace(/!/g, "%21")
		.replace(/'/g, "%27")
		.replace(/\(/g, "%28")
		.replace(/\)/g, "%29")
		.replace(/\*/g, "%2A");
}

/** COS V1 签名结果 */
export interface CosSignResult {
	url: string;
	authHeader: string;
}

/** key/value 记录条目（用于规范化排序） */
interface SignEntry {
	encKey: string;
	value: string;
}

/** 按「小写 + UrlEncode 后的 key」字典序排序，得到规范化条目列表 */
function buildEntries(
	record: Record<string, string> | undefined,
): SignEntry[] {
	if (!record) return [];
	return Object.entries(record)
		.map(([k, v]) => ({ encKey: camSafeUrlEncode(k.toLowerCase()), value: v }))
		.sort((a, b) => (a.encKey < b.encKey ? -1 : a.encKey > b.encKey ? 1 : 0));
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

	// 始终包含 host；内部统一按小写 + UrlEncode 处理
	const allHeaders: Record<string, string> = { host, ...headers };

	// 1. 整理 HeaderList 与 UrlParamList（仅 key 列表，分号连接）
	const headerEntries = buildEntries(allHeaders);
	const paramEntries = buildEntries(queryParams);
	const headerList = headerEntries.map((e) => e.encKey).join(";");
	const paramList = paramEntries.map((e) => e.encKey).join(";");

	// 2. HttpParameters：key=value（value 需 UrlEncode），字典序 & 连接
	const canonicalQuery = paramEntries
		.map((e) => `${e.encKey}=${camSafeUrlEncode(e.value ?? "")}`)
		.join("&");

	// 3. HttpHeaders：key=value（value 为 header 原始值，需 UrlEncode），字典序 & 连接
	const canonicalHeaders = headerEntries
		.map((e) => `${e.encKey}=${camSafeUrlEncode(e.value ?? "")}`)
		.join("&");

	// 4. 生成 SignKey = HMAC-SHA1(SecretKey, KeyTime) 的十六进制字符串
	const signKey = toHex(await hmacSha1(secretKey, keyTime));

	// 5. HttpString（FormatString）：method 小写；末尾空段对应结尾换行
	const httpString = [
		method.toLowerCase(),
		path,
		canonicalQuery,
		canonicalHeaders,
		"",
	].join("\n");

	// 6. StringToSign
	const stringToSign = ["sha1", keyTime, await sha1Hex(httpString), ""].join("\n");

	// 7. Signature = HMAC-SHA1(SignKey 十六进制字符串, StringToSign) 的十六进制字符串
	const signature = toHex(await hmacSha1(signKey, stringToSign));

	// 8. 组装 Authorization 头
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
