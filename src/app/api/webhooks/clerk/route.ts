import type { WebhookEvent } from "@clerk/backend";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { createPrismaMembershipRepository } from "@/core/membership/adapters/outbound/prisma-membership-repository";
import { normalizeEmail } from "@/core/membership/application/email";
import { createActivateMembershipFromOrgEvent } from "@/core/membership/application/use-cases/activate-membership";
import { serverEnv } from "@/lib/env/server";
import { db, tenantDb } from "@/server/db";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const webhookSecret = serverEnv.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleClerkEvent(event);
  } catch {
    return NextResponse.json({ error: "Event handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleClerkEvent(event: WebhookEvent) {
  if (event.type === "user.created" || event.type === "user.updated") {
    const email = event.data.email_addresses[0]?.email_address;
    if (!email) {
      return;
    }
    await upsertIdentityUser({
      externalId: event.data.id,
      email,
      firstName: event.data.first_name,
      lastName: event.data.last_name,
      avatarUrl: event.data.image_url,
    });
    return;
  }

  if (event.type === "user.deleted") {
    await db.user.deleteMany({
      where: { externalId: event.data.id },
    });
    return;
  }

  if (event.type === "organizationInvitation.accepted") {
    await upsertIdentityUser({
      externalId: event.data.user_id,
      email: event.data.email_address,
    });
    await activateFromOrgEvent({
      clerkOrganizationId: event.data.organization_id,
      userExternalId: event.data.user_id,
      email: event.data.email_address,
      clerkInvitationId: event.data.id,
    });
    return;
  }

  if (event.type === "organizationMembership.created") {
    const userId = event.data.public_user_data.user_id;
    const identifierEmail = normalizeEmail(event.data.public_user_data.identifier);
    const existing = await db.user.findUnique({
      where: { externalId: userId },
      select: { email: true },
    });
    const email = identifierEmail ?? existing?.email;
    if (!email) {
      return;
    }
    await upsertIdentityUser({
      externalId: userId,
      email,
      firstName: event.data.public_user_data.first_name,
      lastName: event.data.public_user_data.last_name,
      avatarUrl: event.data.public_user_data.image_url,
    });
    await activateFromOrgEvent({
      clerkOrganizationId: event.data.organization.id,
      userExternalId: userId,
      email,
    });
  }
}

async function upsertIdentityUser(input: {
  externalId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}) {
  const email = normalizeEmail(input.email) ?? input.email.trim().toLowerCase();
  await db.user.upsert({
    where: { externalId: input.externalId },
    create: {
      externalId: input.externalId,
      email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      avatarUrl: input.avatarUrl ?? null,
    },
    update: {
      email,
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
  });
}

async function activateFromOrgEvent(input: {
  clerkOrganizationId: string;
  userExternalId: string;
  email: string;
  clerkInvitationId?: string | null;
}) {
  const activate = createActivateMembershipFromOrgEvent(
    createPrismaMembershipRepository(db, tenantDb),
  );
  await activate(input);
}
