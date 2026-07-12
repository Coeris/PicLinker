/**
 * Node.js crypto 模块的安全存取
 *
 * 桌面端（Electron）中 `window.require("crypto")` 可用，但 Obsidian 的类型定义里
 * `window.require` 是 `any`，直接用会在项目内引入 unsafe-any Lint 警告。
 * 这里集中做「一次」类型断言（as unknown as 受控转换），调用方拿到强类型 NodeCrypto，
 * 避免在多处散落 (window as any).
 */

interface NodeHash {
	update(data: Uint8Array | Buffer): NodeHash;
	digest(): Buffer;
	digest(encoding: "hex"): string;
}

interface NodeHmac {
	update(data: string | Buffer): NodeHmac;
	digest(): Buffer;
}

export interface NodeCrypto {
	createHash(algorithm: string): NodeHash;
	createHmac(algorithm: string, key: string | Buffer): NodeHmac;
}

interface WindowWithRequire extends Window {
	require(module: "crypto"): NodeCrypto;
	require(module: "fs"): NodeFs;
}

/** 最小化的 Node fs 子集（仅用到的同步接口），用于大文件分块读取 */
export interface NodeFs {
	openSync(path: string, flags: string): number;
	readSync(fd: number, buffer: Buffer, offset: number, length: number, position: number): number;
	closeSync(fd: number): void;
}

/** 当前环境是否为桌面端（有可用 require）。 */
export function hasNodeRequire(): boolean {
	return typeof window !== "undefined" && "require" in window;
}

/** 取得 Node.js crypto 模块（仅桌面端有效，调用前先 hasNodeRequire()）。 */
export function getNodeCrypto(): NodeCrypto {
	const w = window as unknown as WindowWithRequire;
	return w.require("crypto");
}

/** 取得 Node.js fs 模块（仅桌面端有效，调用前先 hasNodeRequire()）。 */
export function getNodeFs(): NodeFs {
	const w = window as unknown as WindowWithRequire;
	return w.require("fs");
}
