export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(58,141,255,0.18),_transparent_30%),linear-gradient(180deg,_#09111f_0%,_#101c30_55%,_#14253d_100%)]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-20 lg:px-10">
        <div className="max-w-3xl space-y-6">
          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.32em] text-signal.mint">
            Code Review That Teaches
          </p>
          <h1 className="text-5xl font-semibold leading-tight text-white sm:text-6xl">
            Stream AI code reviews, apply fixes with diffs, and chat through the why.
          </h1>
          <p className="text-lg leading-8 text-slate-300">
            CodeMentor AI pairs a Monaco editor, streaming issue cards, and grounded follow-up chat so developers learn while they ship.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <a className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-card transition hover:-translate-y-1 hover:bg-white/10" href="/review/new">
            <h2 className="text-xl font-medium text-white">Start A Review</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">Paste code, detect the language, and stream your first issue in seconds.</p>
          </a>
          <a className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-card transition hover:-translate-y-1 hover:bg-white/10" href="/history">
            <h2 className="text-xl font-medium text-white">Review History</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">Filter past submissions and jump back into older reviews from one list.</p>
          </a>
          <a className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-card transition hover:-translate-y-1 hover:bg-white/10" href="/review/new">
            <h2 className="text-xl font-medium text-white">GitHub + Web Editor</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">Use the in-browser editor today and connect your PR review flow next.</p>
          </a>
        </div>
      </section>
    </main>
  );
}
