"use client";

import { signIn } from "next-auth/react";
import { ArrowRight, Github, LockKeyhole, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { resolveAppRedirectUrl } from "../lib/redirect";

export function LoginForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("The email or password you entered is incorrect.");
      return;
    }

    window.location.assign(resolveAppRedirectUrl(result?.url, callbackUrl, window.location.origin));
  }

  return (
    <section className="mx-auto w-full max-w-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[#080809] shadow-2xl">
      <div className="border-b border-white/10 bg-[#0d0d0f] px-6 py-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          <Sparkles className="h-4 w-4 text-blue-400" />
          Account access
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Sign in to CodeMentor AI</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-400">Open your saved reviews and learning workspace.</p>
      </div>

      <form className="space-y-5 p-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-neutral-200">Email</span>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-black pl-11 pr-4 text-white outline-none transition placeholder:text-neutral-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-200">Password</span>
          <div className="relative mt-2">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-black pl-11 pr-4 text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </label>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.12)] transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
          {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-600">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
        >
          <Github className="h-4 w-4" />
          Continue with GitHub
        </button>

        <p className="text-center text-sm text-neutral-400">
          New here?{" "}
          <Link className="font-medium text-white transition hover:text-blue-300" href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
}
