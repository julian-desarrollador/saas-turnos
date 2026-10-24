import type { NextConfig } from "next";

// Cabeceras aplicadas a toda respuesta (docs/13-security.md §6). No incluyen HSTS
// porque en Vercel se emite a nivel de plataforma, ni Content-Security-Policy:
// esa requiere nonce por request y la lista de orígenes externos, que se define
// cuando existan las superficies reales.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

// Solo el dominio público del bucket de R2 y solo las carpetas de negocio
// (docs/03-architecture.md §9). Sin la variable, no se acepta ninguna imagen remota.
const siteImagesUrl = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;
const remotePatterns = siteImagesUrl
  ? [
      {
        protocol: siteImagesUrl.protocol === "http:" ? ("http" as const) : ("https" as const),
        hostname: siteImagesUrl.hostname,
        port: siteImagesUrl.port,
        pathname: `${siteImagesUrl.pathname.replace(/\/+$/, "")}/tenants/**`,
        search: "",
      },
    ]
  : [];

const nextConfig: NextConfig = {
  images: { remotePatterns },
  // Sin esto, Next infiere la raíz buscando lockfiles hacia arriba y puede elegir
  // un directorio ajeno al proyecto.
  turbopack: { root: import.meta.dirname },
  // Verifica los enlaces contra las rutas reales en tiempo de compilación. Con el
  // tenant en la ruta, un enlace mal armado es un 404 para un negocio entero.
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
