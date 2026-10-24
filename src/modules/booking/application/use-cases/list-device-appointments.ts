import type {
  AvailabilityRepository,
  DeviceAppointmentRecord,
} from "../ports/availability-repository";

export function createListDeviceAppointments(repo: AvailabilityRepository) {
  return async function listDeviceAppointments(input: {
    tenantId: string;
    deviceKey: string;
    now: Date;
  }): Promise<{ upcoming: DeviceAppointmentRecord[]; past: DeviceAppointmentRecord[] }> {
    if (!input.deviceKey) {
      return { upcoming: [], past: [] };
    }
    const rows = await repo.listDeviceAppointments(input.tenantId, input.deviceKey);
    const upcoming: DeviceAppointmentRecord[] = [];
    const past: DeviceAppointmentRecord[] = [];
    for (const row of rows) {
      const open =
        row.status === "PENDING" || row.status === "CONFIRMED" || row.status === "IN_PROGRESS";
      if (open && row.startsAt.getTime() > input.now.getTime()) {
        upcoming.push(row);
      } else {
        past.push(row);
      }
    }
    return { upcoming, past };
  };
}
