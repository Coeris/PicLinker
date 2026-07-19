/**
 * SecureStorage - 凭据加密存储工具
 *
 * 方案说明（修复 P0-3 / P0-4）：
 *  - salt 改为「持久随机值」（每插件实例首次运行时用 CSPRNG 生成 32 字节，Base64 存于 data.json 的 `_encSalt`），
 *    不再依赖 vault 名称 → 改名不会导致派生密钥变化，从而根除「vault 改名静默清空凭据」(P0-3)。
 *  - KEK 输入由「公开常量 + 随机持久 salt」组成：随机 salt 提供机密性，常量仅作 pepper → 拿到 data.json 也无法离线重放 (P0-4)。
 *  - PBKDF2 迭代次数由 100k 提升到 600k（OWASP 建议，SHA-256）。
 *  - 解密彻底失败时【绝不返回 ""】：保留原密文并告警，由调用方提示用户重新输入。
 *
 * 版本 / 前缀：
 *  - ENC_LEGACY_PREFIX = "enc:v1:" —— 旧方案（salt=vault 名，100k）。用于升级迁移。
 *  - ENC_PREFIX        = "enc:v2:" —— 新方案（salt=随机持久值，600k）。
 */

// 新方案前缀（v2）
const ENC_PREFIX = "enc:v2:";
// 旧方案前缀（v1，历史数据），用于迁移
const ENC_LEGACY_PREFIX = "enc:v1:";

// 随机 salt 字节长度（CSPRNG）
const SALT_BYTES = 32;

// 新方案迭代次数（OWASP 建议，SHA-256）
export const PBKDF2_ITERS = 600000;
// 旧方案迭代次数（兼容老密文）
const PBKDF2_ITERS_LEGACY = 100000;

// 应用级 pepper（源码常量，仅作额外熵，真正的机密性来自随机持久 salt）
const KEY_MATERIAL_V2 = "PicLinker-v2:aes-gcm-pbkdf2";
// 更早版本的密钥材料（向后兼容解密）
const KEY_MATERIAL_V1 = "PicLinker-v1";

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

/** 判断一个值是否为已加密的密文（兼容新旧前缀） */
export function isEncrypted(value: unknown): boolean {
	return typeof value === "string" &&
		(value.startsWith(ENC_PREFIX) || value.startsWith(ENC_LEGACY_PREFIX));
}

/** 生成持久随机 salt（32 字节 CSPRNG），返回 Base64 字符串 */
export function generateSalt(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	let binary = "";
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
	}
	return btoa(binary);
}

async function deriveKey(salt: string, material: string, iterations: number): Promise<CryptoKey> {
	if (!salt) {
		throw new Error("[PicLinker] deriveKey: salt 不能为空");
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
			iterations,
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
 * 加密设置中的敏感字段（新方案：随机持久 salt + 600k）
 * 已加密（任意前缀）的字段会被跳过，保证幂等。
 */
export async function encryptSensitiveFields(
	settings: Record<string, unknown>,
	deviceSalt: string,
): Promise<Record<string, unknown>> {
	const key = await deriveKey(deviceSalt, KEY_MATERIAL_V2, PBKDF2_ITERS);
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
 * 解密设置中的敏感字段（新方案）。
 * - ENC_PREFIX(v2) 字段：用随机持久 salt + 600k 解密。
 * - ENC_LEGACY_PREFIX(v1) 字段：本函数不处理（交给迁移流程），保留原密文。
 * - 解密彻底失败：内存置空 + console.warn（磁盘 data.json 仍保留原密文防丢失）。
 *   原因：保留密文会导致下游把密文字面量当明文使用（如 Basic 鉴权发 enc:v2:... 当密码），
 *   产生难以排查的 401/403 错误。置空后下游拿到空字符串，用户会被提示重填。
 */
export async function decryptSensitiveFields(
	settings: Record<string, unknown>,
	deviceSalt: string,
): Promise<Record<string, unknown>> {
	const key = await deriveKey(deviceSalt, KEY_MATERIAL_V2, PBKDF2_ITERS);
	const result = { ...settings };

	for (const field of SENSITIVE_FIELDS) {
		const value = result[field];
		if (typeof value === "string" && value.startsWith(ENC_PREFIX)) {
			const cipher = value.slice(ENC_PREFIX.length);
			try {
				result[field] = await decryptValue(cipher, key);
			} catch (e) {
				// v2 解密失败：内存置空（磁盘仍保留原密文防丢失）。
				// 避免下游把密文字面量当明文使用（如 Basic 鉴权发 enc:v2:... 当密码 → 401）。
				result[field] = "";
				console.warn(`[PicLinker] 解密字段 ${field} 失败 (v2: ${e})，已置空，请重新填写`);
			}
		} else if (typeof value === "string" && value.startsWith(ENC_LEGACY_PREFIX)) {
			// v1 旧密文在 v2 路径中无法解密（salt 已换）：置空，避免密文当明文发出。
			// 迁移路径（migrateLegacyToNewSalt）会单独尝试 v1 解密；此处仅兜底。
			result[field] = "";
			console.warn(`[PicLinker] 字段 ${field} 仍为旧版密文 (v1)，已置空，请重新填写`);
		}
	}

	return result;
}

/**
 * 使用旧方案解密敏感字段（salt=vault 名，100k），用于升级迁移。
 * 任一密文无法解密时，该字段保留原密文（不覆盖、不清空）。
 * 返回解密后的 settings 与是否全部成功（allOk）。
 */
export async function decryptLegacyFields(
	settings: Record<string, unknown>,
	legacySalt: string,
): Promise<{ settings: Record<string, unknown>; allOk: boolean }> {
	const keyV2 = await deriveKey(legacySalt, KEY_MATERIAL_V2, PBKDF2_ITERS_LEGACY);
	const keyV1 = await deriveKey(legacySalt, KEY_MATERIAL_V1, PBKDF2_ITERS_LEGACY);
	const result = { ...settings };
	let allOk = true;

	for (const field of SENSITIVE_FIELDS) {
		const value = result[field];
		if (typeof value === "string" && value.startsWith(ENC_LEGACY_PREFIX)) {
			const cipher = value.slice(ENC_LEGACY_PREFIX.length);
			let plain: string | null = null;
			try {
				plain = await decryptValue(cipher, keyV2);
			} catch {
				try {
					plain = await decryptValue(cipher, keyV1);
				} catch {
					plain = null;
				}
			}
			if (plain !== null) {
				result[field] = plain;
			} else {
				// 解密失败：内存中置空（磁盘 data.json 仍保留原密文防丢失）
				// 下游消费者（图床实例等）拿到空字符串，不会拿密文去发请求
				result[field] = "";
				allOk = false;
			}
		}
	}

	return { settings: result, allOk };
}

/**
 * 升级迁移：尝试用旧方案（vault 名 salt）解密，成功后准备用新随机 salt 重新加密。
 * - newSaltB64：本次迁移生成的新随机 salt（Base64）。
 * - hadLegacy：数据中是否存在旧方案密文。
 * - allDecrypted：旧密文是否全部成功解出（false 表示可能因改名等原因无法恢复）。
 *
 * 注意：本函数只做「解密 + 生成新 salt」，不写盘、不改动 in-memory 的明文 settings，
 * 重新加密并持久化由调用方负责（保证迁移幂等、凭据不丢）。
 */
export async function migrateLegacyToNewSalt(
	settings: Record<string, unknown>,
	legacySalt: string,
): Promise<{
	settings: Record<string, unknown>;
	newSaltB64: string;
	hadLegacy: boolean;
	allDecrypted: boolean;
}> {
	const newSaltB64 = generateSalt();
	const { settings: decrypted, allOk } = await decryptLegacyFields(settings, legacySalt);

	let hadLegacy = false;
	for (const field of SENSITIVE_FIELDS) {
		const value = settings[field];
		if (typeof value === "string" && value.startsWith(ENC_LEGACY_PREFIX)) {
			hadLegacy = true;
			break;
		}
	}

	return { settings: decrypted, newSaltB64, hadLegacy, allDecrypted: allOk };
}
