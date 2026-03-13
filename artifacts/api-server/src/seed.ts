import { db } from "@workspace/db";
import {
  requesterCompanies,
  providerCompanies,
  adminProfiles,
  mockProfiles,
  serviceCatalogItems,
  workOrders,
  workOrderStatusHistory,
  invoices,
  payments,
  paymentInvoices,
  payouts,
  payoutWorkOrders,
  commissionSettings,
  travelPricingRules,
  notifications,
} from "@workspace/db/schema";
import { randomUUID } from "crypto";

function id() { return randomUUID(); }

export async function autoSeedIfEmpty() {
  const existing = await db.select().from(mockProfiles).limit(1);
  if (existing.length > 0) return;

  console.log("Database is empty — running auto-seed...");

  await db.delete(notifications);
  await db.delete(payoutWorkOrders);
  await db.delete(payouts);
  await db.delete(paymentInvoices);
  await db.delete(payments);
  await db.delete(invoices);
  await db.delete(workOrderStatusHistory);
  await db.delete(workOrders);
  await db.delete(serviceCatalogItems);
  await db.delete(mockProfiles);
  await db.delete(adminProfiles);
  await db.delete(providerCompanies);
  await db.delete(requesterCompanies);
  await db.delete(travelPricingRules);
  await db.delete(commissionSettings);

  await db.insert(commissionSettings).values({
    id: "default",
    defaultRate: "15",
    updatedAt: new Date(),
  });

  const tpRules = [
    { id: id(), name: "Orlando Downtown - ZIP 328xx", ruleType: "cep_prefix", matchValue: "328", price: "50", description: "Orlando Downtown area", isActive: "true" },
    { id: id(), name: "Orlando North - ZIP 327xx", ruleType: "cep_prefix", matchValue: "327", price: "80", description: "Orlando North area", isActive: "true" },
    { id: id(), name: "Kissimmee - ZIP 347xx", ruleType: "cep_prefix", matchValue: "347", price: "120", description: "Kissimmee area", isActive: "true" },
    { id: id(), name: "Sanford / Lake Mary - ZIP 327xx-2", ruleType: "cep_prefix", matchValue: "327", price: "100", description: "Sanford / Lake Mary", isActive: "true" },
    { id: id(), name: "Default - other areas", ruleType: "fixed", matchValue: "*", price: "150", description: "Default rate for other areas", isActive: "true" },
  ];
  await db.insert(travelPricingRules).values(tpRules);

  const rc1Id = id();
  const rc2Id = id();
  await db.insert(requesterCompanies).values([
    { id: rc1Id, name: "Empresa ABC Ltda", taxId: "12.345.678/0001-90", email: "contato@abc.com.br", phone: "(407) 300-1000", address: "123 Orange Ave", cep: "32801", city: "Orlando", state: "FL" },
    { id: rc2Id, name: "Empresa XYZ S.A.", taxId: "98.765.432/0001-10", email: "operacoes@xyz.com.br", phone: "(407) 400-2000", address: "456 Lake Nona Blvd", cep: "32827", city: "Orlando", state: "FL" },
  ]);

  const pc1Id = id();
  const pc2Id = id();
  await db.insert(providerCompanies).values([
    { id: pc1Id, name: "TechFix Serviços", taxId: "11.222.333/0001-44", email: "servicos@techfix.com.br", phone: "(407) 900-5000", address: "789 Technology Dr", cep: "32826", city: "Orlando", state: "FL", commissionRate: "15" },
    { id: pc2Id, name: "RepairPro", taxId: "55.666.777/0001-88", email: "atendimento@repairpro.com.br", phone: "(407) 901-5001", address: "321 Industrial Ave", cep: "32824", city: "Orlando", state: "FL", commissionRate: "12" },
  ]);

  const adminId = id();
  await db.insert(adminProfiles).values([
    { id: adminId, name: "Admin ServicesHub", email: "admin@serviceshub.com.br" },
  ]);

  await db.insert(mockProfiles).values([
    { id: "admin-1", role: "admin", name: "Admin ServicesHub", companyId: adminId, companyName: "ServicesHub" },
    { id: "req-abc", role: "requester", name: "Empresa ABC Ltda", companyId: rc1Id, companyName: "Empresa ABC Ltda" },
    { id: "req-xyz", role: "requester", name: "Empresa XYZ S.A.", companyId: rc2Id, companyName: "Empresa XYZ S.A." },
    { id: "prov-techfix", role: "provider", name: "TechFix Serviços", companyId: pc1Id, companyName: "TechFix Serviços" },
    { id: "prov-repairpro", role: "provider", name: "RepairPro", companyId: pc2Id, companyName: "RepairPro" },
  ]);

  const cat1 = id(); const cat2 = id(); const cat3 = id(); const cat4 = id(); const cat5 = id();
  await db.insert(serviceCatalogItems).values([
    { id: cat1, providerCompanyId: pc1Id, name: "Manutenção de Ar-condicionado", description: "Limpeza, recarga e manutenção preventiva de ar-condicionado split e janela", category: "HVAC", estimatedDays: 1, basePrice: "350", isAvailable: true, regions: ["Orlando", "Kissimmee"] },
    { id: cat2, providerCompanyId: pc1Id, name: "Instalação de Câmeras CCTV", description: "Instalação e configuração de câmeras de segurança IP e analógicas", category: "Segurança", estimatedDays: 2, basePrice: "800", isAvailable: true, regions: ["Orlando", "Sanford", "Lake Mary"] },
    { id: cat3, providerCompanyId: pc1Id, name: "Manutenção Elétrica Predial", description: "Revisão de quadros elétricos, troca de tomadas e interruptores", category: "Elétrica", estimatedDays: 1, basePrice: "500", isAvailable: true, regions: ["Orlando"] },
    { id: cat4, providerCompanyId: pc2Id, name: "Pintura Comercial", description: "Pintura de ambientes comerciais, salas e escritórios", category: "Pintura", estimatedDays: 3, basePrice: "1200", isAvailable: true, regions: ["Orlando", "Kissimmee", "St. Cloud"] },
    { id: cat5, providerCompanyId: pc2Id, name: "Reparo Hidráulico", description: "Conserto de vazamentos, troca de registros e torneiras", category: "Hidráulica", estimatedDays: 1, basePrice: "280", isAvailable: true, regions: ["Orlando", "Kissimmee"] },
  ]);

  const wo1 = id(); const wo2 = id(); const wo3 = id(); const wo4 = id(); const wo5 = id(); const wo6 = id(); const wo7 = id();
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  const basePrice1 = 350; const travel1 = 50; const comm1 = basePrice1 * 0.15; const final1 = basePrice1 + travel1 + comm1; const recv1 = basePrice1 + travel1;
  const basePrice2 = 800; const travel2 = 50; const comm2 = basePrice2 * 0.15; const final2 = basePrice2 + travel2 + comm2; const recv2 = basePrice2 + travel2;
  const basePrice3 = 500; const travel3 = 80; const comm3 = basePrice3 * 0.15; const final3 = basePrice3 + travel3 + comm3; const recv3 = basePrice3 + travel3;
  const basePrice4 = 1200; const travel4 = 80; const comm4 = basePrice4 * 0.15; const final4 = basePrice4 + travel4 + comm4; const recv4 = basePrice4 + travel4;
  const basePrice5 = 280; const travel5 = 50; const comm5 = basePrice5 * 0.15; const final5 = basePrice5 + travel5 + comm5; const recv5 = basePrice5 + travel5;

  await db.insert(workOrders).values([
    { id: wo1, requesterCompanyId: rc1Id, serviceCatalogItemId: cat1, serviceName: "Manutenção de Ar-condicionado", category: "HVAC", location: "Filial Centro - Sala 301", description: "Ar-condicionado da sala 301 apresentando ruído excessivo e perda de eficiência", cep: "32801", status: "requested", basePrice: String(basePrice1), travelCost: String(travel1), commissionAmount: String(comm1), finalPrice: String(final1), providerReceivable: String(recv1), requestedAt: daysAgo(1) },
    { id: wo2, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, serviceCatalogItemId: cat2, serviceName: "Instalação de Câmeras CCTV", category: "Segurança", location: "Matriz - Estacionamento", description: "Instalação de 8 câmeras externas no estacionamento da sede", cep: "32801", status: "accepted", basePrice: String(basePrice2), travelCost: String(travel2), commissionAmount: String(comm2), finalPrice: String(final2), providerReceivable: String(recv2), requestedAt: daysAgo(5) },
    { id: wo3, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, serviceCatalogItemId: cat3, serviceName: "Manutenção Elétrica Predial", category: "Elétrica", location: "Filial Norte - Térreo", description: "Revisão completa do quadro elétrico do térreo", cep: "32826", status: "in_progress", basePrice: String(basePrice3), travelCost: String(travel3), commissionAmount: String(comm3), finalPrice: String(final3), providerReceivable: String(recv3), requestedAt: daysAgo(7) },
    { id: wo4, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, serviceCatalogItemId: cat4, serviceName: "Pintura Comercial", category: "Pintura", location: "Filial Sul - Sala de Reuniões", description: "Pintura completa da sala de reuniões com tinta lavável", cep: "32827", status: "invoiced", basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), requestedAt: daysAgo(15), completedAt: daysAgo(10) },
    { id: wo5, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, serviceCatalogItemId: cat5, serviceName: "Reparo Hidráulico", category: "Hidráulica", location: "Filial Leste - Banheiros", description: "Conserto de três torneiras com vazamento e troca de dois registros", cep: "32824", status: "paid", basePrice: String(basePrice5), travelCost: String(travel5), commissionAmount: String(comm5), finalPrice: String(final5), providerReceivable: String(recv5), requestedAt: daysAgo(20), completedAt: daysAgo(16) },
    { id: wo6, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, serviceCatalogItemId: cat1, serviceName: "Manutenção de Ar-condicionado", category: "HVAC", location: "Matriz - TI", description: "Limpeza e recarga dos aparelhos de ar da sala de servidores", cep: "32801", status: "paid_out", basePrice: String(basePrice1), travelCost: String(travel1), commissionAmount: String(comm1), finalPrice: String(final1), providerReceivable: String(recv1), requestedAt: daysAgo(30), completedAt: daysAgo(25) },
    { id: wo7, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, serviceCatalogItemId: cat4, serviceName: "Pintura Comercial", category: "Pintura", location: "Sede - Recepção", description: "Repintura da recepção com nova identidade visual", cep: "32827", status: "closed", basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), requestedAt: daysAgo(45), completedAt: daysAgo(40) },
  ]);

  const histories = [
    { id: id(), workOrderId: wo1, status: "requested", note: "Serviço solicitado pela empresa", changedBy: "Empresa ABC Ltda", changedAt: daysAgo(1) },
    { id: id(), workOrderId: wo2, status: "requested", note: "Serviço solicitado pela empresa", changedBy: "Empresa ABC Ltda", changedAt: daysAgo(5) },
    { id: id(), workOrderId: wo2, status: "accepted", note: "Prestador aceitou o serviço", changedBy: "TechFix Serviços", changedAt: daysAgo(4) },
    { id: id(), workOrderId: wo3, status: "requested", note: "Serviço solicitado pela empresa", changedBy: "Empresa ABC Ltda", changedAt: daysAgo(7) },
    { id: id(), workOrderId: wo3, status: "accepted", note: "Prestador aceitou o serviço", changedBy: "TechFix Serviços", changedAt: daysAgo(6) },
    { id: id(), workOrderId: wo3, status: "in_progress", note: "Serviço iniciado", changedBy: "TechFix Serviços", changedAt: daysAgo(5) },
    { id: id(), workOrderId: wo4, status: "requested", note: "Serviço solicitado pela empresa", changedBy: "Empresa XYZ S.A.", changedAt: daysAgo(15) },
    { id: id(), workOrderId: wo4, status: "accepted", note: "Prestador aceitou o serviço", changedBy: "RepairPro", changedAt: daysAgo(14) },
    { id: id(), workOrderId: wo4, status: "in_progress", note: "Serviço iniciado", changedBy: "RepairPro", changedAt: daysAgo(13) },
    { id: id(), workOrderId: wo4, status: "completed", note: "Serviço concluído com sucesso", changedBy: "RepairPro", changedAt: daysAgo(10) },
    { id: id(), workOrderId: wo4, status: "invoiced", note: "Fatura gerada automaticamente", changedBy: "Sistema", changedAt: daysAgo(10) },
    { id: id(), workOrderId: wo5, status: "requested", note: "Serviço solicitado", changedBy: "Empresa XYZ S.A.", changedAt: daysAgo(20) },
    { id: id(), workOrderId: wo5, status: "accepted", note: "Aceito", changedBy: "RepairPro", changedAt: daysAgo(19) },
    { id: id(), workOrderId: wo5, status: "completed", note: "Concluído", changedBy: "RepairPro", changedAt: daysAgo(16) },
    { id: id(), workOrderId: wo5, status: "invoiced", note: "Fatura gerada", changedBy: "Sistema", changedAt: daysAgo(16) },
    { id: id(), workOrderId: wo5, status: "paid", note: "Pagamento confirmado via ACH", changedBy: "Empresa XYZ S.A.", changedAt: daysAgo(14) },
    { id: id(), workOrderId: wo6, status: "paid_out", note: "Repasse realizado para TechFix", changedBy: "Admin ServicesHub", changedAt: daysAgo(22) },
    { id: id(), workOrderId: wo7, status: "closed", note: "Serviço encerrado", changedBy: "Admin ServicesHub", changedAt: daysAgo(38) },
  ];
  await db.insert(workOrderStatusHistory).values(histories);

  const inv4Id = id(); const inv5Id = id(); const inv6Id = id(); const inv7Id = id();
  await db.insert(invoices).values([
    { id: inv4Id, workOrderId: wo4, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), status: "pending", generatedAt: daysAgo(10) },
    { id: inv5Id, workOrderId: wo5, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, basePrice: String(basePrice5), travelCost: String(travel5), commissionAmount: String(comm5), finalPrice: String(final5), providerReceivable: String(recv5), status: "paid", generatedAt: daysAgo(16), paidAt: daysAgo(14) },
    { id: inv6Id, workOrderId: wo6, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, basePrice: String(basePrice1), travelCost: String(travel1), commissionAmount: String(comm1), finalPrice: String(final1), providerReceivable: String(recv1), status: "paid", generatedAt: daysAgo(25), paidAt: daysAgo(23) },
    { id: inv7Id, workOrderId: wo7, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), status: "paid", generatedAt: daysAgo(41), paidAt: daysAgo(39) },
  ]);

  const pay1Id = id(); const pay2Id = id();
  await db.insert(payments).values([
    { id: pay1Id, requesterCompanyId: rc2Id, amount: String(final5), paymentMethod: "ach", paidAt: daysAgo(14) },
    { id: pay2Id, requesterCompanyId: rc1Id, amount: String(final1), paymentMethod: "check", paidAt: daysAgo(23) },
  ]);

  await db.insert(paymentInvoices).values([
    { id: id(), paymentId: pay1Id, invoiceId: inv5Id },
    { id: id(), paymentId: pay2Id, invoiceId: inv6Id },
  ]);

  const payout1Id = id();
  await db.insert(payouts).values([
    { id: payout1Id, providerCompanyId: pc1Id, amount: String(recv1), notes: "Payout for AC maintenance - HQ IT", paidAt: daysAgo(22) },
  ]);
  await db.insert(payoutWorkOrders).values([
    { id: id(), payoutId: payout1Id, workOrderId: wo6 },
  ]);

  await db.insert(notifications).values([
    { id: id(), recipientId: pc1Id, recipientRole: "provider", title: "New Work Order", message: "You received a new request: CCTV Camera Installation", type: "new_request", relatedWorkOrderId: wo2, isRead: false },
    { id: id(), recipientId: rc1Id, recipientRole: "requester", title: "Service Accepted", message: "TechFix Serviços accepted your CCTV Camera Installation request", type: "request_accepted", relatedWorkOrderId: wo2, isRead: false },
    { id: id(), recipientId: rc2Id, recipientRole: "requester", title: "Invoice Available", message: "A new invoice of $" + final4.toFixed(2) + " is available for payment", type: "invoice_generated", relatedWorkOrderId: wo4, isRead: false },
    { id: id(), recipientId: adminId, recipientRole: "admin", title: "Novo serviço solicitado", message: "Empresa ABC solicitou: Manutenção de Ar-condicionado", type: "new_request", relatedWorkOrderId: wo1, isRead: false },
    { id: id(), recipientId: adminId, recipientRole: "admin", title: "Pagamento confirmado", message: "Empresa XYZ confirmou pagamento de $" + final5.toFixed(2), type: "payment_confirmed", relatedWorkOrderId: wo5, isRead: true },
  ]);

  console.log("✅ Auto-seed completed successfully!");
}
