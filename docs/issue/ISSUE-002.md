# ISSUE-002: 引入 `@ffmpeg/ffmpeg` + `@ffmpeg/util` 依赖并配置 WASM 加载

## 背景 / 问题

根据 [PRD](file:///Users/chao/mvp/compressmp4/docs/prd.md)，产品需要**全程离线**完成 MP4 压缩，不依赖网络服务。技术方案选型为 `@ffmpeg/ffmpeg` (ffmpeg.wasm)，这是一个纯 WebAssembly + JavaScript 实现，支持浏览器离线运行。

当前项目已完成 Next.js 初始化（ISSUE-001），需要引入 FFmpeg 核心依赖以支持后续的压缩功能开发。

---

## 目标（Goals）

1. 安装 `@ffmpeg/ffmpeg` 和 `@ffmpeg/util` 依赖包
2. 确保依赖版本兼容当前 Next.js 项目
3. 为后续 ISSUE-003/004 的 WASM 加载与初始化奠定基础

---

## 非目标（Non-goals）

- **不**在本任务中引入 `@ffmpeg/core-mt`（多线程核心依赖将在 ISSUE-003 配置 SharedArrayBuffer 时一并处理）
- **不**在本任务中实现完整的 FFmpeg 加载/初始化 Hook（ISSUE-004 职责）
- **不**在本任务中配置 COOP/COEP 响应头（ISSUE-003 职责）
- **不**创建任何 UI 组件

---

## 范围（Scope）

### 包含

- 使用 pnpm 安装 `@ffmpeg/ffmpeg@^0.12.x` 和 `@ffmpeg/util@^0.12.x`
- 验证依赖安装成功且无冲突
- 确认 TypeScript 类型定义可用

### 不包含

- WASM 运行时加载测试
- 封装 React Hook 或工具函数
- 配置静态资源托管（CDN 加载策略，初期无需本地托管）

---

## 功能需求（Functional Requirements）

| #    | 需求描述                                                         | 验证方式                         |
| ---- | ---------------------------------------------------------------- | -------------------------------- |
| FR-1 | 项目 `package.json` 中包含 `@ffmpeg/ffmpeg` 依赖，版本 `^0.12.x` | 查看 `package.json`              |
| FR-2 | 项目 `package.json` 中包含 `@ffmpeg/util` 依赖，版本 `^0.12.x`   | 查看 `package.json`              |
| FR-3 | `pnpm install` 执行成功，无 peer dependency 警告或错误           | 执行命令验证                     |
| FR-4 | TypeScript 可正确导入 `@ffmpeg/ffmpeg` 和 `@ffmpeg/util` 的类型  | IDE 无报错 / `tsc --noEmit` 通过 |

---

## 边界与错误处理（Edge cases & errors）

| 场景                | 处理方式                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| 依赖版本冲突        | 检查 pnpm 输出，必要时锁定具体版本号                                   |
| TypeScript 类型缺失 | 确认使用正确的包版本（0.12.x 自带类型定义）                            |
| Next.js 构建报错    | 检查是否需要在 `next.config.ts` 中配置 webpack externals（通常不需要） |

---

## 验收标准（Acceptance Criteria）

- [ ] `package.json` 的 `dependencies` 中包含 `@ffmpeg/ffmpeg` 和 `@ffmpeg/util`
- [ ] `pnpm install` 无报错完成
- [ ] `pnpm run build` 或 `pnpm run dev` 不因新依赖产生错误
- [ ] 在任意 `.ts`/`.tsx` 文件中可正常 `import { FFmpeg } from '@ffmpeg/ffmpeg'` 且 IDE 无类型报错

---

## 补充说明

- **WASM 加载策略**：初期验证阶段使用 CDN 加载（默认 unpkg/esm.sh），正式部署前再考虑本地托管到 `/public` 目录
- **多线程支持**：`@ffmpeg/core-mt` 将在 ISSUE-003 中随 SharedArrayBuffer 配置一并引入
- **版本参考文档**：[ffmpeg.wasm 官方文档](https://github.com/ffmpegwasm/ffmpeg.wasm)

---

## 决策日志（Decision Log）

| 决策项        | 最终结论            | 理由                                                       |
| ------------- | ------------------- | ---------------------------------------------------------- |
| 依赖版本      | `^0.12.x`（稳定版） | MVP 阶段优先稳定性，文档完善、社区案例多                   |
| core-mt 归属  | 不包含在本任务      | 与 SharedArrayBuffer 配置强相关，放在 ISSUE-003/004 更合理 |
| WASM 加载方式 | CDN 加载（初期）    | 快速验证，无需本地托管配置                                 |
| 验证边界      | 仅安装配置          | 加载验证逻辑属于 ISSUE-004 职责                            |
