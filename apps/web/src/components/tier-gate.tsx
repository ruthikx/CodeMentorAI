import { meetsTier, type UserTier } from "../lib/tiers";

export function TierGate({
  children,
  currentTier,
  requiredTier,
  title = "Upgrade to unlock this feature.",
  description,
  actionHref = "/review/new",
  actionLabel = "Continue Reviewing"
}: {
  children: React.ReactNode;
  currentTier: UserTier;
  requiredTier: UserTier;
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  if (meetsTier(currentTier, requiredTier)) {
    return <>{children}</>;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-yellow-500/25 bg-yellow-500/10 p-6 shadow-2xl backdrop-blur-md">
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-yellow-400/10 blur-[80px]" />
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-300">{requiredTier} tier</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
          {description ?? `This content is available on ${requiredTier} and higher tiers.`}
        </p>
        <a
          href={actionHref}
          className="mt-5 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-medium text-yellow-200 transition hover:bg-yellow-400/15"
        >
          {actionLabel}
        </a>
      </div>
    </section>
  );
}
