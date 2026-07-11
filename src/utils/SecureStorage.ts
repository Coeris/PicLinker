/**
 * SecureStorage - 凭据加密存储工具
 * 使用 AES-GCM 加密敏感字段，密钥从 vault 名称 PBKDF2 派生
 */

const ENC_PREFIX = "enc:v1:";

// 需要加密的敏感字段
export const SENSITIVE_FIELDS = [
	"githubToken",
	"aliyunAccessKeyId",
	"aliyunAccessKeySecret",
	"tencentSecretId",
	"tencentSecretKey",
	"smmsToken",
	"webdavPassword",
	"otherBedPassword",
] as const;

function isEncrypted(value: string): boolean {
	return value.startsWith(ENC_PREFIX);
}

/** 当前版本的密钥材料 */
const KEY_MATERIAL_V2 = "PicLinker-v2:aes-gcm-pbkdf2-100k";
/** 旧版本密钥材料（用于向后兼容解密） */
const KEY_MATERIAL_V1 = "PicLinker-v1";

async function deriveKey(salt: string, material: string = KEY_MATERIAL_V2): Promise<CryptoKey> {
	if (!salt) {
		throw new Error("[PicLinker] deriveKey: salt 不能为空，请检查 vault 名称是否可获取");
	}

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(material),
		"PBKDF2",
		false,
		["deriveKey"]
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: new TextEncoder().encode(salt),
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);
}

async function encryptValue(plaintext: string, key: CryptoKey): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		new TextEncoder().encode(plaintext)
	);

	const combined = new Uint8Array(iv.length + encrypted.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted), iv.length);

	// 分块转换避免栈溢出（spread 运算符对大数组会超出参数上限）
	let binary = "";
	const chunkSize = 8192;
	for (let i = 0; i < combined.length; i += chunkSize) {
		binary += String.fromCharCode.apply(null, Array.from(combined.subarray(i, i + chunkSize)));
	}
	return ENC_PREFIX + btoa(binary);
}

async function decryptValue(ciphertext: string, key: CryptoKey): Promise<string> {
	const raw = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
	const iv = raw.slice(0, 12);
	const data = raw.slice(12);

	const decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		key,
		data
	);

	return new TextDecoder().decode(decrypted);
}

/**
 * 加密设置中的敏感字段
 */
export async function encryptSensitiveFields(
	settings: Record<string, unknown>,
	deviceSalt: string,
): Promise<Record<string, unknown>> {
	const key = await deriveKey(deviceSalt);
	const result = { ...settings };

	for (const field of SENSITIVE_FIELDS) {
		const value = result[field];
		if (typeof value === "string" && value && !isEncrypted(value)) {
			result[field] = await encryptValue(value, key);
		}
	}

	return result;
}

/**
 * 解密设置中的敏感字段（自动跳过未加密值，兼容旧数据）
 * 支持 v1 和 v2 密钥自动迁移：先用 v2 解密，失败则回退 v1
 */
export async function decryptSensitiveFields(
	settings: Record<string, unknown>,
	deviceSalt: string,
): Promise<Record<string, unknown>> {
	const keyV2 = await deriveKey(deviceSalt, KEY_MATERIAL_V2);
	const result = { ...settings };

	for (const field of SENSITIVE_FIELDS) {
		const value = result[field];
		if (typeof value === "string" && isEncrypted(value)) {
			const cipher = value.slice(ENC_PREFIX.length);
			try {
				// 优先用 v2 密钥解密
				result[field] = await decryptValue(cipher, keyV2);
			} catch (e2) {
				try {
					// 回退 v1 密钥解密（仅 v2 失败时才派生 v1，避免每次浪费 PBKDF2 计算）
					const keyV1 = await deriveKey(deviceSalt, KEY_MATERIAL_V1);
					result[field] = await decryptValue(cipher, keyV1);
				} catch (e1) {
					console.warn(`[PicLinker] 解密字段 ${field} 失败 (v2: ${e2}, v1: ${e1})，已清空`);
					result[field] = "";
				}
			}
		}
	}

	return result;
}
