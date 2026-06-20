"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-card">
      <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">Signup</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">Create your CodeMentor account</h1>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Name</span>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-ink px-4 py-3 text-white outline-none transition focus:border-signal.blue"
            name="name"
            type="text"
            autoComplete="name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Email</span>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-ink px-4 py-3 text-white outline-none transition focus:border-signal.blue"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Password</span>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-ink px-4 py-3 text-white outline-none transition focus:border-signal.blue"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {error ? (
          <p className="rounded-md border border-signal.red/40 bg-signal.red/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-signal.blue px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        className="w-full rounded-md border border-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
        type="button"
        onClick={() => signIn("github", { callbackUrl })}
      >
        Continue with GitHub
      </button>

      <p className="mt-6 text-center text-sm text-slate-300">
        Already have an account?{" "}
        <Link className="font-medium text-signal.mint hover:text-white" href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
