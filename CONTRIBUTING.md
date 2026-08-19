# 贡献指南

> 🧭 **文档导航：** [中文说明](README.zh.md) · [English](README.md) · [配置指南](CONFIG.md) · [开发指南](DEVELOPMENT.md) · [变更日志](CHANGELOG.md) · [安全](SECURITY.md) · **贡献**

感谢你有兴趣为 PicLinker 做贡献！🎉

## 环境准备

开发环境的搭建请参阅 [DEVELOPMENT.md](DEVELOPMENT.md)。简单来说：

```bash
npm install      # 安装依赖
npm run dev      # 开发模式（监听文件变化自动重编译）
npm run build    # 生产构建
```

## 提 Issue

在提交 issue 前，请先搜索是否已有相同的问题。

- **Bug 报告**：请包含 Obsidian 版本、PicLinker 版本、复现步骤、预期行为与实际行为
- **功能请求**：请描述使用场景和期望的交互，而不仅仅是「加个 XX 功能」

## 提交 PR

1. Fork 本仓库并创建分支
2. 开发并自测（`npm run build` 确认可编译通过）
3. 提交代码，提交说明请遵循以下约定
4. 推送并创建 Pull Request

## 提交说明约定

提交说明采用「新增 / 修复 / 优化」三段式，每条从用户视角描述，不出现实现细节：

```
PicLinker 1.3.5

新增
（每条一行：用户得到什么新能力）

修复
（每条用「问题 → 导致后果」因果句式）

优化
（每条一行：体验/工程改进点）
```

示例可参考 [CHANGELOG.md](CHANGELOG.md) 的历史条目。

## 代码风格

- TypeScript，遵循项目已有的 eslint 配置
- 界面文案使用中文
- 尽量消除 `as any`，保持类型安全

## 许可证

贡献即表示你同意你的代码以本项目的 [MIT 许可证](LICENSE) 发布。
