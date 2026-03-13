import { Router } from "express";
import { db } from "@workspace/db";
import {
  workOrders,
  workOrderStatusHistory,
  serviceCatalogItems,
  invoices,
  payouts,
  payoutWorkOrders,
  commissionSettings,
} from "@workspace/db/schema";
import { eq, and, desc, inArray, isNull } from "drizzle-orm";
import { requireRole } from "../lib/profile.js";
import { generateId } from "../lib/id.js";
import { getCommissionRate } from "../lib/travel.js";

const router = Router();

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  const profile = await requireRole(req, "provider");

  const orders = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.providerCompanyId, profile.companyId))
    .orderBy(desc(workOrders.createdAt));

  const newOrders = orders.filter((o) => o.status === "requested").length;
  const inProgress = orders.filter((o) => o.status === "accepted" || o.status === "in_progress").length;
  const completed = orders.filter((o) => ["completed", "invoiced", "paid", "paid_out", "closed"].includes(o.status)).length;

  const payoutRecords = await db
    .select()
    .from(payouts)
    .where(eq(payouts.providerCompanyId, profile.companyId));

  const totalReceived = payoutRecords.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);

  const unpaidOrders = orders.filter((o) => ["completed", "invoiced", "paid"].includes(o.status));
  const totalReceivable = unpaidOrders.reduce((sum, o) => sum + parseFloat((o.providerReceivable ?? "0") as string), 0);

  res.json({
    newOrders,
    inProgress,
    completed,
    totalReceivable,
    totalReceived,
    recentWorkOrders: orders.slice(0, 5).map(formatWorkOrderForProvider),
  });
});

// ─── Catalog ─────────────────────────────────────────────────────────────────
router.get("/catalog", async (req, res) => {
  const profile = await requireRole(req, "provider");

  const items = await db
    .select()
    .from(serviceCatalogItems)
    .where(eq(serviceCatalogItems.providerCompanyId, profile.companyId))
    .orderBy(desc(serviceCatalogItems.createdAt));

  res.json(items.map(formatCatalogItem));
});

router.post("/catalog", async (req, res) => {
  const profile = await requireRole(req, "provider");
  const { name, description, category, estimatedDays, basePrice, isAvailable, regions } = req.body;

  const id = generateId();
  await db.insert(serviceCatalogItems).values({
    id,
    providerCompanyId: profile.companyId,
    name,
    description,
    category,
    estimatedDays: estimatedDays || null,
    basePrice: String(basePrice),
    isAvailable: isAvailable !== false,
    regions: regions || [],
  });

  const [item] = await db.select().from(serviceCatalogItems).where(eq(serviceCatalogItems.id, id));
  res.status(201).json(formatCatalogItem(item));
});

router.put("/catalog/:id", async (req, res) => {
  const profile = await requireRole(req, "provider");
  const { name, description, category, estimatedDays, basePrice, isAvailable, regions } = req.body;

  const [existing] = await db
    .select()
    .from(serviceCatalogItems)
    .where(and(eq(serviceCatalogItems.id, req.params.id), eq(serviceCatalogItems.providerCompanyId, profile.companyId)));

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db
    .update(serviceCatalogItems)
    .set({ name, description, category, estimatedDays, basePrice: String(basePrice), isAvailable, regions, updatedAt: new Date() })
    .where(eq(serviceCatalogItems.id, req.params.id));

  const [updated] = await db.select().from(serviceCatalogItems).where(eq(serviceCatalogItems.id, req.params.id));
  res.json(formatCatalogItem(updated));
});

router.delete("/catalog/:id", async (req, res) => {
  const profile = await requireRole(req, "provider");

  const [existing] = await db
    .select()
    .from(serviceCatalogItems)
    .where(and(eq(serviceCatalogItems.id, req.params.id), eq(serviceCatalogItems.providerCompanyId, profile.companyId)));

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(serviceCatalogItems).where(eq(serviceCatalogItems.id, req.params.id));
  res.status(204).send();
});

// ─── Work Orders ──────────────────────────────────────────────────────────────

// GET /work-orders?available=true — unassigned "open pool" orders (Uber model)
// GET /work-orders             — orders assigned to THIS provider
router.get("/work-orders", async (req, res) => {
  const profile = await requireRole(req, "provider");

  if (req.query.available === "true") {
    // Return unassigned requested orders visible to all providers
    const orders = await db
      .select()
      .from(workOrders)
      .where(and(isNull(workOrders.providerCompanyId), eq(workOrders.status, "requested")))
      .orderBy(desc(workOrders.createdAt));
    res.json(orders.map(formatWorkOrderForProvider));
    return;
  }

  const orders = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.providerCompanyId, profile.companyId))
    .orderBy(desc(workOrders.createdAt));

  let filtered = orders;
  if (req.query.status) filtered = filtered.filter((o) => o.status === req.query.status);

  res.json(filtered.map(formatWorkOrderForProvider));
});

router.get("/work-orders/:id", async (req, res) => {
  const profile = await requireRole(req, "provider");

  // Allow viewing if: assigned to this provider, OR unassigned (open pool)
  const [order] = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.id, req.params.id));

  if (
    !order ||
    (order.providerCompanyId !== null && order.providerCompanyId !== profile.companyId)
  ) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const history = await db
    .select()
    .from(workOrderStatusHistory)
    .where(eq(workOrderStatusHistory.workOrderId, order.id))
    .orderBy(desc(workOrderStatusHistory.changedAt));

  res.json({ ...formatWorkOrderForProvider(order), statusHistory: history });
});

router.post("/work-orders/:id/action", async (req, res) => {
  const profile = await requireRole(req, "provider");
  const { action, notes } = req.body;

  // Fetch the order — allow unassigned (pool) OR assigned to this provider
  const [order] = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.id, req.params.id));

  if (
    !order ||
    (order.providerCompanyId !== null && order.providerCompanyId !== profile.companyId)
  ) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const validTransitions: Record<string, string> = {
    accept: "accepted",
    start: "in_progress",
    complete: "completed",
  };

  const newStatus = validTransitions[action];
  if (!newStatus) {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  const now = new Date();

  // ── Uber-style claim: accept an unassigned order atomically ──────────────
  if (action === "accept" && order.providerCompanyId === null) {
    // Atomic update: only succeeds if STILL unassigned (race condition guard)
    await db
      .update(workOrders)
      .set({ providerCompanyId: profile.companyId, status: "accepted", updatedAt: now })
      .where(and(eq(workOrders.id, order.id), isNull(workOrders.providerCompanyId), eq(workOrders.status, "requested")));

    // Verify we actually got it (someone else may have claimed it first)
    const [claimed] = await db.select().from(workOrders).where(eq(workOrders.id, order.id));
    if (claimed.providerCompanyId !== profile.companyId) {
      res.status(409).json({ error: "This job was just claimed by another provider. Please refresh." });
      return;
    }

    await db.insert(workOrderStatusHistory).values({
      id: generateId(),
      workOrderId: order.id,
      status: "accepted",
      note: notes || "Job claimed and accepted by provider",
      changedBy: profile.name,
    });

    const history = await db
      .select()
      .from(workOrderStatusHistory)
      .where(eq(workOrderStatusHistory.workOrderId, order.id))
      .orderBy(desc(workOrderStatusHistory.changedAt));

    res.json({ ...formatWorkOrderForProvider(claimed), statusHistory: history });
    return;
  }

  const updates: any = { status: newStatus, updatedAt: now };
  if (action === "complete") updates.completedAt = now;

  await db.update(workOrders).set(updates).where(eq(workOrders.id, order.id));

  await db.insert(workOrderStatusHistory).values({
    id: generateId(),
    workOrderId: order.id,
    status: newStatus,
    note: notes || `Serviço ${action === "accept" ? "aceito" : action === "start" ? "iniciado" : "concluído"} pelo prestador`,
    changedBy: profile.name,
  });

  // If completed, generate invoice
  if (action === "complete" && order.basePrice) {
    const invoiceId = generateId();
    await db.insert(invoices).values({
      id: invoiceId,
      workOrderId: order.id,
      requesterCompanyId: order.requesterCompanyId,
      providerCompanyId: profile.companyId,
      basePrice: order.basePrice,
      travelCost: order.travelCost ?? "0",
      commissionAmount: order.commissionAmount ?? "0",
      finalPrice: order.finalPrice ?? order.basePrice,
      providerReceivable: order.providerReceivable ?? order.basePrice,
      status: "pending",
    });

    await db.update(workOrders).set({ status: "invoiced", updatedAt: now }).where(eq(workOrders.id, order.id));
    await db.insert(workOrderStatusHistory).values({
      id: generateId(),
      workOrderId: order.id,
      status: "invoiced",
      note: "Fatura gerada automaticamente",
      changedBy: "Sistema",
    });
  }

  const [updated] = await db.select().from(workOrders).where(eq(workOrders.id, order.id));
  const history = await db
    .select()
    .from(workOrderStatusHistory)
    .where(eq(workOrderStatusHistory.workOrderId, order.id))
    .orderBy(desc(workOrderStatusHistory.changedAt));

  res.json({ ...formatWorkOrderForProvider(updated), statusHistory: history });
});

// ─── Financial ────────────────────────────────────────────────────────────────
router.get("/financial", async (req, res) => {
  const profile = await requireRole(req, "provider");

  const orders = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.providerCompanyId, profile.companyId));

  const payoutRecords = await db.select().from(payouts).where(eq(payouts.providerCompanyId, profile.companyId));

  const paidOutIds = new Set<string>();
  for (const payout of payoutRecords) {
    const pwos = await db.select().from(payoutWorkOrders).where(eq(payoutWorkOrders.payoutId, payout.id));
    pwos.forEach((p) => paidOutIds.add(p.workOrderId));
  }

  const totalReceived = payoutRecords.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);
  const pendingOrders = orders.filter((o) => ["completed", "invoiced", "paid"].includes(o.status) && !paidOutIds.has(o.id));
  const totalReceivable = pendingOrders.reduce((sum, o) => sum + parseFloat((o.providerReceivable ?? "0") as string), 0);
  const totalTravelCost = orders.reduce((sum, o) => sum + parseFloat((o.travelCost ?? "0") as string), 0);

  const payoutsWithWOs = await Promise.all(
    payoutRecords.map(async (p) => {
      const pwos = await db.select().from(payoutWorkOrders).where(eq(payoutWorkOrders.payoutId, p.id));
      return {
        id: p.id,
        providerCompanyId: p.providerCompanyId,
        providerCompanyName: profile.companyName,
        amount: parseFloat(p.amount as string),
        workOrderIds: pwos.map((pw) => pw.workOrderId),
        notes: p.notes,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      };
    })
  );

  res.json({
    totalReceivable,
    totalReceived,
    totalTravelCost,
    pendingWorkOrders: pendingOrders.map(formatWorkOrderForProvider),
    payouts: payoutsWithWOs,
  });
});

function formatWorkOrderForProvider(o: any) {
  return {
    id: o.id,
    serviceName: o.serviceName,
    category: o.category,
    location: o.location,
    cep: o.cep,
    description: o.description,
    notes: o.notes,
    status: o.status,
    providerCompanyId: o.providerCompanyId ?? null,
    requestedAt: o.requestedAt,
    completedAt: o.completedAt,
    basePrice: o.basePrice ? parseFloat(o.basePrice as string) : null,
    travelCost: o.travelCost ? parseFloat(o.travelCost as string) : 0,
    providerReceivable: o.providerReceivable ? parseFloat(o.providerReceivable as string) : null,
  };
}

function formatCatalogItem(item: any) {
  return {
    id: item.id,
    providerCompanyId: item.providerCompanyId,
    providerCompanyName: "",
    name: item.name,
    description: item.description,
    category: item.category,
    estimatedDays: item.estimatedDays,
    basePrice: parseFloat(item.basePrice as string),
    isAvailable: item.isAvailable,
    regions: item.regions || [],
    createdAt: item.createdAt,
  };
}

export default router;
