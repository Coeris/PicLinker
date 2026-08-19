# Security Policy

> 🧭 **文档导航：** [中文说明](README.zh.md) · [English](README.md) · [配置指南](CONFIG.md) · [开发指南](DEVELOPMENT.md) · [变更日志](CHANGELOG.md) · **安全** · [贡献](CONTRIBUTING.md)

## 支持的版本

我们仅为最新版本提供安全更新。

| 版本 | 支持状态 |
|------|----------|
| 1.3.x | ✅ 支持 |
| < 1.3.0 | ❌ 不再支持 |

## 报告漏洞

PicLinker 涉及图床凭据的加密存储与传输，安全是我们的优先事项。

**如果你发现了安全漏洞，请不要公开披露。** 请通过以下渠道私下报告：

- 在 GitHub 仓库创建一个 [Security Advisory](https://github.com/Coeris/PicLinker/security/advisories/new)（推荐）
- 或发送邮件至 `Coerisd@gmail.com`

请在你的报告中包含：

1. 漏洞的详细描述
2. 复现步骤
3. 受影响版本
4. 影响范围评估

## 我们承诺

- 在收到报告的 **7 天内** 确认收到
- 在确认后 **30 天内** 提供修复
- 修复发布后，经报告者同意，在 CHANGELOG 中致谢

## 安全设计说明

- **凭据加密**：图床凭据使用 AES-GCM + PBKDF2（600k 迭代）本地加密存储，密钥不落盘
- **传输安全**：桌面端走 Node.js 请求层、移动端回退 `requestUrl`，均不受浏览器 CORS 限制
- **WebDAV 警告**：同步到 WebDAV 的内容为解密后的明文，请仅在可信服务端与网络下使用

## 致谢

我们感谢所有负责任披露漏洞的安全研究人员。
