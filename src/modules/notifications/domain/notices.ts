const DAY_MS = 24 * 60 * 60 * 1000;

function zonedMidnight(year: number, month: number, timeZone: string): Date {
  const wanted = Date.UTC(year, month - 1, 1, 0, 0, 0);
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  let millis = wanted;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = format.formatToParts(new Date(millis));
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");
    let hour = read("hour");
    if (hour === 24) {
      hour = 0;
    }
    const got = Date.UTC(read("year"), read("month") - 1, read("day"), hour, read("minute"));
    if (got === wanted) {
      return new Date(millis);
    }
    millis -= got - wanted;
  }
  return new Date(millis);
}

export function calendarMonthWindow(now: Date, timeZone: string): { from: Date; to: Date } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return {
    from: zonedMidnight(year, month, timeZone),
    to: zonedMidnight(next.year, next.month, timeZone),
  };
}

export type NoticeKind = "CONFIRMATION" | "REMINDER";

export type PlannedNotice = {
  kind: NoticeKind;
  sendAt: Date;
  idempotencyKey: string;
};

export function planAppointmentNotices(input: {
  appointmentId: string;
  startsAt: Date;
  localDate: string;
  localTime: string;
  now: Date;
}): PlannedNotice[] {
  const slot = `${input.localDate}T${input.localTime}`;
  const rows: PlannedNotice[] = [
    {
      kind: "CONFIRMATION",
      sendAt: input.now,
      idempotencyKey: `${input.appointmentId}:CONFIRMATION:${slot}`,
    },
  ];
  const reminderAt = new Date(input.startsAt.getTime() - DAY_MS);
  if (reminderAt > input.now) {
    rows.push({
      kind: "REMINDER",
      sendAt: reminderAt,
      idempotencyKey: `${input.appointmentId}:REMINDER:${slot}`,
    });
  }
  return rows;
}
