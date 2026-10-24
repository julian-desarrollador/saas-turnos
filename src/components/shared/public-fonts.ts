import { Montserrat, Playfair_Display } from "next/font/google";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-public-display" });
const body = Montserrat({ subsets: ["latin"], variable: "--font-public-body" });

/** Variables de la plantilla A: el sitio público y la vista previa del editor. */
export const publicFonts = `${display.variable} ${body.variable}`;
