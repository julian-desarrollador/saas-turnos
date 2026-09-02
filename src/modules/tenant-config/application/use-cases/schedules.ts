import { assertPermission } from "@/core/authorization";

import { TenantConfigError, notFound } from "../errors";
import type {
  ScheduleActor,
  ScheduleOwner,
  ScheduleRepositories,
  WeeklySlotInput,
  WeeklySlotRecord,
} from "../ports/schedule-repository";
import { assertWeeklySlots } from "../schedule-rules";

export function createListWeeklySlots(repos: ScheduleRepositories) {
  return async function listWeeklySlots(actor: ScheduleActor): Promise<WeeklySlotRecord[]> {
    assertPermission(actor.role, "schedule.read");
    return repos.weekly.listByTenant(actor.tenantId);
  };
}

export function createSetWeeklySchedule(repos: ScheduleRepositories) {
  return async function setWeeklySchedule(input: {
    actor: ScheduleActor;
    owner: ScheduleOwner;
    slots: WeeklySlotInput[];
  }): Promise<WeeklySlotRecord[]> {
    assertPermission(input.actor.role, "schedule.write");
    assertOwner(input.owner);
    const slots = assertWeeklySlots(input.slots);
    const updated = await repos.weekly.replaceByOwner(input.actor.tenantId, input.owner, slots);
    if (!updated) {
      notFound();
    }
    return updated;
  };
}

function assertOwner(owner: ScheduleOwner): void {
  if ((owner.kind !== "branch" && owner.kind !== "professional") || !owner.id) {
    throw new TenantConfigError("VALIDATION", "SCHEDULE_OWNER_REQUIRED", "owner");
  }
}
