import { RepoReviewPanel } from "../../src/components/repo-review-panel";

export default function RepoReviewPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-blue-500/30">
      <section className="relative border-t border-white/5 bg-gradient-to-b from-[#050505] to-[#08080a] py-10 lg:py-18">
        <div className="pointer-events-none absolute left-1/4 top-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_45%_at_50%_0%,#000_65%,transparent_100%)]" />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6">
          <header className="mb-16 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-3 py-1.5 text-sm font-medium text-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.03)] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Repository Review
            </div>
            <h1 className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-4xl font-bold leading-tight tracking-normal text-transparent md:text-6xl">
              Review complete projects with CodeMentor AI.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-relaxed">
              Submit a public repo URL or upload a zip, choose an optional focus, and get a structured AI code review report without running repository code.
            </p>
          </header>

          <RepoReviewPanel />
        </div>
      </section>
    </main>
  );
}
