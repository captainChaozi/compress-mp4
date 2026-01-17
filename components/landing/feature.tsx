import { ShieldCheck, Sliders, WifiOff, Zap } from "lucide-react";

export default function Feature() {
  const features = [
    {
      icon: <WifiOff className="w-5 h-5" />,
      title: "100% Offline Compression",
      description:
        "Compress MP4 videos entirely in your browser using WebAssembly. No data ever leaves your device or uploads to any server.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Privacy-First Design",
      description:
        "Your MP4 files stay on your device. Compress MP4 securely, suitable for sensitive or confidential video content.",
    },
    {
      icon: <Sliders className="w-5 h-5" />,
      title: "Precise Compression Control",
      description:
        "Fine-tune your MP4 compression ratio to balance file size and quality. What you see is what you get.",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Fast & Efficient",
      description:
        "Compress MP4 files quickly using multi-core processing power, all within your browser.",
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto py-16 px-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-5 w-1 bg-orange-600" />
        <h2 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          Why Compress MP4 With Our Tool?
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-[4px] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <span className="font-mono text-[10px] text-zinc-400 uppercase">
                F-{idx + 1}
              </span>
            </div>
            <div className="text-orange-600 mb-4 bg-orange-100 dark:bg-orange-900/20 w-fit p-3 rounded-[4px]">
              {feature.icon}
            </div>
            <h3 className="font-bold text-xl mb-3 text-zinc-900 dark:text-zinc-100">
              {feature.title}
            </h3>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
