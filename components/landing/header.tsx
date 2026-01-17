import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full max-w-5xl mx-auto py-6 px-4 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <Image
          src="/logo.png"
          alt="Compress MP4 Logo"
          width={48}
          height={48}
          className="rounded-[2px]"
        />
        <span className="font-mono text-base tracking-tighter font-bold uppercase text-zinc-900 dark:text-zinc-100">
          Compress MP4
        </span>
      </Link>
      <nav>
        <Link
          href="https://github.com/captainChaozi/compress-mp4"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-zinc-500 hover:text-orange-600 transition-colors uppercase tracking-wide"
        >
          [View Source]
        </Link>
      </nav>
    </header>
  );
}
