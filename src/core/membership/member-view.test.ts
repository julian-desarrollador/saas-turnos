import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inviteToastMessage, membershipRoleBlurb } from "@/core/membership/components/member-view";

describe("member view", () => {
  it("explica dueño y administrador igual, y al resto como quien da turnos", () => {
    const admin = "Puede cambiar equipo, servicios y horarios, e invitar a otras personas.";
    const staff = "Puede dar turnos y atender clientes. No cambia el catálogo ni invita.";

    assert.equal(membershipRoleBlurb("OWNER"), admin);
    assert.equal(membershipRoleBlurb("ADMIN"), admin);
    assert.equal(membershipRoleBlurb("PROFESSIONAL"), staff);
    assert.equal(membershipRoleBlurb("RECEPTION"), staff);
  });

  it("confirma el envío con el correo", () => {
    assert.equal(inviteToastMessage("ana@correo.com"), "Invitación enviada · ana@correo.com");
    assert.equal(inviteToastMessage("  "), "Invitación enviada");
  });
});
