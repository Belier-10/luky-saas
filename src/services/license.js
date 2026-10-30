const DAY = 86400000;

// license = { trialEndsAt, plan: null|"monthly"|"yearly"|"lifetime", expiresAt: null|ms }
// -> { status: "trial" | "active" | "expired", daysLeft, endsAt, plan }
export function computeAccess(license, now) {
  const l = license || {};
  if (l.plan === "lifetime") return { status: "active", plan: "lifetime", endsAt: null, daysLeft: null };
  if (l.plan && l.expiresAt && l.expiresAt > now) {
    return { status: "active", plan: l.plan, endsAt: l.expiresAt, daysLeft: Math.ceil((l.expiresAt - now) / DAY) };
  }
  if (l.trialEndsAt && l.trialEndsAt > now) {
    return { status: "trial", plan: null, endsAt: l.trialEndsAt, daysLeft: Math.ceil((l.trialEndsAt - now) / DAY) };
  }
  return { status: "expired", plan: l.plan || null, endsAt: l.expiresAt || l.trialEndsAt || null, daysLeft: 0 };
}
