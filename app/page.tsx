import CTA from "@/components/landing/cta";
import FAQ from "@/components/landing/faq";
import Feature from "@/components/landing/feature";
import Footer from "@/components/landing/footer";
import Header from "@/components/landing/header";
import VideoCompressor from "@/components/video-compressor";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px]">
      <Header />
      <main className="flex flex-col items-center">
        <section
          id="compressor"
          className="w-full py-12 px-4 flex flex-col items-center justify-center gap-6"
        >
          <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans relative overflow-x-hidden selection:bg-orange-500/30">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

            <div className="w-full max-w-5xl mx-auto space-y-12 py-12 px-4 relative z-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
              {/* Header */}
              <header className="flex flex-col items-center justify-center space-y-3 mb-8">
                <div className="max-w-xl text-center space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Compress MP4 Files Instantly
                  </h1>
                  <p className="text-lg text-zinc-600 dark:text-zinc-300">
                    Free online tool to <strong>compress MP4</strong> videos
                    directly in your browser. Reduce file size without uploading
                    — 100% <em>offline</em> & private.
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No signup required. Works offline after page loads.
                  </p>
                </div>
              </header>
              <VideoCompressor />
            </div>
          </div>
        </section>
        <Feature />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
