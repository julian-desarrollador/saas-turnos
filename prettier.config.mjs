/** @type {import("prettier").Config} */
const config = {
  // 80 columnas parte en varias líneas casi cualquier JSX con clases de Tailwind.
  printWidth: 100,
  // Ordena las clases de Tailwind siempre igual, así el orden deja de ser algo
  // que se discute en la revisión.
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
