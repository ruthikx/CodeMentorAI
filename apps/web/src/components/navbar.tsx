"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { href: "/review/new", label: "Review" },
  { href: "/repo-review", label: "Repo Review" },
  { href: "/history", label: "History" },
  { href: "/dashboard", label: "Dashboard" }
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSignedIn = status === "authenticated";
  const authCallbackUrl = pathname && pathname !== "/" ? `?callbackUrl=${encodeURIComponent(pathname)}` : "";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? "border-b border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.75)] shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[12px]"
          : "border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,10,0.65)] backdrop-blur-[10px]"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6">
        <Link className="group flex flex-shrink-0 items-center gap-3" href="/">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            CodeMentor AI
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={`group relative text-sm font-medium transition-all duration-300 ${
                  isActive ? "text-white" : "text-[rgba(255,255,255,0.7)] hover:text-white"
                }`}
                href={item.href}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-[2px] rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {status === "loading" ? (
            <div className="h-10 w-28 rounded-[12px] bg-white/10" aria-label="Loading session" />
          ) : isSignedIn ? (
            <>
              <span className="hidden max-w-44 truncate text-sm text-[rgba(255,255,255,0.75)] lg:inline">
                {session.user?.name ?? session.user?.email ?? "Signed in"}
              </span>
              <button
                className="inline-flex h-10 items-center justify-center rounded-[12px] border border-white/10 px-4 text-sm font-medium text-white transition-all duration-300 hover:bg-white/[0.04]"
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="rounded-lg px-3 py-2 text-sm font-medium text-[rgba(255,255,255,0.7)] transition-colors duration-300 hover:bg-white/[0.04] hover:text-white"
                href={`/login${authCallbackUrl}`}
              >
                Login
              </Link>
              <Link
                className="relative inline-flex h-10 items-center justify-center rounded-[12px] bg-gradient-to-r from-blue-600 to-purple-600/85 px-5 text-sm font-medium text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all duration-300 hover:scale-[1.03] hover:from-blue-500 hover:to-purple-500/95 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                href={`/signup${authCallbackUrl}`}
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Toggle navigation menu"
          className="text-[rgba(255,255,255,0.7)] transition-colors duration-300 hover:text-white focus:outline-none md:hidden"
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.95)] shadow-2xl backdrop-blur-[16px] md:hidden"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-5 px-6 py-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="text-base font-medium text-[rgba(255,255,255,0.7)] transition-colors duration-300 hover:text-white"
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {status === "loading" ? (
                <div className="mt-2 h-11 w-full rounded-[12px] bg-white/10" aria-label="Loading session" />
              ) : isSignedIn ? (
                <div className="mt-2 flex flex-col gap-3 border-t border-[rgba(255,255,255,0.06)] pt-5">
                  <span className="text-sm text-[rgba(255,255,255,0.75)]">
                    {session.user?.name ?? session.user?.email ?? "Signed in"}
                  </span>
                  <button
                    className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-white/10 text-sm font-medium text-white transition-all duration-300 hover:bg-white/[0.04]"
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      void signOut({ callbackUrl: "/" });
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-3 border-t border-[rgba(255,255,255,0.06)] pt-5">
                  <Link
                    className="inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-white/10 text-sm font-medium text-white transition-all duration-300 hover:bg-white/[0.04]"
                    href={`/login${authCallbackUrl}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    className="inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-gradient-to-r from-blue-600 to-purple-600/80 px-6 text-sm font-medium text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]"
                    href={`/signup${authCallbackUrl}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
