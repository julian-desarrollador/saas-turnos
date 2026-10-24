const DAY_MS = 24 * 60 * 60 * 1000;

export const GRACE_DAYS = 7;

export const ANNUAL_BILLED_MONTHS = 10;

export const plans = {
  INICIO: { employeeLimit: 2, monthlyArs: 17900, messageCap: 80 },
  NEGOCIO: { employeeLimit: 4, monthlyArs: 29900, messageCap: 180 },
  EQUIPO: { employeeLimit: 8, monthlyArs: 47900, messageCap: 400 },
} as const;

export type PlanCode = keyof typeof plans;
export type PeriodMonths = 1 | 12;
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
export type CommercialAccess = "full" | "today" | "blocked";
export type ChargeOutcome = "paid" | "failed";

export type CommercialSnapshot = {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  graceEndsAt: Date | null;
  periodEndsAt?: Date | null;
};

export function isPlanCode(value: string): value is PlanCode {
  return Object.prototype.hasOwnProperty.call(plans, value);
}

export function employeeLimit(plan: PlanCode): number {
  return plans[plan].employeeLimit;
}

export function monthlyArs(plan: PlanCode): number {
  return plans[plan].monthlyArs;
}

export function isPeriodMonths(value: number): value is PeriodMonths {
  return value === 1 || value === 12;
}

export function periodPrice(plan: PlanCode, months: PeriodMonths): number {
  return months === 12 ? monthlyArs(plan) * ANNUAL_BILLED_MONTHS : monthlyArs(plan);
}

export function messageCap(plan: PlanCode): number {
  return plans[plan].messageCap;
}

export function trialEndsAt(startedAt: Date): Date {
  return periodEndsAt(startedAt, 1);
}

export function remainingTrialDays(snapshot: CommercialSnapshot, now: Date): number {
  if (snapshot.status !== "TRIAL" || !snapshot.trialEndsAt) {
    return 0;
  }
  return Math.max(0, Math.ceil((snapshot.trialEndsAt.getTime() - now.getTime()) / DAY_MS));
}

export function graceEndsAt(from: Date): Date {
  return new Date(from.getTime() + GRACE_DAYS * DAY_MS);
}

export function periodEndsAt(from: Date, months: number = 1): Date {
  const next = new Date(from.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function commercialAccess(
  snapshot: CommercialSnapshot,
  now: Date,
): { status: SubscriptionStatus; access: CommercialAccess } {
  if (snapshot.status === "CANCELLED") {
    return { status: "CANCELLED", access: "blocked" };
  }
  if (snapshot.status === "SUSPENDED") {
    return { status: "SUSPENDED", access: "today" };
  }
  let status = snapshot.status;
  let grace = snapshot.graceEndsAt;
  if (status === "ACTIVE") {
    if (!snapshot.periodEndsAt || now < snapshot.periodEndsAt) {
      return { status: "ACTIVE", access: "full" };
    }
    status = "PAST_DUE";
    grace = graceEndsAt(snapshot.periodEndsAt);
  }

  if (status === "TRIAL") {
    if (!snapshot.trialEndsAt || now < snapshot.trialEndsAt) {
      return { status: "TRIAL", access: "full" };
    }
    status = "PAST_DUE";
    grace = grace ?? graceEndsAt(snapshot.trialEndsAt);
  }

  if (status === "PAST_DUE" && grace && now >= grace) {
    return { status: "SUSPENDED", access: "today" };
  }
  return { status: "PAST_DUE", access: "full" };
}

export function applyCharge(
  snapshot: CommercialSnapshot,
  outcome: ChargeOutcome,
  now: Date,
): CommercialSnapshot {
  if (snapshot.status === "CANCELLED") {
    return snapshot;
  }
  if (outcome === "paid") {
    return {
      status: "ACTIVE",
      trialEndsAt: snapshot.trialEndsAt,
      graceEndsAt: null,
      periodEndsAt: periodEndsAt(now),
    };
  }
  if (snapshot.status === "PAST_DUE" || snapshot.status === "SUSPENDED") {
    return snapshot;
  }
  if (snapshot.status === "ACTIVE" && snapshot.periodEndsAt && now < snapshot.periodEndsAt) {
    return snapshot;
  }
  return {
    status: "PAST_DUE",
    trialEndsAt: snapshot.trialEndsAt,
    graceEndsAt: graceEndsAt(now),
    periodEndsAt: snapshot.periodEndsAt ?? null,
  };
}

export function applyPeriodPayment(
  snapshot: CommercialSnapshot,
  months: PeriodMonths,
  now: Date,
): CommercialSnapshot {
  if (snapshot.status === "CANCELLED") {
    return snapshot;
  }
  let from = now;
  if (snapshot.periodEndsAt && snapshot.periodEndsAt > from) {
    from = snapshot.periodEndsAt;
  }
  if (snapshot.status === "TRIAL" && snapshot.trialEndsAt && snapshot.trialEndsAt > from) {
    from = snapshot.trialEndsAt;
  }
  return {
    status: "ACTIVE",
    trialEndsAt: snapshot.trialEndsAt,
    graceEndsAt: null,
    periodEndsAt: periodEndsAt(from, months),
  };
}

export function fullAccessDenied(access: CommercialAccess): string | null {
  if (access === "full") {
    return null;
  }
  if (access === "blocked") {
    return "La suscripción está cancelada.";
  }
  return "Con la suscripción suspendida solo podés trabajar la agenda de hoy.";
}

export function todayAccessDenied(access: CommercialAccess): string | null {
  if (access === "blocked") {
    return "La suscripción está cancelada.";
  }
  return null;
}

export function applyCancellation(snapshot: CommercialSnapshot): CommercialSnapshot {
  if (snapshot.status === "CANCELLED") {
    return snapshot;
  }
  return { ...snapshot, status: "CANCELLED" };
}
