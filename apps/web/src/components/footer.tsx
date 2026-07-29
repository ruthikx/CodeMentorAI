import Image from "next/image";
import Link from "next/link";
import logoImage from "../../public/logo.png";

const footerSections = [
  {
    title: "Platform",
    links: [
      { href: "/review/new", label: "Review Code" },
      { href: "/repo-review", label: "Repo Review" },
      { href: "/github", label: "GitHub" },
      { href: "/history", label: "History" }
    ]
  },
  {
    title: "Workspace",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/review/new", label: "Web Editor" },
      { href: "/repo-review", label: "Project Scan" },
      { href: "/history", label: "Past Reviews" }
    ]
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Login" },
      { href: "/signup", label: "Sign up" },
      { href: "/", label: "Home" },
      { href: "https://github.com/ruthikx/CodeMentorAI", label: "Source" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#010101] text-white">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-14 md:grid-cols-[minmax(0,1.5fr)_2fr]">
        <div>
          <Link className="group inline-flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10 transition group-hover:bg-white/[0.08] group-hover:ring-white/20">
              <Image
                src={logoImage}
                alt="CodeMentor AI"
                width={36}
                height={36}
                unoptimized
                className="h-9 w-9 object-contain"
              />
            </div>
            <span className="text-lg font-semibold tracking-tight">CodeMentor AI</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-500">
            A live code review workspace for finding issues, applying fixes, and learning the reasoning behind each change.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">{section.title}</h2>
              <ul className="mt-5 space-y-3 text-sm text-neutral-500">
                {section.links.map((link) => (
                  <li key={`${section.title}:${link.href}`}>
                    <Link className="transition-colors hover:text-white" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 py-6 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Built by Ruthik. Copyright 2026 CodeMentor AI.</p>
          <Link className="transition-colors hover:text-white" href="https://github.com/ruthikx/CodeMentorAI">
            View on GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
