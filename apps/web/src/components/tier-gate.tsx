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
    <section className="rounded-lg border border-signal.yellow/30 bg-signal.yellow/10 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-signal.yellow">{requiredTier} tier</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
        {description ?? `This content is available on ${requiredTier} and higher tiers.`}
      </p>
      <a
        href={actionHref}
        className="mt-5 inline-flex rounded-full border border-signal.yellow/40 bg-signal.yellow/15 px-5 py-3 text-sm font-medium text-signal.yellow transition hover:bg-signal.yellow/25"
      >
        {actionLabel}
      </a>
    </section>
  );
}
