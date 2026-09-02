import type { InvitableRole } from "./ports/membership-repository";

export const invitableRoles = ["ADMIN", "PROFESSIONAL", "RECEPTION"] as const;

export function isInvitableRole(value: string): value is InvitableRole {
  return (invitableRoles as readonly string[]).includes(value);
}
