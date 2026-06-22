import { RepoReviewPanel } from "../../src/components/repo-review-panel";

export default function RepoReviewPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-signal-mint">Repository Review</p>
          <h1 className="text-4xl font-semibold text-white">Review a public GitHub repository.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Submit a public repo URL, choose an optional focus, and get a structured AI code review report without running repository code.
          </p>
        </header>

        <RepoReviewPanel />
      </div>
    </main>
  );
}
