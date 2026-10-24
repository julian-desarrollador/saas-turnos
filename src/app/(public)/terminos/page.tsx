import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col gap-4 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Términos</h1>
      <p className="text-muted-foreground text-sm">
        Borrador operativo. Un abogado lo reemplaza antes de la cohorte. No es el contrato
        definitivo.
      </p>
      <p className="text-sm">
        El negocio paga una suscripción fija del plan, en pesos, con un mes de prueba. Puede pagar
        con débito automático en tarjeta de crédito, mes a mes o el año completo (se pagan 10
        meses). Si el período vence sin pago, hay 7 días de gracia antes de suspender. Los mensajes
        de WhatsApp van incluidos hasta el tope del plan. La plataforma no guarda la tarjeta.
      </p>
      <p className="text-sm">
        El dueño puede dar de baja desde el panel. La baja cancela el débito y corta el acceso. El
        cliente final no le paga al negocio dentro de este producto: reservar no cobra.
      </p>
      <Link href="/" className="text-sm underline">
        Volver
      </Link>
    </main>
  );
}
