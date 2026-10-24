import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col gap-4 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Privacidad</h1>
      <p className="text-muted-foreground text-sm">
        Borrador operativo. Un abogado lo reemplaza antes de la cohorte. No es la política
        definitiva.
      </p>
      <p className="text-sm">
        El negocio es responsable de los datos de sus clientes. La plataforma los trata para dar el
        servicio: agenda, reserva y recordatorios. La reserva pública guarda nombre, teléfono y la
        fecha en que la persona aceptó el aviso de WhatsApp.
      </p>
      <p className="text-sm">
        Esos datos pasan por los proveedores que operan el producto: identidad, base de datos,
        hosting, cobro de la suscripción y envío de WhatsApp. No se venden. No guardamos la tarjeta.
      </p>
      <Link href="/" className="text-sm underline">
        Volver
      </Link>
    </main>
  );
}
