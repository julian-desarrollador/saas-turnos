import type { Role } from "@/core/authorization";
import type { MembershipValidationReason } from "@/core/membership/application/errors";
import { invitableRoles } from "@/core/membership/application/invitable-role";
import type { MemberRecord } from "@/core/membership/application/ports/membership-repository";

const validationMessages: Record<MembershipValidationReason, string> = {
  EMAIL_INVALID: "El correo no es válido.",
  ROLE_NOT_INVITABLE: "Ese rol no se puede invitar. El dueño no se transfiere por invitación.",
  INVITE_ALREADY_PENDING: "Ya hay una invitación pendiente para ese correo.",
  ALREADY_MEMBER: "Esa persona ya tiene acceso a este negocio.",
  ORGANIZATION_REQUIRED: "Este negocio todavía no tiene Organization en Clerk.",
  CLERK_FAILED:
    "No pudimos enviar la invitación. Revisá que Organizations esté habilitado en Clerk y reintentá.",
};

export function membershipValidationMessage(
  reason: MembershipValidationReason | undefined,
): string {
  if (!reason) {
    return "Revisá los datos e intentá de nuevo.";
  }
  return validationMessages[reason];
}

export function membershipRoleLabel(role: Role): string {
  switch (role) {
    case "OWNER":
      return "Dueño";
    case "ADMIN":
      return "Administrador";
    case "PROFESSIONAL":
      return "Profesional";
    case "RECEPTION":
      return "Recepción";
  }
}

export function memberDisplayName(member: MemberRecord): string {
  const name = [member.firstName, member.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return name || member.email;
}

export const inviteRoleOptions = invitableRoles.map((role) => ({
  value: role,
  label: membershipRoleLabel(role),
}));
