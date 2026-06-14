export type UserTier = "free" | "pro" | "team";

const TIER_RANK: Record<UserTier, number> = {
  free: 0,
  pro: 1,
  team: 2
};

export function meetsTier(currentTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_RANK[currentTier] >= TIER_RANK[requiredTier];
}

export function normalizeTier(value: string | undefined, fallback: UserTier = "free"): UserTier {
  if (value === "free" || value === "pro" || value === "team") {
    return value;
  }

  return fallback;
}
