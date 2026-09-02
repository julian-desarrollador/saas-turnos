export const roles = ["OWNER", "ADMIN", "PROFESSIONAL", "RECEPTION"] as const;
export type Role = (typeof roles)[number];

export const permissions = [
  "catalog.read",
  "catalog.write",
  "schedule.read",
  "schedule.write",
  "block.write",
  "booking.read",
  "booking.write",
  "clients.read",
  "clients.write",
  "members.read",
  "members.invite",
] as const;
export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, readonly Permission[]> = {
  OWNER: [
    "catalog.read",
    "catalog.write",
    "schedule.read",
    "schedule.write",
    "block.write",
    "booking.read",
    "booking.write",
    "clients.read",
    "clients.write",
    "members.read",
    "members.invite",
  ],
  ADMIN: [
    "catalog.read",
    "catalog.write",
    "schedule.read",
    "schedule.write",
    "block.write",
    "booking.read",
    "booking.write",
    "clients.read",
    "clients.write",
    "members.read",
    "members.invite",
  ],
  PROFESSIONAL: [
    "catalog.read",
    "schedule.read",
    "block.write",
    "booking.read",
    "booking.write",
    "clients.read",
    "clients.write",
  ],
  RECEPTION: [
    "catalog.read",
    "schedule.read",
    "block.write",
    "booking.read",
    "booking.write",
    "clients.read",
    "clients.write",
  ],
};

export function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN" as const;

  constructor() {
    super("FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }
}
