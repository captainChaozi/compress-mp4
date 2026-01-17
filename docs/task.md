# 任务列表 — Offline MP4 Compressor

> **当前阶段**：技术验证（离线压缩关键环节）

---

## 1) 基础设施 / 架构骨架

- [x] **ISSUE-001** 初始化 Next.js 项目并配置 TailwindCSS 构建骨架

---

## 2) FFmpeg 环境初始化

- [x] **ISSUE-002** 配置 FFmpeg.wasm 运行环境
  - [x] 引入 `@ffmpeg/ffmpeg` + `@ffmpeg/util` 依赖并配置 WASM 加载
  - [x] 配置 Next.js 支持 SharedArrayBuffer（COOP/COEP Headers）以启用多线程模式
  - [x] 封装 FFmpeg 加载与初始化 Hook（含加载状态/错误处理）

---

## 3) 技术验证 POC — 离线压缩关键环节

> 最小闭环验证，暂不涉及完整 UI 状态机

- [x] **ISSUE-003** 完成一次端到端压缩 POC
  - [x] 选择本地视频文件并读取其元信息
  - [x] 将视频写入 FFmpeg 虚拟文件系统
  - [x] 执行压缩命令并监听进度
  - [x] 导出压缩后的视频为 Blob URL
  - [x] 验证 CRF / 目标码率参数控制输出质量

---

## 4) 可验收的功能切片

> 待技术验证通过后启动

- [x] **[ISSUE-004](docs/issue/ISSUE-004.md)** 完整压缩功能（UI + 状态机 + 错误处理）
  - [ ] 用户可选择本地视频文件，展示输入信息
  - [ ] 用户可通过滑杆/预设按钮调整压缩比率
  - [ ] 用户可点击"开始压缩"并查看进度与已用时间
  - [ ] 用户可取消正在进行的压缩
  - [ ] 用户可在完成后查看输出信息与对比预览
  - [ ] 用户可修改导出文件名并导出 MP4
  - [ ] 用户可在压缩失败时看到可理解的错误提示并重试

---

## 备注

**技术方案选型**：`@ffmpeg/ffmpeg` (ffmpeg.wasm)

- 纯 WebAssembly + JavaScript 实现
- 支持浏览器离线运行，无需服务端
- 需启用 `SharedArrayBuffer` 以使用多线程模式（需配置响应头 COOP/COEP）
- 依赖包：`@ffmpeg/ffmpeg`、`@ffmpeg/util`、`@ffmpeg/core-mt`
