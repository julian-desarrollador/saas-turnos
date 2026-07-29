export async function register() {
  // La validación corre como efecto de importar cada módulo. Se hace en el
  // arranque del servidor para que un despliegue mal configurado falle acá,
  // y no en la primera request que necesite la variable
  // (docs/12-deployment.md §2).
  await import("./lib/env/server");
  await import("./lib/env/client");
}
