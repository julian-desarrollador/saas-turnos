import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BookingError } from "@/modules/booking/application/errors";
import type {
  AvailabilityRepository,
  DeviceAppointmentRecord,
} from "@/modules/booking/application/ports/availability-repository";
import { createCancelDeviceAppointment } from "@/modules/booking/application/use-cases/cancel-device-appointment";
import { createListDeviceAppointments } from "@/modules/booking/application/use-cases/list-device-appointments";
import { createRescheduleDeviceAppointment } from "@/modules/booking/application/use-cases/reschedule-device-appointment";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const now = new Date("2026-10-19T15:00:00.000Z");

type Stored = DeviceAppointmentRecord & {
  tenantId: string;
  deviceKey: string | null;
  origin: "PUBLIC" | "PANEL";
};

function row(
  extra: Partial<Stored> & Pick<Stored, "id" | "tenantId" | "deviceKey" | "origin">,
): Stored {
  return {
    localDate: "2026-10-20",
    localTime: "10:00",
    startsAt: new Date("2026-10-20T13:00:00.000Z"),
    status: "CONFIRMED",
    professionalId: "pro-a",
    serviceId: "svc-1",
    serviceName: "Corte",
    professionalName: "Ana",
    clientPhone: "1112345678",
    ...extra,
  };
}

function harness() {
  const rows: Stored[] = [
    row({ id: "mine", tenantId: tenantA, deviceKey: "phone-a", origin: "PUBLIC" }),
    row({ id: "other-phone", tenantId: tenantA, deviceKey: "phone-b", origin: "PUBLIC" }),
    row({ id: "panel", tenantId: tenantA, deviceKey: null, origin: "PANEL" }),
    row({ id: "other-tenant", tenantId: tenantB, deviceKey: "phone-a", origin: "PUBLIC" }),
    row({
      id: "past",
      tenantId: tenantA,
      deviceKey: "phone-a",
      origin: "PUBLIC",
      localDate: "2026-10-18",
      startsAt: new Date("2026-10-18T13:00:00.000Z"),
    }),
  ];
  const cancelled: { id: string; by: string }[] = [];
  const moved: string[] = [];
  const repo = {
    async listDeviceAppointments(tenantId: string, deviceKey: string) {
      return rows
        .filter(
          (item) =>
            item.tenantId === tenantId && item.deviceKey === deviceKey && item.origin === "PUBLIC",
        )
        .map(
          ({ tenantId: _tenant, deviceKey: _key, origin: _origin, ...appointment }) => appointment,
        );
    },
    async listProfessionals(tenantId: string) {
      if (tenantId !== tenantA) {
        return [];
      }
      return [
        { id: "pro-b", displayName: "Sol", branchId: "b", serviceIds: ["svc-1"], isActive: true },
        { id: "pro-a", displayName: "Ana", branchId: "b", serviceIds: ["svc-1"], isActive: true },
      ];
    },
    async cancelAppointment(tenantId: string, appointmentId: string, cancelledBy: string) {
      const found = rows.find((item) => item.tenantId === tenantId && item.id === appointmentId);
      if (!found) {
        return { status: "not_found" as const };
      }
      cancelled.push({ id: appointmentId, by: cancelledBy });
      found.status = "CANCELLED";
      return { status: "cancelled" as const };
    },
    async rescheduleSlot(input: {
      tenantId: string;
      appointmentId: string;
      professionalId: string;
    }) {
      if (input.tenantId !== tenantA) {
        return { status: "not_found" as const };
      }
      moved.push(input.professionalId);
      if (input.professionalId === "pro-a") {
        return { status: "unavailable" as const };
      }
      return {
        status: "rescheduled" as const,
        appointment: {
          id: input.appointmentId,
          localDate: "2026-10-21",
          localTime: "11:00",
          professionalId: input.professionalId,
          serviceId: "svc-1",
          clientId: "client-1",
        },
      };
    },
  } as unknown as AvailabilityRepository;
  return { rows, cancelled, moved, repo };
}

describe("turnos del celular", () => {
  it("un celular ve solo los turnos que reservó en ese negocio", async () => {
    const { repo } = harness();
    const listed = await createListDeviceAppointments(repo)({
      tenantId: tenantA,
      deviceKey: "phone-a",
      now,
    });
    assert.deepEqual(
      listed.upcoming.map((item) => item.id),
      ["mine"],
    );
    assert.deepEqual(
      listed.past.map((item) => item.id),
      ["past"],
    );
  });

  it("no cancela el turno de otro celular, del panel, de otro negocio ni uno que ya empezó", async () => {
    const { repo, cancelled } = harness();
    const cancel = createCancelDeviceAppointment(repo);
    for (const appointmentId of ["other-phone", "panel", "other-tenant"]) {
      await assert.rejects(
        cancel({ tenantId: tenantA, deviceKey: "phone-a", appointmentId, now }),
        (error: unknown) => error instanceof BookingError && error.code === "NOT_FOUND",
      );
    }
    await assert.rejects(
      cancel({ tenantId: tenantA, deviceKey: "phone-a", appointmentId: "past", now }),
      (error: unknown) => error instanceof BookingError && error.reason === "NOT_CANCELLABLE",
    );
    assert.equal(cancelled.length, 0);
    await cancel({ tenantId: tenantA, deviceKey: "phone-a", appointmentId: "mine", now });
    assert.deepEqual(cancelled, [{ id: "mine", by: "CLIENT" }]);
  });

  it("si el profesional actual no tiene lugar, el cambio cae en el siguiente", async () => {
    const { repo, moved } = harness();
    const movedAppointment = await createRescheduleDeviceAppointment(repo)({
      tenantId: tenantA,
      deviceKey: "phone-a",
      appointmentId: "mine",
      professionalId: null,
      localDate: "2026-10-21",
      localTime: "11:00",
      now,
    });
    assert.deepEqual(moved, ["pro-a", "pro-b"]);
    assert.equal(movedAppointment.professionalId, "pro-b");
    await assert.rejects(
      createRescheduleDeviceAppointment(repo)({
        tenantId: tenantA,
        deviceKey: "phone-a",
        appointmentId: "other-tenant",
        professionalId: "pro-b",
        localDate: "2026-10-21",
        localTime: "11:00",
        now,
      }),
      (error: unknown) => error instanceof BookingError && error.code === "NOT_FOUND",
    );
  });
});
