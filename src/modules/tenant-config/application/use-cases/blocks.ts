import { assertPermission } from "@/core/authorization";

import { TenantConfigError, notFound } from "../errors";
import type {
  CalendarBlockRecord,
  ScheduleActor,
  ScheduleOwner,
  ScheduleRepositories,
} from "../ports/schedule-repository";
import {
  assertDate,
  assertDateRange,
  assertOptionalBlockTimes,
  assertOptionalReason,
  eachInclusiveDate,
} from "../schedule-rules";
import { sortCalendarBlocksSoonestFirst } from "../sort-calendar-blocks";

export function createListCalendarBlocks(repos: ScheduleRepositories) {
  return async function listCalendarBlocks(actor: ScheduleActor): Promise<CalendarBlockRecord[]> {
    assertPermission(actor.role, "schedule.read");
    const blocks = await repos.blocks.listByTenant(actor.tenantId);
    return sortCalendarBlocksSoonestFirst(blocks);
  };
}

export function createCreateCalendarBlock(repos: ScheduleRepositories) {
  return async function createCalendarBlock(input: {
    actor: ScheduleActor;
    owner: ScheduleOwner;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }): Promise<CalendarBlockRecord[]> {
    assertPermission(input.actor.role, "block.write");
    if ((input.owner.kind !== "branch" && input.owner.kind !== "professional") || !input.owner.id) {
      throw new TenantConfigError("VALIDATION", "SCHEDULE_OWNER_REQUIRED", "owner");
    }

    const startDate = assertDate(input.startDate, "startDate");
    const endDate = assertDate(input.endDate, "endDate");
    assertDateRange(startDate, endDate);
    const times = assertOptionalBlockTimes(input.startTime, input.endTime);
    const reason = assertOptionalReason(input.reason);
    const dates = eachInclusiveDate(startDate, endDate);

    const created = await repos.blocks.createMany(
      dates.map((date) => ({
        tenantId: input.actor.tenantId,
        owner: input.owner,
        startDate: date,
        endDate: date,
        startTime: times.startTime,
        endTime: times.endTime,
        reason,
      })),
    );
    if (!created) {
      notFound();
    }
    return created;
  };
}

export function createDeleteCalendarBlock(repos: ScheduleRepositories) {
  return async function deleteCalendarBlock(input: {
    actor: ScheduleActor;
    blockId: string;
  }): Promise<void> {
    assertPermission(input.actor.role, "block.write");
    const deleted = await repos.blocks.delete(input.actor.tenantId, input.blockId);
    if (!deleted) {
      notFound();
    }
  };
}
