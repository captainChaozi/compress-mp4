# Offline MP4 Compressor

[中文文档](./README_zh-CN.md)

A pure client-side MP4 video compressor built with modern web technologies. This application allows users to compress video files directly in their browser without uploading them to any server, ensuring maximum privacy and security.

## ✨ Key Features

- **🔒 100% Secure & Offline**: Files are processed locally on your device using WebAssembly. No data is ever uploaded to a server.
- **⚡ Fast & Efficient**: Powered by FFmpeg.wasm for robust video processing capabilities in the browser.
- **🎛️ Customizable Control**: Easily adjust compression ratios (e.g., 80%, 60%, 40%) to balance file size and quality.
- **👀 Preview Function**: Compare the compressed video with the original before exporting.
- **📱 Responsive Design**: A modern, industrial-utilitarian interface that works seamlessly across devices.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Core Engine**: [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ established
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/captainChaozi/compress-mp4.git
   cd compressmp4
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run the development server**

   ```bash
   pnpm dev
   ```

4. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note on SharedArrayBuffer**:
> This project demands `SharedArrayBuffer` support for FFmpeg.wasm multi-threading. The dev server includes headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) to enable this. Ensure your deployment environment also supports these headers.

## 📖 Usage Guide

1. **Select a Video**: Click "Select Video File" to choose an MP4 from your device.
2. **Choose Compression Ratio**: Use the slider or preset buttons to set your desired target file size (e.g., 60% of original).
3. **Compress**: Click "Start Compression" to begin. You can see the progress and time elapsed.
4. **Preview & Export**: Once finished, review the stats and preview the result. If satisfied, click "Export MP4" to save the file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
