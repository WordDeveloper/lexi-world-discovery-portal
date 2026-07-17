"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Save, Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();

  function start() {
    const token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    router.push(`/q/${token}`);
  }

  return (
    <main className="relative overflow-hidden">
      <div className="container flex min-h-screen flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-4 py-1.5 text-sm text-brand-700 shadow-soft">
          <Sparkles className="h-4 w-4" />
          StoryLight Studios · Discovery Portal
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Let&apos;s shape <span className="text-brand-600">Lexi World</span> together.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          A calm, guided space to capture every important detail of your game, at your own pace, saved as you go.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={start}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 font-medium text-white shadow-lift transition hover:bg-brand-600 focus-ring"
          >
            Start the questionnaire <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-sm text-muted">Takes about 30 minutes. You can pause and come back any time.</p>
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <Feature icon={<Save className="h-5 w-5" />} title="Saved automatically" body="Answer at your pace and come back any time. Nothing is lost." />
          <Feature icon={<Sparkles className="h-5 w-5" />} title="A helpful assistant" body="Stuck on a question? Get an explanation, an example, or reference games." />
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Private & secure" body="Your responses are protected and go only to your project team." />
        </div>
      </div>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-soft">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
