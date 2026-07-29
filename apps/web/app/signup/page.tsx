import { SignupForm } from "../../src/components/signup-form";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SignupPageProps {
  searchParams?: {
    callbackUrl?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-10 text-white lg:px-10 lg:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f14_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f14_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,#000_0%,transparent_76%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_68%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="hidden max-w-xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-neutral-300">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Create your workspace
          </div>
          <h1 className="mt-6 bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-6xl font-bold leading-[1.08] tracking-normal text-transparent">
            Learn from every code review.
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-400">
            Save review history, connect GitHub workflows, and build a clearer picture of the mistakes you are improving over time.
          </p>
          <div className="mt-8 grid gap-4 text-sm text-neutral-300">
            {["Stream structured review findings", "Accept fixes with full context", "Build a personal learning history"].map((item) => (
              <div className="flex items-center gap-3" key={item}>
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <SignupForm callbackUrl={searchParams?.callbackUrl ?? "/dashboard"} />
      </div>
    </main>
  );
}
