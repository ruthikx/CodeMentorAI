"use client";

import { signIn } from "next-auth/react";
import { ArrowRight, Github, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { resolveAppRedirectUrl } from "../lib/redirect";

export function SignupForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not create your account.");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false
    });

    setIsSubmitting(false);

    if (result?.error) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    window.location.assign(resolveAppRedirectUrl(result?.url, callbackUrl, window.location.origin));
  }

  return (
    <section className="mx-auto w-full max-w-[460px] overflow-hidden rounded-3xl border border-white/10 bg-[#080809] shadow-2xl">
      <div className="border-b border-white/10 bg-[#0d0d0f] px-6 py-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          <Sparkles className="h-4 w-4 text-blue-400" />
          New workspace
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Create your CodeMentor account</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-400">Save reviews, GitHub workflows, and learning progress.</p>
      </div>

      <form className="space-y-5 p-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-neutral-200">Name</span>
          <div className="relative mt-2">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              className="h-12 w-full rounded-xl border border-white/10 bg-black pl-11 pr-4 text-white outline-none transition placeholder:text-neutral-700 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
        </label>

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
              autoComplete="new-password"
              minLength={8}
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
          {isSubmitting ? "Creating account..." : "Create account"}
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
          Already have an account?{" "}
          <Link className="font-medium text-white transition hover:text-blue-300" href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            Sign in
          </Link>
        </p>
      </form>
    </section>
  );
}
