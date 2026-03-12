import { Router } from "express";
import { db, availabilitySlots, providerCompanies } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireProfile } from "../lib/profile.js";

const router = Router();

// GET /api/agenda — list slots
// Admin: all slots with provider name
// Provider: own slots
// Requester: available slots only, no provider identity
router.get("/", async (req, res) => {
  let profile;
  try {
    profile = await requireProfile(req);
  } catch {
    return res.status(401).json({ error: "Perfil não encontrado" });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    if (profile.role === "admin") {
      const slots = await db
        .select({
          id: availabilitySlots.id,
          date: availabilitySlots.date,
          startTime: availabilitySlots.startTime,
          endTime: availabilitySlots.endTime,
          notes: availabilitySlots.notes,
          isBooked: availabilitySlots.isBooked,
          providerCompanyId: availabilitySlots.providerCompanyId,
          providerCompanyName: providerCompanies.name,
          createdAt: availabilitySlots.createdAt,
        })
        .from(availabilitySlots)
        .leftJoin(providerCompanies, eq(availabilitySlots.providerCompanyId, providerCompanies.id))
        .where(gte(availabilitySlots.date, today))
        .orderBy(availabilitySlots.date, availabilitySlots.startTime);
      return res.json(slots);
    }

    if (profile.role === "provider") {
      const slots = await db
        .select()
        .from(availabilitySlots)
        .where(eq(availabilitySlots.providerCompanyId, profile.companyId))
        .orderBy(desc(availabilitySlots.date), availabilitySlots.startTime);
      return res.json(slots.map(s => ({ ...s, providerCompanyName: profile.companyName })));
    }

    // Requester: available slots only, no provider identity
    const slots = await db
      .select({
        id: availabilitySlots.id,
        date: availabilitySlots.date,
        startTime: availabilitySlots.startTime,
        endTime: availabilitySlots.endTime,
        isBooked: availabilitySlots.isBooked,
      })
      .from(availabilitySlots)
      .where(
        and(
          gte(availabilitySlots.date, today),
          eq(availabilitySlots.isBooked, false)
        )
      )
      .orderBy(availabilitySlots.date, availabilitySlots.startTime);

    return res.json(slots);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to list agenda" });
  }
});

// POST /api/agenda — provider creates slot
router.post("/", async (req, res) => {
  let profile;
  try {
    profile = await requireProfile(req);
  } catch {
    return res.status(401).json({ error: "Perfil não encontrado" });
  }

  if (profile.role !== "provider") {
    return res.status(403).json({ error: "Apenas prestadores podem criar disponibilidades" });
  }

  const { date, startTime, endTime, notes } = req.body;
  if (!date || !startTime || !endTime) {
    return res.status(400).json({ error: "date, startTime e endTime são obrigatórios" });
  }

  try {
    const slot = await db
      .insert(availabilitySlots)
      .values({
        id: randomUUID(),
        providerCompanyId: profile.companyId,
        date,
        startTime,
        endTime,
        notes: notes || null,
        isBooked: false,
      })
      .returning();

    return res.status(201).json({ ...slot[0], providerCompanyName: profile.companyName });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to create slot" });
  }
});

// DELETE /api/agenda/:id — provider or admin deletes slot
router.delete("/:id", async (req, res) => {
  let profile;
  try {
    profile = await requireProfile(req);
  } catch {
    return res.status(401).json({ error: "Perfil não encontrado" });
  }

  if (profile.role === "requester") {
    return res.status(403).json({ error: "Contratantes não podem excluir slots" });
  }

  const { id } = req.params;

  try {
    const existing = await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.id, id));

    if (!existing.length) return res.status(404).json({ error: "Slot não encontrado" });

    if (profile.role === "provider" && existing[0].providerCompanyId !== profile.companyId) {
      return res.status(403).json({ error: "Sem permissão para excluir este slot" });
    }

    await db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to delete slot" });
  }
});

export default router;
