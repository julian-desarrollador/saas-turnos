import { assertPermission } from "@/core/authorization";

import { canRescheduleAppointment } from "../../domain/appointment-lifecycle";
import { isLocalDate } from "../../domain/time";
import { BookingError } from "../errors";
import { emptySlotsReason, type EmptySlotsReason } from "../offered-from-snapshot";
import type { AvailabilityRepository, BookingActor } from "../ports/availability-repository";
import { createGetAppointment } from "./get-appointment";
import { createListAgendaCatalog, createListAvailableSlots } from "./list-available-slots";

export type RescheduleProfessional = {
  id: string;
  displayName: string;
};

export type ListRescheduleProfessionalsResult = {
  professionals: RescheduleProfessional[];
  emptyReason: EmptySlotsReason | null;
  branchName: string | null;
};

export function createListRescheduleProfessionals(repo: AvailabilityRepository) {
  const getAppointment = createGetAppointment(repo);
  const listAgendaCatalog = createListAgendaCatalog(repo);
  const listAvailableSlots = createListAvailableSlots(repo);

  return async function listRescheduleProfessionals(input: {
    actor: BookingActor;
    appointmentId: string;
    localDate: string;
    now: Date;
  }): Promise<ListRescheduleProfessionalsResult> {
    assertPermission(input.actor.role, "booking.read");
    if (!isLocalDate(input.localDate)) {
      throw new BookingError("VALIDATION", "DATE_INVALID", "localDate");
    }

    const appointment = await getAppointment({
      actor: input.actor,
      appointmentId: input.appointmentId,
    });
    if (!canRescheduleAppointment(appointment.status)) {
      throw new BookingError("CONFLICT", "NOT_MOVABLE");
    }

    const catalog = await listAgendaCatalog(input.actor);
    const candidates = catalog.professionals.filter((professional) =>
      professional.serviceIds.includes(appointment.serviceId),
    );

    const available: RescheduleProfessional[] = [];
    const emptyCandidates: { reason: EmptySlotsReason | null; branchName: string | null }[] = [];
    for (const professional of candidates) {
      let slots = await listAvailableSlots({
        actor: input.actor,
        professionalId: professional.id,
        serviceId: appointment.serviceId,
        localDate: input.localDate,
        now: input.now,
        excludeAppointmentId: appointment.id,
      });
      if (
        professional.id === appointment.professionalId &&
        input.localDate === appointment.localDate
      ) {
        slots = slots.filter((slot) => slot !== appointment.localTime);
      }
      if (slots.length > 0) {
        available.push({
          id: professional.id,
          displayName: professional.displayName,
        });
        continue;
      }

      const snapshot = await repo.loadSnapshot(
        input.actor.tenantId,
        professional.id,
        appointment.serviceId,
        input.localDate,
        appointment.id,
      );
      emptyCandidates.push({
        reason: snapshot ? emptySlotsReason(snapshot, input.localDate, input.now) : "NONE_FIT",
        branchName: snapshot?.branchName ?? null,
      });
    }

    if (available.length > 0) {
      return { professionals: available, emptyReason: null, branchName: null };
    }

    const sharedName = emptyCandidates[0]?.branchName ?? null;
    const branchBlocked =
      emptyCandidates.length > 0 &&
      Boolean(sharedName) &&
      emptyCandidates.every(
        (item) => item.reason === "BRANCH_BLOCKED" && item.branchName === sharedName,
      );

    return {
      professionals: [],
      emptyReason: branchBlocked ? "BRANCH_BLOCKED" : null,
      branchName: branchBlocked ? sharedName : null,
    };
  };
}
