# Offline MP4 Compressor (离线 MP4 压缩器)

[English Documentation](./README.md)

这是一个基于现代 Web 技术构建的纯前端 MP4 视频压缩工具。该应用允许用户直接在浏览器中压缩视频文件，无需上传到任何服务器，确保了最大的隐私和安全性。

## ✨ 核心特性

- **🔒 100% 安全离线**: 所有文件均通过 WebAssembly 在本地设备上处理。数据永远不会上传到云端。
- **⚡ 快速高效**: 由 FFmpeg.wasm 驱动，在浏览器中提供强大的视频处理能力。
- **🎛️ 灵活控制**: 轻松调节压缩比率（如 80%、60%、40%），平衡文件大小与画质。
- **👀 实时预览**: 在导出之前，可以直观地对比压缩前后的视频效果。
- **📱 响应式设计**: 采用现代工业实用主义风格设计，完美适配各种设备。

## 🚀 技术栈

- **框架**: [Next.js](https://nextjs.org/) (React)
- **核心引擎**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **语言**: TypeScript

## 🛠️ 快速开始

### 前置要求

- Node.js 18+
- pnpm (推荐) 或 npm/yarn

### 安装步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/captainChaozi/compress-mp4.git
   cd compressmp4
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **启动开发服务器**

   ```bash
   pnpm dev
   ```

4. **访问应用**
   在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

> **关于 SharedArrayBuffer 的说明**:
> 本项目需要 `SharedArrayBuffer` 支持以启用 FFmpeg.wasm 多线程模式。开发服务器已配置必要的响应头 (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`)。部署时请确保您的托管环境也支持这些头部配置。

## 📖 使用指南

1. **选择视频**: 点击“选择视频文件”按钮，从本地选择一个 MP4 文件。
2. **设置压缩率**: 使用滑块或预设按钮设定目标文件大小（例如原大小的 60%）。
3. **开始压缩**: 点击“开始压缩”按钮。通过进度条和耗时显示了解处理进度。
4. **预览与导出**: 处理完成后，查看压缩数据并预览结果。确认无误后点击“导出 MP4”保存文件。

## 🤝 贡献指南

欢迎提交 Pull Request 来改进这个项目！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。
