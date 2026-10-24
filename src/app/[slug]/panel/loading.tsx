export default function PanelPageLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-md space-y-5 px-4 py-6"
    >
      <p className="sr-only">Cargando</p>
      <header className="grid gap-2">
        <div className="bg-muted h-3 w-16 animate-pulse rounded-full" />
        <div className="bg-muted h-8 w-44 max-w-full animate-pulse rounded-xl" />
        <div className="bg-muted h-4 w-64 max-w-full animate-pulse rounded-full" />
      </header>
      <div className="bg-muted h-12 animate-pulse rounded-2xl" />
      <div className="grid gap-3">
        <div className="bg-muted h-24 animate-pulse rounded-2xl" />
        <div className="bg-muted h-24 animate-pulse rounded-2xl" />
        <div className="bg-muted h-24 animate-pulse rounded-2xl" />
      </div>
    </main>
  );
}
