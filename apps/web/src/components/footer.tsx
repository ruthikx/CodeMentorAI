import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#010101]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-8 px-6 py-16 md:grid-cols-6">
        <div className="col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <div className="h-3 w-3 rounded-full bg-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">CodeMentor AI</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-neutral-500">
            The live code review workspace that helps you ship cleaner code and understand the reasoning behind each fix.
          </p>
        </div>

        <div>
          <h4 className="mb-6 text-sm font-medium text-white">Platform</h4>
          <ul className="space-y-4 text-xs text-neutral-500">
            <li><Link className="transition-colors hover:text-white" href="/review/new">Review Code</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/repo-review">Repo Scan</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/history">History</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/dashboard">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-6 text-sm font-medium text-white">Resources</h4>
          <ul className="space-y-4 text-xs text-neutral-500">
            <li><Link className="transition-colors hover:text-white" href="/review/new">Code Review</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/github">Web Editor</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/history">Past Reviews</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/dashboard">Insights</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-6 text-sm font-medium text-white">Account</h4>
          <ul className="space-y-4 text-xs text-neutral-500">
            <li><Link className="transition-colors hover:text-white" href="/login">Login</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/signup">Sign up</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/repo-review">Repository Review</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/github">GitHub Tools</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-6 text-sm font-medium text-white">Explore</h4>
          <ul className="space-y-4 text-xs text-neutral-500">
            <li><Link className="transition-colors hover:text-white" href="/">Home</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/review/new">Start Review</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/dashboard">Progress</Link></li>
            <li><Link className="transition-colors hover:text-white" href="/history">Archive</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 border-t border-white/5 px-6 py-8 text-xs text-neutral-600 md:flex-row">
        <div>Built with love by Ruthik. Copyright 2026 CodeMentor AI. All rights reserved.</div>
        <div className="flex gap-6">
          <Link className="transition-colors hover:text-white" href="/github">GitHub</Link>
          <Link className="transition-colors hover:text-white" href="/history">History</Link>
          <Link className="transition-colors hover:text-white" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
