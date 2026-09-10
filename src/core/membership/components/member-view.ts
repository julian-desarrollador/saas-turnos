import type { Role } from "@/core/authorization";

export function membershipRoleBlurb(role: Role): string {
  switch (role) {
    case "OWNER":
    case "ADMIN":
      return "Puede cambiar equipo, servicios y horarios, e invitar a otras personas.";
    case "PROFESSIONAL":
    case "RECEPTION":
      return "Puede dar turnos y atender clientes. No cambia el catálogo ni invita.";
  }
}

export function inviteToastMessage(email: string): string | null {
  if (!email.trim()) {
    return "Invitación enviada";
  }
  return `Invitación enviada · ${email.trim()}`;
}
