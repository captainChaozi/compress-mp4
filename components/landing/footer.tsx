import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 mt-24 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Compress MP4"
                width={24}
                height={24}
                className="rounded-[1px]"
              />
              <span className="font-mono text-sm font-bold uppercase text-zinc-900 dark:text-zinc-100">
                System Status: Online
              </span>
            </div>
            <p className="text-base text-zinc-500 max-w-sm font-sans">
              Compress MP4 videos with professional-grade compression, running
              entirely in your browser. No data leaves your device.
            </p>
          </div>
          <div className="flex flex-col md:items-end justify-between gap-4">
            <div className="flex gap-6">
              <span className="text-sm font-mono text-zinc-400 uppercase">
                Privacy First
              </span>
              <span className="text-sm font-mono text-zinc-400 uppercase">
                Zero Upload
              </span>
              <span className="text-sm font-mono text-zinc-400 uppercase">
                Local Processing
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-mono text-zinc-400">
                © {currentYear} Compress MP4 - Offline Video Compressor. v1.0.0
              </p>
              <a
                href="https://github.com/captainChaozi/compress-mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-zinc-500 hover:text-orange-600 transition-colors"
              >
                Open Source: github.com/captainChaozi/compress-mp4
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
