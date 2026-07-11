# PicLinker 配置指南

> 🧭 **文档导航：** [中文说明](README.zh.md) · [English](README.md) · **配置指南** · [开发指南](DEVELOPMENT.md)

> 插件运行不需要配置图床，扫库功能直接可用。上传和管理云端文件才需要配置。

打开设置：Obsidian 设置 → 第三方插件 → PicLinker → 点击齿轮图标 ⚙️

---

## 通用设置

| 设置 | 说明 |
|------|------|
| 显示路径 | 开启显示完整路径，关闭只显示文件名（默认开启） |

### 功能开关

控制各区域的显示与隐藏：本地图片 / 云端图片 / 本地未引用 / 云端未引用 /
未找到图片 / 同名文件 / 重复图片 / 空白文件夹。

---

## 🔵 GitHub 图床（推荐新手）

**必填项标 `*`**

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Token `*` | Personal Access Token（需 repo 权限） | `ghp_xxxx` |
| Owner `*` | GitHub 用户名 | `username` |
| Repo `*` | 图片仓库名（需为 Public） | `image-repo` |
| Branch | 分支名 | `main` |
| Path | 子目录路径 | `images` |

### 获取 Token

1. 打开 https://github.com/settings/tokens
2. Generate new token (classic) → 勾选 `repo` 权限 → 生成并复制

### 创建仓库

1. 打开 https://github.com/new 创建公开仓库（Public）
2. 填写上方配置

---

## 🟢 阿里云 OSS

**必填项标 `*`**

| 配置项 | 说明 | 示例 |
|--------|------|------|
| AccessKey ID `*` | RAM 子账号 AccessKey | `LTAI...` |
| AccessKey Secret `*` | AccessKey 密钥 | |
| Bucket | 存储桶名称（自动获取） | `my-bucket` |
| 新建文件夹 | 在 Bucket 中创建目录 | `images/blog` |
| Endpoint | 外网访问 Endpoint（自动填入） | `https://oss-cn-hangzhou.aliyuncs.com` |

### 自动获取 Bucket

1. 填写 AccessKey ID 和 Secret
2. 系统自动获取 Bucket 列表供选择
3. 选择 Bucket 后自动填入对应的 Endpoint

### 手动配置

如果自动获取失败，可手动填写 Bucket 和 Endpoint。

### 创建 Bucket

1. 打开 https://oss.console.aliyun.com → 创建 Bucket
2. 读写权限设为「公共读」（图片需要公开访问）

### 获取密钥

1. 打开 https://ram.console.aliyun.com → AccessKey 管理
2. 创建 AccessKey（建议使用 RAM 子账号，仅授予 OSS 权限）

### 配置跨域

1. Bucket → 数据安全 → 跨域设置 → 创建规则
2. 来源：`app://obsidian.md`
3. 方法：GET, PUT, DELETE
4. 允许 Header：*

---

## 🟡 腾讯云 COS

**必填项标 `*`**

| 配置项 | 说明 | 示例 |
|--------|------|------|
| SecretId `*` | API 密钥 | `AKID...` |
| SecretKey `*` | 密钥密码 | |
| Bucket | 存储桶名-APPID（自动获取） | `my-images-1250000000` |
| 新建文件夹 | 在 Bucket 中创建目录 | `images/blog` |
| Region | 地域简称（自动填入） | `ap-guangzhou` |

### 自动获取 Bucket

1. 填写 SecretId 和 SecretKey
2. 系统自动获取 Bucket 列表供选择
3. 选择 Bucket 后自动填入对应的 Region

### 创建存储桶

1. 打开 https://console.cloud.tencent.com/cos → 创建存储桶
2. 访问权限设为「公有读私有写」
3. Bucket 格式：名称-APPID（如 `my-images-1250000000`）

### 获取密钥

1. 打开 https://console.cloud.tencent.com/cam → API 密钥管理
2. 新建密钥（建议使用 CAM 子用户，仅授予 COS 权限）

### 配置跨域

1. 存储桶 → 基础配置 → 跨域访问 CORS → 添加规则
2. 来源：`app://obsidian.md`
3. 方法：GET, PUT, DELETE
4. 允许 Header：*

---

## 🔴 其他图床（SM.MS / 自建图床）

**必填项标 `*`**

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Name | 自定义名称 | `SM.MS` |
| API URL `*` | 图床上传接口地址 | `https://sm.ms/api/v2` |
| Token | 认证密钥 | `your-token` |
| Username | 部分图床需要 | `admin` |
| Password | 部分图床需要 | |
| Path | 图片存储子目录 | `images` |

### 支持的类型

- **SM.MS**：免费图床，只需 Token
- **兰空图床 Lsky Pro**：自建图床，需要 API URL + Token
- **EasyImage**：简单图床，需要 API URL + Token
- **Chevereto**：商业图床，需要 API URL + Token

### SM.MS Token 获取

1. 打开 https://sm.ms → 注册并登录
2. Dashboard → API Token → 复制 Token

---

## 🔄 WebDAV 同步

多设备间同步图床配置，无需重复填写。

### 配置步骤

1. 准备 WebDAV 服务（坚果云、NextCloud 等）
2. 填写服务器地址（仅支持 HTTPS）、用户名、密码
3. 开启「启用 WebDAV 同步」和「自动同步」
4. 点击「手动同步」测试连接

### 冲突检测

- 通过时间戳判断本地和远程配置的版本
- 双方都有修改时提示冲突，由用户决定覆盖方向

### 工作原理

上传前解密为明文（AES-GCM），其他设备下载后用本地密钥重新加密。
每设备独立密钥，兼容不同 vault 名称。
