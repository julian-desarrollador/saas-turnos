import { createClerkClient } from "@clerk/backend";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { withExplicitPgSsl } from "../src/lib/pg-connection-string";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });

const CLERK_USER_ID = process.env["CLERK_DEV_USER_ID"];
const CLERK_SECRET_KEY = process.env["CLERK_SECRET_KEY"];
const DATABASE_URL = process.env["DATABASE_URL"];

if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local.");
  process.exit(1);
}

if (!CLERK_USER_ID) {
  console.error(
    "Falta CLERK_DEV_USER_ID en .env.local.\n" +
      "Buscalo en https://dashboard.clerk.com → Users → tu usuario → User ID\n" +
      "Agregalo asi: CLERK_DEV_USER_ID=user_xxxxxxxxxxxx",
  );
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error("Falta CLERK_SECRET_KEY en .env.local (necesaria para crear la Organization).");
  process.exit(1);
}

const clerkUserId: string = CLERK_USER_ID;
const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

const adapter = new PrismaPg({
  connectionString: withExplicitPgSsl(DATABASE_URL),
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  const user = await db.user.upsert({
    where: { externalId: clerkUserId },
    create: {
      externalId: clerkUserId,
      email: "dev@saas-turnos.local",
      firstName: "Dev",
      lastName: "Owner",
    },
    update: {},
  });

  console.log(`  User: ${user.id}`);

  const tenant = await db.tenant.upsert({
    where: { slug: "demo" },
    create: {
      slug: "demo",
      name: "Peluquería Demo",
      timezone: "America/Argentina/Buenos_Aires",
      currency: "ARS",
    },
    update: {},
  });

  console.log(`  Tenant: ${tenant.id} (slug: ${tenant.slug})`);

  const existingBranch = await db.branch.findFirst({
    where: { tenantId: tenant.id },
  });

  const branch =
    existingBranch ??
    (await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: "Sede principal",
      },
    }));

  console.log(`  Branch: ${branch.id}`);

  const membership = await db.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER",
    },
    update: {},
  });

  console.log(`  Membership: ${membership.id} (role: ${membership.role})`);

  let clerkOrganizationId = tenant.clerkOrganizationId;
  if (!clerkOrganizationId) {
    const org = await clerk.organizations.createOrganization({
      name: tenant.name,
      createdBy: clerkUserId,
      slug: `demo-${tenant.id.replaceAll("-", "").slice(0, 12)}`,
    });
    clerkOrganizationId = org.id;
    await db.tenant.update({
      where: { id: tenant.id },
      data: { clerkOrganizationId },
    });
    console.log(`  Clerk Organization: ${clerkOrganizationId} (creada)`);
  } else {
    try {
      await clerk.organizations.createOrganizationMembership({
        organizationId: clerkOrganizationId,
        userId: clerkUserId,
        role: "org:admin",
      });
    } catch {
      // Already a member.
    }
    console.log(`  Clerk Organization: ${clerkOrganizationId} (existente)`);
  }

  const corte =
    (await db.service.findFirst({
      where: { tenantId: tenant.id, name: "Corte de dama" },
    })) ??
    (await db.service.create({
      data: {
        tenantId: tenant.id,
        name: "Corte de dama",
        durationMinutes: 45,
        priceAmount: 8000,
        prepMinutes: 0,
        cleanupMinutes: 5,
      },
    }));

  const coloracion =
    (await db.service.findFirst({
      where: { tenantId: tenant.id, name: "Coloración" },
    })) ??
    (await db.service.create({
      data: {
        tenantId: tenant.id,
        name: "Coloración",
        durationMinutes: 90,
        priceAmount: 15000,
        prepMinutes: 10,
        cleanupMinutes: 10,
        earliestStart: "09:00",
        latestStart: "16:00",
      },
    }));

  console.log(`  Services: ${corte.name}, ${coloracion.name}`);

  const professional =
    (await db.professional.findFirst({
      where: { tenantId: tenant.id, displayName: "Ana" },
    })) ??
    (await db.professional.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        displayName: "Ana",
        color: "#E11D48",
      },
    }));

  await db.professionalService.createMany({
    data: [
      { professionalId: professional.id, serviceId: corte.id },
      { professionalId: professional.id, serviceId: coloracion.id },
    ],
    skipDuplicates: true,
  });

  console.log(`  Professional: ${professional.displayName}`);

  await db.weeklySchedule.deleteMany({
    where: { tenantId: tenant.id },
  });

  await db.weeklySchedule.createMany({
    data: [
      {
        tenantId: tenant.id,
        branchId: branch.id,
        professionalId: null,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "19:00",
        capacity: 3,
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        professionalId: null,
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "19:00",
        capacity: 3,
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        professionalId: null,
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "19:00",
        capacity: 3,
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        professionalId: null,
        dayOfWeek: 4,
        startTime: "09:00",
        endTime: "19:00",
        capacity: 3,
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        professionalId: null,
        dayOfWeek: 5,
        startTime: "09:00",
        endTime: "19:00",
        capacity: 3,
      },
      {
        tenantId: tenant.id,
        branchId: branch.id,
        professionalId: null,
        dayOfWeek: 6,
        startTime: "09:00",
        endTime: "16:00",
        capacity: 2,
      },
      ...[1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
        {
          tenantId: tenant.id,
          branchId: null as string | null,
          professionalId: professional.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "11:30",
          capacity: 2,
        },
        {
          tenantId: tenant.id,
          branchId: null as string | null,
          professionalId: professional.id,
          dayOfWeek,
          startTime: "11:30",
          endTime: "18:00",
          capacity: 1,
        },
      ]),
      {
        tenantId: tenant.id,
        branchId: null,
        professionalId: professional.id,
        dayOfWeek: 6,
        startTime: "09:00",
        endTime: "16:00",
        capacity: 1,
      },
    ],
  });

  console.log("  Weekly schedules: sucursal lun-sáb, Ana con capacidad 2 a la mañana");

  console.log("\nSeed completado. Visita http://localhost:9700/demo/dashboard");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
