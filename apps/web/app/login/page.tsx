export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#09111f_0%,_#101c30_100%)] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-xl rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm uppercase tracking-[0.32em] text-signal.mint">Login</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in to CodeMentor AI</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Use the NextAuth endpoints at /auth/signin for GitHub OAuth or email/password credentials.
        </p>
      </div>
    </main>
  );
}
