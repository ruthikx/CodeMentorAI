import { getSeverityMeta, type ReviewSeverity } from "../lib/review";

export function SeverityBadge({ severity }: { severity: ReviewSeverity }) {
  const meta = getSeverityMeta(severity);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ring-1 ${meta.surfaceClass} ${meta.colorClass}`}
      aria-label={`${meta.label} severity`}
    >
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current px-1 text-[10px]" aria-hidden="true">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}
