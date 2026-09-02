import { assertPermission } from "@/core/authorization";

import type {
  MemberRecord,
  MembershipActor,
  MembershipInviteRecord,
  MembershipRepository,
} from "../ports/membership-repository";

export function createListMembers(repo: MembershipRepository) {
  return async function listMembers(actor: MembershipActor): Promise<MemberRecord[]> {
    assertPermission(actor.role, "members.read");
    return repo.listMembers(actor.tenantId);
  };
}

export function createListPendingInvites(repo: MembershipRepository) {
  return async function listPendingInvites(
    actor: MembershipActor,
  ): Promise<MembershipInviteRecord[]> {
    assertPermission(actor.role, "members.read");
    return repo.listPendingInvites(actor.tenantId);
  };
}
