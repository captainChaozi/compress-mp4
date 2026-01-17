"use client";

import { ArrowUp } from "lucide-react";

export default function CTA() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="w-full py-16 px-4 flex justify-center">
      <div className="max-w-5xl w-full bg-zinc-900 dark:bg-zinc-100 rounded-[4px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] dark:bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-white dark:text-black mb-2">
            Ready to Compress MP4?
          </h2>
          <p className="text-zinc-400 dark:text-zinc-600 max-w-md text-lg">
            Start compressing your MP4 videos locally, securely, and offline.
          </p>
        </div>

        <button
          onClick={scrollToTop}
          className="relative z-10 group flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-[4px] transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95"
        >
          <span>Compress MP4 Now</span>
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>
    </section>
  );
}
