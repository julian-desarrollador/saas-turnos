import type { ServiceRecord } from "@/modules/tenant-config/application/ports/catalog-repository";

/** Servicios que presta una persona: casillas nativas con name="serviceId". */
export function ServiceChecklist({
  services,
  selectedIds,
}: {
  services: ServiceRecord[];
  selectedIds: string[];
}) {
  if (services.length === 0) {
    return (
      <p className="border-border text-muted-foreground rounded-2xl border border-dashed px-4 py-5 text-sm">
        Todavía no hay servicios cargados. Cargalos en Servicios y después volvé para asignarlos.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {services.map((service) => (
        <label
          key={service.id}
          className="border-border bg-card hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-primary/25 flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm transition has-[:checked]:ring-2"
        >
          <input
            type="checkbox"
            name="serviceId"
            value={service.id}
            defaultChecked={selectedIds.includes(service.id)}
            className="accent-primary size-5 shrink-0 cursor-pointer"
          />
          <span className="min-w-0">
            <span className="block text-base font-semibold">{service.name}</span>
            <span className="text-muted-foreground block text-sm">
              {service.durationMinutes} min
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
