import { Router } from "express";
import { db } from "@workspace/db";
import {
  workOrders,
  workOrderStatusHistory,
  serviceCatalogItems,
  invoices,
  payments,
  paymentInvoices,
  requesterCompanies,
  providerCompanies,
} from "@workspace/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireRole } from "../lib/profile.js";
import { generateId } from "../lib/id.js";
import { calculateTravelCost, getCommissionRate, computePricing } from "../lib/travel.js";
import { notifyAll } from "../lib/notify.js";

const router = Router();

// ─── Dashboard ──────────────────────────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  const profile = await requireRole(req, "requester");
  const companyId = profile.companyId;

  const orders = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.requesterCompanyId, companyId))
    .orderBy(desc(workOrders.createdAt));

  const openRequests = orders.filter((o) => o.status === "requested").length;
  const inProgress = orders.filter((o) => o.status === "accepted" || o.status === "in_progress").length;
  const completed = orders.filter((o) => ["completed", "invoiced", "paid", "paid_out", "closed"].includes(o.status)).length;
  const invoiced = orders.filter((o) => o.status === "invoiced").length;
  const pendingPayment = orders.filter((o) => o.status === "invoiced").length;

  const pendingInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.requesterCompanyId, companyId), eq(invoices.status, "pending")));

  const totalPendingAmount = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.finalPrice as string), 0);

  const recentOrders = orders.slice(0, 5).map(formatWorkOrderForRequester);

  res.json({
    openRequests,
    inProgress,
    completed,
    invoiced,
    pendingPayment,
    totalPendingAmount,
    recentWorkOrders: recentOrders,
  });
});

// ─── Work Orders ─────────────────────────────────────────────────────────────
router.get("/work-orders", async (req, res) => {
  const profile = await requireRole(req, "requester");
  let query = db.select().from(workOrders).where(eq(workOrders.requesterCompanyId, profile.companyId)).$dynamic();

  const orders = await db
    .select()
    .from(workOrders)
    .where(eq(workOrders.requesterCompanyId, profile.companyId))
    .orderBy(desc(workOrders.createdAt));

  let filtered = orders;
  if (req.query.status) filtered = filtered.filter((o) => o.status === req.query.status);
  if (req.query.category) filtered = filtered.filter((o) => o.category === req.query.category);
  if (req.query.location) filtered = filtered.filter((o) => o.location.toLowerCase().includes((req.query.location as string).toLowerCase()));

  res.json(filtered.map(formatWorkOrderForRequester));
});

router.post("/work-orders", async (req, res) => {
  const profile = await requireRole(req, "requester");
  const { catalogItemId, location, description, notes, cep } = req.body;

  let serviceName = "Serviço solicitado";
  let category = "Geral";
  let basePrice: number | null = null;

  if (catalogItemId) {
    const [item] = await db.select().from(serviceCatalogItems).where(eq(serviceCatalogItems.id, catalogItemId));
    if (item) {
      serviceName = item.name;
      category = item.category;
      basePrice = parseFloat(item.basePrice as string);
    }
  }

  const travelCost = await calculateTravelCost(cep);
  const commissionRate = await getCommissionRate();

  let finalPrice: number | null = null;
  let commissionAmount = 0;
  let providerReceivable: number | null = null;

  if (basePrice !== null) {
    const pricing = computePricing(basePrice, travelCost, commissionRate);
    finalPrice = pricing.finalPrice;
    commissionAmount = pricing.commissionAmount;
    providerReceivable = pricing.providerReceivable;
  }

  const id = generateId();
  await db.insert(workOrders).values({
    id,
    requesterCompanyId: profile.companyId,
    serviceCatalogItemId: catalogItemId || null,
    serviceName,
    category,
    location,
    description,
    notes: notes || null,
    cep: cep || null,
    status: "requested",
    basePrice: basePrice ? String(basePrice) : null,
    travelCost: String(travelCost),
    commissionAmount: String(commissionAmount),
    finalPrice: finalPrice ? String(finalPrice) : null,
    providerReceivable: providerReceivable ? String(providerReceivable) : null,
  });

  await db.insert(workOrderStatusHistory).values({
    id: generateId(),
    workOrderId: id,
    status: "requested",
    note: "Serviço solicitado",
    changedBy: profile.name,
  });

  // Notify admin
  const adminProfiles = await db.query.mockProfiles?.findMany?.() ?? [];

  res.status(201).json({ id, serviceName, status: "requested", requestedAt: new Date() });
});

router.get("/work-orders/:id", async (req, res) => {
  const profile = await requireRole(req, "requester");
  const [order] = await db
    .select()
    .from(workOrders)
    .where(and(eq(workOrders.id, req.params.id), eq(workOrders.requesterCompanyId, profile.companyId)));

  if (!order) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const history = await db
    .select()
    .from(workOrderStatusHistory)
    .where(eq(workOrderStatusHistory.workOrderId, order.id))
    .orderBy(desc(workOrderStatusHistory.changedAt));

  res.json({ ...formatWorkOrderForRequester(order), statusHistory: history });
});

// ─── Invoices ────────────────────────────────────────────────────────────────
router.get("/invoices", async (req, res) => {
  const profile = await requireRole(req, "requester");

  const allInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.requesterCompanyId, profile.companyId))
    .orderBy(desc(invoices.generatedAt));

  let filtered = allInvoices;
  if (req.query.status) filtered = filtered.filter((i) => i.status === req.query.status);

  const result = await Promise.all(
    filtered.map(async (inv) => {
      const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, inv.workOrderId));
      return {
        id: inv.id,
        workOrderId: inv.workOrderId,
        serviceName: wo?.serviceName ?? "N/A",
        location: wo?.location ?? "N/A",
        finalPrice: parseFloat(inv.finalPrice as string),
        status: inv.status,
        generatedAt: inv.generatedAt,
        paidAt: inv.paidAt,
      };
    })
  );

  res.json(result);
});

router.post("/invoices/pay", async (req, res) => {
  const profile = await requireRole(req, "requester");
  const { invoiceIds, paymentMethod } = req.body;

  if (!invoiceIds?.length) {
    res.status(400).json({ error: "No invoices selected" });
    return;
  }

  const selectedInvoices = await db
    .select()
    .from(invoices)
    .where(and(inArray(invoices.id, invoiceIds), eq(invoices.requesterCompanyId, profile.companyId), eq(invoices.status, "pending")));

  if (!selectedInvoices.length) {
    res.status(400).json({ error: "No eligible invoices found" });
    return;
  }

  const total = selectedInvoices.reduce((sum, i) => sum + parseFloat(i.finalPrice as string), 0);
  const now = new Date();
  const paymentId = generateId();

  await db.insert(payments).values({
    id: paymentId,
    requesterCompanyId: profile.companyId,
    amount: String(total),
    paymentMethod,
    paidAt: now,
  });

  for (const inv of selectedInvoices) {
    await db.insert(paymentInvoices).values({ id: generateId(), paymentId, invoiceId: inv.id });
    await db.update(invoices).set({ status: "paid", paidAt: now }).where(eq(invoices.id, inv.id));

    const [wo] = await db.select().from(workOrders).where(eq(workOrders.id, inv.workOrderId));
    if (wo) {
      await db.update(workOrders).set({ status: "paid", updatedAt: now }).where(eq(workOrders.id, wo.id));
      await db.insert(workOrderStatusHistory).values({
        id: generateId(),
        workOrderId: wo.id,
        status: "paid",
        note: `Pagamento confirmado. Método: ${paymentMethod}`,
        changedBy: profile.name,
      });
    }
  }

  res.json({
    paymentId,
    totalAmount: total,
    invoicesPaid: selectedInvoices.length,
    paidAt: now,
  });
});

// ─── Catalog (requester view - no prices) ────────────────────────────────────
router.get("/catalog", async (req, res) => {
  await requireRole(req, "requester");

  const items = await db
    .select()
    .from(serviceCatalogItems)
    .where(eq(serviceCatalogItems.isAvailable, true));

  let filtered = items;
  if (req.query.category) filtered = filtered.filter((i) => i.category === req.query.category);
  if (req.query.region) filtered = filtered.filter((i) => i.regions?.includes(req.query.region as string));

  res.json(
    filtered.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      estimatedDays: item.estimatedDays,
      isAvailable: item.isAvailable,
      regions: item.regions,
    }))
  );
});

function formatWorkOrderForRequester(o: any) {
  return {
    id: o.id,
    serviceName: o.serviceName,
    category: o.category,
    location: o.location,
    description: o.description,
    notes: o.notes,
    status: o.status,
    requestedAt: o.requestedAt,
    completedAt: o.completedAt,
    finalPrice: o.finalPrice ? parseFloat(o.finalPrice as string) : null,
    invoiceId: null,
  };
}

export default router;
