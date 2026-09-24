import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ForbiddenError } from "@/core/authorization";
import { createMemorySchedule } from "@/modules/tenant-config/adapters/outbound/memory-schedule-repository";
import { TenantConfigError } from "@/modules/tenant-config/application/errors";
import {
  eachInclusiveDate,
  calendarBlocksOverlap,
} from "@/modules/tenant-config/application/schedule-rules";
import {
  createCreateCalendarBlock,
  createDeleteCalendarBlock,
  createListCalendarBlocks,
} from "@/modules/tenant-config/application/use-cases/blocks";
import {
  createListWeeklySlots,
  createSetWeeklySchedule,
} from "@/modules/tenant-config/application/use-cases/schedules";

const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const branchA = "11111111-1111-1111-1111-111111111111";
const professionalA = "44444444-4444-4444-4444-444444444444";
const professionalB = "22222222-2222-2222-2222-222222222222";

const ownerA = { tenantId: tenantA, role: "OWNER" as const };
const receptionA = { tenantId: tenantA, role: "RECEPTION" as const };

function repos() {
  return createMemorySchedule({
    branches: [{ id: branchA, tenantId: tenantA }],
    professionals: [
      { id: professionalA, tenantId: tenantA },
      { id: professionalB, tenantId: tenantB },
    ],
  });
}

describe("setWeeklySchedule", () => {
  it("rechaza franjas que se solapan en el mismo día", async () => {
    const setWeeklySchedule = createSetWeeklySchedule(repos());

    await assert.rejects(
      () =>
        setWeeklySchedule({
          actor: ownerA,
          owner: { kind: "professional", id: professionalA },
          slots: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", capacity: 1 },
            { dayOfWeek: 1, startTime: "11:00", endTime: "14:00", capacity: 1 },
          ],
        }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "SLOTS_OVERLAP",
    );
  });

  it("rechaza un inicio igual o posterior al fin", async () => {
    const setWeeklySchedule = createSetWeeklySchedule(repos());

    await assert.rejects(
      () =>
        setWeeklySchedule({
          actor: ownerA,
          owner: { kind: "professional", id: professionalA },
          slots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "09:00", capacity: 1 }],
        }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "INVALID_TIME_RANGE",
    );
  });

  it("rechaza capacidad cero", async () => {
    const setWeeklySchedule = createSetWeeklySchedule(repos());

    await assert.rejects(
      () =>
        setWeeklySchedule({
          actor: ownerA,
          owner: { kind: "professional", id: professionalA },
          slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00", capacity: 0 }],
        }),
      (error: unknown) =>
        error instanceof TenantConfigError && error.reason === "CAPACITY_MUST_BE_POSITIVE",
    );
  });

  it("no deja cambiar horarios a un rol RECEPTION", async () => {
    const setWeeklySchedule = createSetWeeklySchedule(repos());

    await assert.rejects(
      () =>
        setWeeklySchedule({
          actor: receptionA,
          owner: { kind: "professional", id: professionalA },
          slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00", capacity: 1 }],
        }),
      (error: unknown) => error instanceof ForbiddenError,
    );
  });

  it("no actualiza el horario de un profesional de otro tenant", async () => {
    const schedule = repos();
    const setWeeklySchedule = createSetWeeklySchedule(schedule);

    await assert.rejects(
      () =>
        setWeeklySchedule({
          actor: ownerA,
          owner: { kind: "professional", id: professionalB },
          slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00", capacity: 1 }],
        }),
      (error: unknown) => error instanceof TenantConfigError && error.code === "NOT_FOUND",
    );

    const leaked = await schedule.weekly.listByOwner(tenantB, {
      kind: "professional",
      id: professionalB,
    });
    assert.equal(leaked?.length, 0);
  });

  it("no lista horarios de otro negocio", async () => {
    const schedule = createMemorySchedule({
      branches: [{ id: branchA, tenantId: tenantA }],
      professionals: [
        { id: professionalA, tenantId: tenantA },
        { id: professionalB, tenantId: tenantB },
      ],
      slots: [
        {
          id: "77777777-7777-7777-7777-777777777777",
          tenantId: tenantB,
          branchId: null,
          professionalId: professionalB,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "18:00",
          capacity: 1,
        },
      ],
    });
    const listed = await createListWeeklySlots(schedule)(ownerA);
    assert.deepEqual(listed, []);
  });

  it("acepta tres franjas del mismo día que no se solapan", async () => {
    const schedule = repos();
    const setWeeklySchedule = createSetWeeklySchedule(schedule);
    const owner = { kind: "professional" as const, id: professionalA };

    const saved = await setWeeklySchedule({
      actor: ownerA,
      owner,
      slots: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "11:30", capacity: 3 },
        { dayOfWeek: 1, startTime: "11:30", endTime: "16:00", capacity: 2 },
        { dayOfWeek: 1, startTime: "16:00", endTime: "19:00", capacity: 1 },
      ],
    });

    assert.equal(saved.length, 3);
    assert.deepEqual(
      saved.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
      })),
      [
        { startTime: "09:00", endTime: "11:30", capacity: 3 },
        { startTime: "11:30", endTime: "16:00", capacity: 2 },
        { startTime: "16:00", endTime: "19:00", capacity: 1 },
      ],
    );
  });

  it("reemplaza la semana completa y no deja filas duplicadas", async () => {
    const schedule = repos();
    const setWeeklySchedule = createSetWeeklySchedule(schedule);
    const owner = { kind: "professional" as const, id: professionalA };

    await setWeeklySchedule({
      actor: ownerA,
      owner,
      slots: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "13:00", capacity: 1 },
        { dayOfWeek: 1, startTime: "14:00", endTime: "18:00", capacity: 1 },
      ],
    });

    const second = await setWeeklySchedule({
      actor: ownerA,
      owner,
      slots: [{ dayOfWeek: 2, startTime: "10:00", endTime: "16:00", capacity: 2 }],
    });

    assert.equal(second.length, 1);
    assert.equal(second[0]?.dayOfWeek, 2);
    assert.equal(second[0]?.capacity, 2);

    const listed = await schedule.weekly.listByOwner(tenantA, owner);
    assert.equal(listed?.length, 1);
  });
});

describe("eachInclusiveDate", () => {
  it("incluye ambos extremos del rango", () => {
    assert.deepEqual(eachInclusiveDate("2026-10-10", "2026-10-11"), ["2026-10-10", "2026-10-11"]);
  });

  it("devuelve un solo día cuando inicio y fin coinciden", () => {
    assert.deepEqual(eachInclusiveDate("2026-10-10", "2026-10-10"), ["2026-10-10"]);
  });

  it("cruza el fin de mes en UTC", () => {
    assert.deepEqual(eachInclusiveDate("2026-01-31", "2026-02-01"), ["2026-01-31", "2026-02-01"]);
  });
});

describe("calendarBlocksOverlap", () => {
  it("trata dos días completos iguales como solape", () => {
    assert.equal(
      calendarBlocksOverlap(
        { startDate: "2026-09-23", endDate: "2026-09-23", startTime: null, endTime: null },
        { startDate: "2026-09-23", endDate: "2026-09-23", startTime: null, endTime: null },
      ),
      true,
    );
  });

  it("un día completo solapa cualquier franja de ese día", () => {
    assert.equal(
      calendarBlocksOverlap(
        { startDate: "2026-09-23", endDate: "2026-09-23", startTime: null, endTime: null },
        {
          startDate: "2026-09-23",
          endDate: "2026-09-23",
          startTime: "10:00",
          endTime: "12:00",
        },
      ),
      true,
    );
  });

  it("permite franjas consecutivas del mismo día", () => {
    assert.equal(
      calendarBlocksOverlap(
        {
          startDate: "2026-09-23",
          endDate: "2026-09-23",
          startTime: "10:00",
          endTime: "12:00",
        },
        {
          startDate: "2026-09-23",
          endDate: "2026-09-23",
          startTime: "12:00",
          endTime: "14:00",
        },
      ),
      false,
    );
  });

  it("solapa franjas que se pisan", () => {
    assert.equal(
      calendarBlocksOverlap(
        {
          startDate: "2026-09-23",
          endDate: "2026-09-23",
          startTime: "10:00",
          endTime: "12:00",
        },
        {
          startDate: "2026-09-23",
          endDate: "2026-09-23",
          startTime: "11:00",
          endTime: "13:00",
        },
      ),
      true,
    );
  });

  it("no solapa días distintos", () => {
    assert.equal(
      calendarBlocksOverlap(
        { startDate: "2026-09-23", endDate: "2026-09-23", startTime: null, endTime: null },
        { startDate: "2026-09-24", endDate: "2026-09-24", startTime: null, endTime: null },
      ),
      false,
    );
  });
});

describe("calendar blocks", () => {
  it("permite a recepción crear un bloqueo por cada día del rango", async () => {
    const createCalendarBlock = createCreateCalendarBlock(repos());
    const created = await createCalendarBlock({
      actor: receptionA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-12-24",
      endDate: "2026-12-26",
      startTime: null,
      endTime: null,
      reason: "Feriado",
    });

    assert.equal(created.length, 3);
    assert.deepEqual(
      created.map((block) => block.startDate),
      ["2026-12-24", "2026-12-25", "2026-12-26"],
    );
    assert.ok(
      created.every(
        (block) =>
          block.startDate === block.endDate &&
          block.reason === "Feriado" &&
          block.professionalId === professionalA,
      ),
    );
  });

  it("rechaza un segundo día completo de la misma agenda", async () => {
    const createCalendarBlock = createCreateCalendarBlock(repos());
    await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "branch", id: branchA },
      startDate: "2026-09-23",
      endDate: "2026-09-23",
      startTime: null,
      endTime: null,
      reason: null,
    });

    await assert.rejects(
      () =>
        createCalendarBlock({
          actor: ownerA,
          owner: { kind: "branch", id: branchA },
          startDate: "2026-09-23",
          endDate: "2026-09-23",
          startTime: null,
          endTime: null,
          reason: null,
        }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "BLOCKS_OVERLAP",
    );
  });

  it("permite el mismo día en otra agenda y una franja que no se pisa", async () => {
    const createCalendarBlock = createCreateCalendarBlock(repos());
    await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "branch", id: branchA },
      startDate: "2026-09-23",
      endDate: "2026-09-23",
      startTime: null,
      endTime: null,
      reason: null,
    });
    await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-09-23",
      endDate: "2026-09-23",
      startTime: "10:00",
      endTime: "12:00",
      reason: null,
    });
    const afternoon = await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-09-23",
      endDate: "2026-09-23",
      startTime: "12:00",
      endTime: "14:00",
      reason: null,
    });
    assert.equal(afternoon.length, 1);
  });

  it("no crea el rango si un día ya está bloqueado", async () => {
    const schedule = repos();
    const createCalendarBlock = createCreateCalendarBlock(schedule);
    await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-09-24",
      endDate: "2026-09-24",
      startTime: null,
      endTime: null,
      reason: null,
    });

    await assert.rejects(
      () =>
        createCalendarBlock({
          actor: ownerA,
          owner: { kind: "professional", id: professionalA },
          startDate: "2026-09-23",
          endDate: "2026-09-24",
          startTime: null,
          endTime: null,
          reason: null,
        }),
      (error: unknown) => error instanceof TenantConfigError && error.reason === "BLOCKS_OVERLAP",
    );

    const remaining = await schedule.blocks.listByTenant(tenantA);
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0]?.startDate, "2026-09-24");
  });

  it("quitar un día de un rango no borra los demás", async () => {
    const schedule = repos();
    const createCalendarBlock = createCreateCalendarBlock(schedule);
    const deleteCalendarBlock = createDeleteCalendarBlock(schedule);

    const created = await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-10-10",
      endDate: "2026-10-11",
      startTime: null,
      endTime: null,
      reason: "Vacaciones",
    });

    const friday = created.find((block) => block.startDate === "2026-10-11");
    assert.ok(friday);
    await deleteCalendarBlock({ actor: ownerA, blockId: friday.id });

    const remaining = await schedule.blocks.listByTenant(tenantA);
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0]?.startDate, "2026-10-10");
    assert.equal(remaining[0]?.endDate, "2026-10-10");
  });

  it("no borra un bloqueo de otro tenant", async () => {
    const schedule = repos();
    const createCalendarBlock = createCreateCalendarBlock(schedule);
    const deleteCalendarBlock = createDeleteCalendarBlock(schedule);

    const created = await createCalendarBlock({
      actor: { tenantId: tenantB, role: "OWNER" },
      owner: { kind: "professional", id: professionalB },
      startDate: "2026-01-01",
      endDate: "2026-01-01",
      startTime: null,
      endTime: null,
      reason: null,
    });
    const createdBlock = created[0];
    assert.ok(createdBlock);

    await assert.rejects(
      () =>
        deleteCalendarBlock({
          actor: ownerA,
          blockId: createdBlock.id,
        }),
      (error: unknown) => error instanceof TenantConfigError && error.code === "NOT_FOUND",
    );

    const remaining = await schedule.blocks.listByTenant(tenantB);
    assert.equal(remaining.length, 1);
  });

  it("no crea un bloqueo sobre un profesional de otro negocio", async () => {
    const schedule = repos();
    const createCalendarBlock = createCreateCalendarBlock(schedule);
    await assert.rejects(
      () =>
        createCalendarBlock({
          actor: ownerA,
          owner: { kind: "professional", id: professionalB },
          startDate: "2026-01-02",
          endDate: "2026-01-02",
          startTime: null,
          endTime: null,
          reason: null,
        }),
      (error: unknown) => error instanceof TenantConfigError && error.code === "NOT_FOUND",
    );
    assert.equal((await schedule.blocks.listByTenant(tenantB)).length, 0);
  });

  it("no lista bloqueos de otro negocio", async () => {
    const schedule = repos();
    const created = await createCreateCalendarBlock(schedule)({
      actor: { tenantId: tenantB, role: "OWNER" },
      owner: { kind: "professional", id: professionalB },
      startDate: "2026-01-03",
      endDate: "2026-01-03",
      startTime: null,
      endTime: null,
      reason: null,
    });
    assert.equal(created.length, 1);
    const listed = await createListCalendarBlocks(schedule)(ownerA);
    assert.deepEqual(listed, []);
  });

  it("lista los bloqueos más próximos primero", async () => {
    const schedule = repos();
    const createCalendarBlock = createCreateCalendarBlock(schedule);
    const listCalendarBlocks = createListCalendarBlocks(schedule);

    await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-09-25",
      endDate: "2026-09-25",
      startTime: "18:20",
      endTime: "20:20",
      reason: "tarde",
    });
    await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-09-10",
      endDate: "2026-09-11",
      startTime: null,
      endTime: null,
      reason: "todo el día",
    });
    await createCalendarBlock({
      actor: ownerA,
      owner: { kind: "professional", id: professionalA },
      startDate: "2026-09-12",
      endDate: "2026-09-12",
      startTime: "18:20",
      endTime: "20:20",
      reason: "franja",
    });

    const listed = await listCalendarBlocks(ownerA);

    assert.equal(listed.length, 4);
    assert.deepEqual(
      listed.map((block) => ({ date: block.startDate, reason: block.reason })),
      [
        { date: "2026-09-10", reason: "todo el día" },
        { date: "2026-09-11", reason: "todo el día" },
        { date: "2026-09-12", reason: "franja" },
        { date: "2026-09-25", reason: "tarde" },
      ],
    );
  });
});
