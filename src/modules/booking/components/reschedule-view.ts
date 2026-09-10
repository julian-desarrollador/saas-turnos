export function rescheduleClientName(appointment: {
  clientFirstName: string | null;
  clientLastName: string | null;
}): string {
  return (
    [appointment.clientFirstName, appointment.clientLastName]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(" ") || "Cliente"
  );
}

export function formatRescheduleDate(localDate: string): string {
  const year = Number(localDate.slice(0, 4));
  const month = Number(localDate.slice(5, 7));
  const day = Number(localDate.slice(8, 10));

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatRescheduleTimeRange(startTime: string, endTime: string): string {
  return `${startTime} a ${endTime}`;
}
