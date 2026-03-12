import { Router } from "express";
import { db } from "@workspace/db";
import {
  workOrders,
  workOrderStatusHistory,
  invoices,
  payments,
  paymentInvoices,
  payouts,
  payoutWorkOrders,
  commissionLedger,
  commissionSettings,
  travelPricingRules,
  requesterCompanies,
  providerCompanies,
  serviceCatalogItems,
  mockProfiles,
  notifications,
} from "@workspace/db/schema";
import { eq, and, desc, sum, inArray } from "drizzle-orm";
import { requireRole } from "../lib/profile.js";
import { generateId } from "../lib/id.js";
import { computePricing } from "../lib/travel.js";

const router = Router();

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  await requireRole(req, "admin");

  const allOrders = await db.select().from(workOrders).orderBy(desc(workOrders.createdAt));

  const totalWorkOrders = allOrders.length;
  const openWorkOrders = allOrders.filter((o) => ["requested", "accepted", "in_progress"].includes(o.status)).length;
  const completedWorkOrders = allOrders.filter((o) => ["completed", "invoiced", "paid", "paid_out", "closed"].includes(o.status)).length;

  const allInvoices = await db.select().from(invoices);
  const allPayments = await db.select().from(payments);
  const allPayouts = await db.select().from(payouts);

  const totalBilled = allInvoices.reduce((sum, i) => sum + parseFloat(i.finalPrice as string), 0);
  const totalReceived = allPayments.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);
  const totalPayedOut = allPayouts.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);

  const allCommission = await db.select().from(commissionLedger);
  const totalCommission = allCommission.reduce((sum, c) => sum + parseFloat(c.amount as string), 0);

  const pendingInvoices = allInvoices.filter((i) => i.status === "pending");
  const pendingPayments = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.finalPrice as string), 0);

  const paidWorkOrderIds = new Set<string>();
  const allPayoutWOs = await db.select().from(payoutWorkOrders);
  allPayoutWOs.forEach((p) => paidWorkOrderIds.add(p.workOrderId));

  const pendingPayoutOrders = allOrders.filter((o) => o.status === "paid" && !paidWorkOrderIds.has(o.id));
  const pendingPayouts = pendingPayoutOrders.reduce((sum, o) => sum + parseFloat((o.providerReceivable ?? "0") as string), 0);

  const recentWithCompanies = await Promise.all(allOrders.slice(0, 10).map(async (o) => enrichWorkOrderAdmin(o)));

  res.json({
    totalWorkOrders,
    openWorkOrders,
    completedWorkOrders,
    totalBilled,
    totalReceived,
    totalPayedOut,
    totalCommission,
    pendingPayments,
    pendingPayouts,
    recentWorkOrders: recentWithCompanies,
  });
});

// ─── Companies ────────────────────────────────────────────────────────────────
router.get("/requester-companies", async (req, res) => {
  await requireRole(req, "admin");
  const companies = await db.select().from(requesterCompanies).orderBy(desc(requesterCompanies.createdAt));
  res.json(companies);
});

router.post("/requester-companies", async (req, res) => {
  await requireRole(req, "admin");
  const { name, taxId, email, phone, address, cep, city, state } = req.body;
  const id = generateId();
  await db.insert(requesterCompanies).values({ id, name, taxId, email, phone, address, cep, city, state });
  const [company] = await db.select().from(requesterCompanies).where(eq(requesterCompanies.id, id));
  res.status(201).json(company);
});

router.get("/provider-companies", async (req, res) => {
  await requireRole(req, "admin");
  const companies = await db.select().from(providerCompanies).orderBy(desc(providerCompanies.createdAt));
  res.json(companies.map((c) => ({ ...c, commissionRate: c.commissionRate ? parseFloat(c.commissionRate as string) : null })));
});

router.post("/provider-companies", async (req, res) => {
  await requireRole(req, "admin");
  const { name, taxId, email, phone, address, cep, city, state, commissionRate } = req.body;
  const id = generateId();
  await db.insert(providerCompanies).values({ id, name, taxId, email, phone, address, cep, city, state, commissionRate: commissionRate ? String(commissionRate) : null });
  const [company] = await db.select().from(providerCompanies).where(eq(providerCompanies.id, id));
  res.status(201).json({ ...company, commissionRate: company.commissionRate ? parseFloat(company.commissionRate as string) : null });
});

// ─── Work Orders ──────────────────────────────────────────────────────────────
router.get("/work-orders", async (req, res) => {
  await requireRole(req, "admin");

  let allOrders = await db.select().from(workOrders).orderBy(desc(workOrders.createdAt));

  if (req.query.status) allOrders = allOrders.filter((o) => o.status === req.query.status);
  if (req.query.requesterId) allOrders = allOrders.filter((o) => o.requesterCompanyId === req.query.requesterId);
  if (req.query.providerId) allOrders = allOrders.filter((o) => o.providerCompanyId === req.query.providerId);

  const enriched = await Promise.all(allOrders.map((o) => enrichWorkOrderAdmin(o)));
  res.json(enriched);
});

router.get("/work-orders/:id", async (req, res) => {
  await requireRole(req, "admin");

  const [order] = await db.select().from(workOrders).where(eq(workOrders.id, req.params.id));
  if (!order) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const history = await db
    .select()
    .from(workOrderStatusHistory)
    .where(eq(workOrderStatusHistory.workOrderId, order.id))
    .orderBy(desc(workOrderStatusHistory.changedAt));

  const enriched = await enrichWorkOrderAdmin(order);
  res.json({ ...enriched, statusHistory: history });
});

router.post("/work-orders/:id/assign", async (req, res) => {
  const profile = await requireRole(req, "admin");
  const { providerCompanyId, catalogItemId } = req.body;

  const [order] = await db.select().from(workOrders).where(eq(workOrders.id, req.params.id));
  if (!order) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [provider] = await db.select().from(providerCompanies).where(eq(providerCompanies.id, providerCompanyId));
  const [catalogItem] = await db.select().from(serviceCatalogItems).where(eq(serviceCatalogItems.id, catalogItemId));

  if (!provider || !catalogItem) {
    res.status(400).json({ error: "Provider or catalog item not found" });
    return;
  }

  const basePrice = parseFloat(catalogItem.basePrice as string);
  const travelCost = parseFloat((order.travelCost ?? "0") as string);

  const [settings] = await db.select().from(commissionSettings).limit(1);
  const commissionRate = settings ? parseFloat(settings.defaultRate as string) : 15;

  const pricing = computePricing(basePrice, travelCost, commissionRate);

  await db
    .update(workOrders)
    .set({
      providerCompanyId,
      serviceCatalogItemId: catalogItemId,
      serviceName: catalogItem.name,
      category: catalogItem.category,
      basePrice: String(basePrice),
      commissionAmount: String(pricing.commissionAmount),
      finalPrice: String(pricing.finalPrice),
      providerReceivable: String(pricing.providerReceivable),
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, order.id));

  await db.insert(workOrderStatusHistory).values({
    id: generateId(),
    workOrderId: order.id,
    status: order.status,
    note: `Prestador atribuído: ${provider.name}`,
    changedBy: profile.name,
  });

  const [updated] = await db.select().from(workOrders).where(eq(workOrders.id, order.id));
  res.json(await enrichWorkOrderAdmin(updated));
});

router.post("/work-orders/:id/adjust", async (req, res) => {
  const profile = await requireRole(req, "admin");
  const { action, notes, newStatus } = req.body;

  const [order] = await db.select().from(workOrders).where(eq(workOrders.id, req.params.id));
  if (!order) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const statusMap: Record<string, string> = {
    cancel: "cancelled",
    reopen: "requested",
    correct: newStatus || order.status,
  };

  const targetStatus = statusMap[action];
  if (!targetStatus) {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  await db.update(workOrders).set({ status: targetStatus, updatedAt: new Date() }).where(eq(workOrders.id, order.id));

  await db.insert(workOrderStatusHistory).values({
    id: generateId(),
    workOrderId: order.id,
    status: targetStatus,
    note: notes || `Admin action: ${action}`,
    changedBy: profile.name,
  });

  const [updated] = await db.select().from(workOrders).where(eq(workOrders.id, order.id));
  res.json(await enrichWorkOrderAdmin(updated));
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
router.get("/invoices", async (req, res) => {
  await requireRole(req, "admin");

  let allInvoices = await db.select().from(invoices).orderBy(desc(invoices.generatedAt));
  if (req.query.status) allInvoices = allInvoices.filter((i) => i.status === req.query.status);

  const result = await Promise.all(
    allInvoices.map(async (inv) => {
      const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, inv.workOrderId));
      const [req_co] = await db.select().from(requesterCompanies).where(eq(requesterCompanies.id, inv.requesterCompanyId));
      const [prov_co] = await db.select().from(providerCompanies).where(eq(providerCompanies.id, inv.providerCompanyId));
      return {
        id: inv.id,
        workOrderId: inv.workOrderId,
        requesterCompanyName: req_co?.name ?? "N/A",
        providerCompanyName: prov_co?.name ?? "N/A",
        serviceName: wo?.serviceName ?? "N/A",
        basePrice: parseFloat(inv.basePrice as string),
        travelCost: parseFloat(inv.travelCost as string),
        commissionAmount: parseFloat(inv.commissionAmount as string),
        finalPrice: parseFloat(inv.finalPrice as string),
        providerReceivable: parseFloat(inv.providerReceivable as string),
        status: inv.status,
        generatedAt: inv.generatedAt,
        paidAt: inv.paidAt,
      };
    })
  );

  res.json(result);
});

// ─── Payments ─────────────────────────────────────────────────────────────────
router.get("/payments", async (req, res) => {
  await requireRole(req, "admin");

  const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));

  const result = await Promise.all(
    allPayments.map(async (payment) => {
      const [company] = await db.select().from(requesterCompanies).where(eq(requesterCompanies.id, payment.requesterCompanyId));
      const piLinks = await db.select().from(paymentInvoices).where(eq(paymentInvoices.paymentId, payment.id));
      return {
        id: payment.id,
        requesterCompanyId: payment.requesterCompanyId,
        requesterCompanyName: company?.name ?? "N/A",
        amount: parseFloat(payment.amount as string),
        paymentMethod: payment.paymentMethod,
        invoiceIds: piLinks.map((p) => p.invoiceId),
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      };
    })
  );

  res.json(result);
});

// ─── Payouts ──────────────────────────────────────────────────────────────────
router.get("/payouts", async (req, res) => {
  await requireRole(req, "admin");

  const allPayouts = await db.select().from(payouts).orderBy(desc(payouts.createdAt));

  const result = await Promise.all(
    allPayouts.map(async (payout) => {
      const [company] = await db.select().from(providerCompanies).where(eq(providerCompanies.id, payout.providerCompanyId));
      const woLinks = await db.select().from(payoutWorkOrders).where(eq(payoutWorkOrders.payoutId, payout.id));
      return {
        id: payout.id,
        providerCompanyId: payout.providerCompanyId,
        providerCompanyName: company?.name ?? "N/A",
        amount: parseFloat(payout.amount as string),
        workOrderIds: woLinks.map((w) => w.workOrderId),
        notes: payout.notes,
        paidAt: payout.paidAt,
        createdAt: payout.createdAt,
      };
    })
  );

  res.json(result);
});

router.post("/payouts", async (req, res) => {
  const profile = await requireRole(req, "admin");
  const { providerCompanyId, workOrderIds, amount, notes } = req.body;

  const payoutId = generateId();
  const now = new Date();

  await db.insert(payouts).values({
    id: payoutId,
    providerCompanyId,
    amount: String(amount),
    notes: notes || null,
    paidAt: now,
  });

  for (const woId of workOrderIds) {
    await db.insert(payoutWorkOrders).values({ id: generateId(), payoutId, workOrderId: woId });
    await db.update(workOrders).set({ status: "paid_out", updatedAt: now }).where(eq(workOrders.id, woId));
    await db.insert(workOrderStatusHistory).values({
      id: generateId(),
      workOrderId: woId,
      status: "paid_out",
      note: `Repasse registrado pelo admin. ${notes || ""}`,
      changedBy: profile.name,
    });
  }

  const [company] = await db.select().from(providerCompanies).where(eq(providerCompanies.id, providerCompanyId));
  res.status(201).json({
    id: payoutId,
    providerCompanyId,
    providerCompanyName: company?.name ?? "N/A",
    amount,
    workOrderIds,
    notes,
    paidAt: now,
    createdAt: now,
  });
});

// ─── Travel Pricing ───────────────────────────────────────────────────────────
router.get("/travel-pricing", async (req, res) => {
  await requireRole(req, "admin");
  const rules = await db.select().from(travelPricingRules).orderBy(desc(travelPricingRules.createdAt));
  res.json(rules.map((r) => ({ ...r, price: parseFloat(r.price as string), isActive: r.isActive === "true" })));
});

router.post("/travel-pricing", async (req, res) => {
  await requireRole(req, "admin");
  const { name, ruleType, matchValue, price, description, isActive } = req.body;
  const id = generateId();
  await db.insert(travelPricingRules).values({
    id,
    name,
    ruleType,
    matchValue,
    price: String(price),
    description,
    isActive: isActive !== false ? "true" : "false",
  });
  const [rule] = await db.select().from(travelPricingRules).where(eq(travelPricingRules.id, id));
  res.status(201).json({ ...rule, price: parseFloat(rule.price as string), isActive: rule.isActive === "true" });
});

router.put("/travel-pricing/:id", async (req, res) => {
  await requireRole(req, "admin");
  const { name, ruleType, matchValue, price, description, isActive } = req.body;
  await db
    .update(travelPricingRules)
    .set({ name, ruleType, matchValue, price: String(price), description, isActive: isActive !== false ? "true" : "false" })
    .where(eq(travelPricingRules.id, req.params.id));
  const [rule] = await db.select().from(travelPricingRules).where(eq(travelPricingRules.id, req.params.id));
  res.json({ ...rule, price: parseFloat(rule.price as string), isActive: rule.isActive === "true" });
});

router.delete("/travel-pricing/:id", async (req, res) => {
  await requireRole(req, "admin");
  await db.delete(travelPricingRules).where(eq(travelPricingRules.id, req.params.id));
  res.status(204).send();
});

// ─── Commission Settings ──────────────────────────────────────────────────────
router.get("/commission-settings", async (req, res) => {
  await requireRole(req, "admin");
  const [setting] = await db.select().from(commissionSettings).limit(1);
  if (!setting) {
    res.json({ defaultRate: 15, updatedAt: new Date() });
    return;
  }
  res.json({ defaultRate: parseFloat(setting.defaultRate as string), updatedAt: setting.updatedAt });
});

router.put("/commission-settings", async (req, res) => {
  await requireRole(req, "admin");
  const { defaultRate } = req.body;
  const [existing] = await db.select().from(commissionSettings).limit(1);
  const now = new Date();

  if (existing) {
    await db.update(commissionSettings).set({ defaultRate: String(defaultRate), updatedAt: now }).where(eq(commissionSettings.id, "default"));
  } else {
    await db.insert(commissionSettings).values({ id: "default", defaultRate: String(defaultRate), updatedAt: now });
  }

  res.json({ defaultRate, updatedAt: now });
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
router.get("/audit-log", async (req, res) => {
  await requireRole(req, "admin");

  let history = await db.select().from(workOrderStatusHistory).orderBy(desc(workOrderStatusHistory.changedAt));

  if (req.query.workOrderId) {
    history = history.filter((h) => h.workOrderId === req.query.workOrderId);
  }

  res.json(
    history.map((h) => ({
      id: h.id,
      entityType: "WorkOrder",
      entityId: h.workOrderId,
      action: h.status,
      actor: h.changedBy,
      details: h.note,
      createdAt: h.changedAt,
    }))
  );
});

async function enrichWorkOrderAdmin(o: any) {
  const [req_co] = o.requesterCompanyId
    ? await db.select().from(requesterCompanies).where(eq(requesterCompanies.id, o.requesterCompanyId))
    : [null];
  const [prov_co] = o.providerCompanyId
    ? await db.select().from(providerCompanies).where(eq(providerCompanies.id, o.providerCompanyId))
    : [null];

  return {
    id: o.id,
    requesterCompanyId: o.requesterCompanyId,
    requesterCompanyName: req_co?.name ?? "N/A",
    providerCompanyId: o.providerCompanyId,
    providerCompanyName: prov_co?.name ?? "N/A",
    serviceCatalogItemId: o.serviceCatalogItemId,
    serviceName: o.serviceName,
    category: o.category,
    location: o.location,
    description: o.description,
    notes: o.notes,
    status: o.status,
    requestedAt: o.requestedAt,
    completedAt: o.completedAt,
    basePrice: o.basePrice ? parseFloat(o.basePrice as string) : null,
    travelCost: o.travelCost ? parseFloat(o.travelCost as string) : 0,
    commissionAmount: o.commissionAmount ? parseFloat(o.commissionAmount as string) : 0,
    finalPrice: o.finalPrice ? parseFloat(o.finalPrice as string) : null,
    providerReceivable: o.providerReceivable ? parseFloat(o.providerReceivable as string) : null,
    invoiceId: null,
  };
}

export default router;
