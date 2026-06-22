"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/review/new", label: "Review" },
  { href: "/repo-review", label: "Repo Review" },
  { href: "/history", label: "History" },
  { href: "/dashboard", label: "Dashboard" }
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const authCallbackUrl = pathname && pathname !== "/" ? `?callbackUrl=${encodeURIComponent(pathname)}` : "";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09111f]/95 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-10">
        <Link className="text-lg font-semibold tracking-tight text-white" href="/">
          CodeMentor AI
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-5">
          <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 sm:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {status === "loading" ? (
            <div className="h-9 w-28 rounded-md bg-white/10" aria-label="Loading session" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-44 truncate text-sm text-slate-300 md:inline">
                {session.user?.name ?? session.user?.email ?? "Signed in"}
              </span>
              <button
                className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                href={`/login${authCallbackUrl}`}
              >
                Login
              </Link>
              <Link
                className="rounded-md bg-signal.blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                href={`/signup${authCallbackUrl}`}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
