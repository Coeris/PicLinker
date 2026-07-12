/**
 * 核心类型定义
 */

export interface ImageLink {
	/** 原始完整链接（含 | 参数） */
	raw: string;
	/** 纯净路径/URL（剥离 | 之后内容） */
	pure: string;
	/** 显示参数（| 后面的内容，如 500|center） */
	params: string;
	/** 类型：local / https / http / data（data: URI，内联图片非外部引用） */
	type: "local" | "https" | "http" | "data";
	/** 全库使用次数 */
	count: number;
	/** 使用位置（文件路径列表） */
	files: string[];
	/** 每个文件中的引用行号（1-based），key 为文件路径（由扫描器填充） */
	fileLines?: Map<string, number[]>;
	/** 首次出现的行号（1-based） */
	line?: number;
	/** 解析后的库内绝对路径（由 metadataCache 解析相对路径得到） */
	resolvedPath?: string;
	/** 本地文件是否在库中找到 */
	found?: boolean;
}

export interface PicLinkerSettings {
	// ========== 插件通用设置 ==========
	/** 列表中显示完整路径（默认开启） */
	showPath: boolean;

	// ========== 插件功能 ==========
	/** 显示本地图片区域 */
	showLocalImages: boolean;
	/** 显示云端图片区域 */
	showCloudImages: boolean;
	/** 显示本地未引用图片区域 */
	showLocalUnreferenced: boolean;
	/** 显示云端未引用图片区域 */
	showCloudUnreferenced: boolean;
	/** 显示未找到图片区域 */
	showNotFoundImages: boolean;
	/** 显示空白文件夹区域 */
	showEmptyFolders: boolean;
	/** 显示重复图片区域 */
	showDuplicates: boolean;
	/** 显示同名文件区域 */
	showSameNameFiles: boolean;

	// ========== WebDAV 同步 ==========
	/** WebDAV 服务器地址（如 https://example.com/webdav/） */
	webdavUrl: string;
	/** WebDAV 用户名 */
	webdavUsername: string;
	/** WebDAV 密码 */
	webdavPassword: string;
	/** 远程配置文件路径（如 /PicLinker/settings.json） */
	webdavRemotePath: string;
	/** WebDAV 自动同步：设置保存时自动同步到服务器 */
	webdavAutoSync: boolean;

	// ========== 图床配置 ==========
	githubToken: string;
	githubOwner: string;
	githubRepo: string;
	githubBranch: string;
	githubPath: string;
	aliyunEndpoint: string;
	aliyunBucket: string;
	aliyunAccessKeyId: string;
	aliyunAccessKeySecret: string;
	tencentSecretId: string;
	tencentSecretKey: string;
	tencentBucket: string;
	tencentRegion: string;
	smmsToken: string;
	otherBedName: string;
	otherBedUrl: string;
	otherBedUsername: string;
	otherBedPassword: string;
	otherBedPath: string;

	// 路径配置（可选，图床子目录）
	aliyunPath: string;
	tencentPath: string;

	// 索引签名（支持动态键访问）：收窄为 string | boolean，移除 ImageBedType。
	// 原签名允许 _bedTestResults(object) 混入持久化、且隐藏字段名 typo；
	// ImageBedType 不参与 settings 持久化，故移除。BED_SETTINGS_KEYS 动态访问
	// 已在调用处用 as 断言收敛类型。
	[key: string]: string | boolean;
}

/** 图床连接测试结果（持久化） */
export interface BedTestResults {
	[bedType: string]: boolean;
}

export enum ImageBedType {
	GitHub = "GitHub",
	Aliyun = "阿里云 OSS",
	Tencent = "腾讯云 COS",
	Other = "其他图床",
}

export interface CloudFile {
	name: string;
	url: string;
	/** 是否为目录 */
	isDirectory?: boolean;
	/** 完整 object key（含路径前缀） */
	prefix?: string;
	/** 来源图床类型 */
	bedType?: ImageBedType;
}

export interface CompareResult {
	exists: boolean;
	url?: string;
	bedType?: ImageBedType;
}

/** 去重组 */
export interface DedupGroup {
	hash: string;
	type: "local" | "cloud" | "cross";
	items: DedupItem[];
}

/** 去重项 */
export interface DedupItem {
	path: string;
	source: "local" | "cloud";
	bedType?: ImageBedType;
	/** 引用次数（0 表示未被引用） */
	referenced?: number;
	img?: ImageLink;
	file?: CloudFile;
}

/** 去重哈希缓存条目 */
export interface DedupHashEntry {
	hash: string;
	source: "local" | "cloud";
	path: string;
	bedType?: ImageBedType;
	mtime?: number;
	computedAt: number;
}

export interface ImageBed {
	/** 配置图床 */
	configure(settings: PicLinkerSettings): void;
	/** 获取文件列表 */
	listFiles(): Promise<CloudFile[]>;
	/** 删除文件 */
	delete(filename: string): Promise<{ success: boolean; error?: string }>;
	/** 创建目录 */
	createDirectory(dirName: string): Promise<{ success: boolean; error?: string }>;
	/** 测试连接 */
	testConnection?(): Promise<{ success: boolean; error?: string }>;
	/** 测试是否支持创建目录 */
	testCreateDirectoryCapability?(): Promise<{ supported: boolean; reason?: string }>;
	/** 获取可用 Bucket 列表（含 Endpoint） */
	listBuckets?(): Promise<Array<{ name: string; endpoint: string }>>;
	/** 列出所有目录（含空目录） */
	listEmptyDirs?(): Promise<string[]>;
}

/** 带 PicLinker 自定义属性的 DOM 元素 */
export interface LazyRenderableElement extends HTMLElement {
	/** 是否已渲染过 */
	_lazyRendered?: boolean;
	/** 懒渲染函数 */
	_lazyRenderFn?: () => void;
	/** 点击防抖标记 */
	_ignoreNextClick?: boolean;
}
