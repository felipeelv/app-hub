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

async function main() {
  console.log("Seeding database...");

  // Clear existing data
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

  // Commission settings
  await db.insert(commissionSettings).values({
    id: "default",
    defaultRate: "15",
    updatedAt: new Date(),
  });

  // Travel pricing rules
  const tpRules = [
    { id: id(), name: "Capital - CEP 01xxx-08xxx", ruleType: "cep_prefix", matchValue: "0", price: "50", description: "São Paulo capital", isActive: "true" },
    { id: id(), name: "Grande São Paulo - CEP 09xxx", ruleType: "cep_prefix", matchValue: "09", price: "80", description: "Grande SP", isActive: "true" },
    { id: id(), name: "Interior SP - CEP 1xxxx", ruleType: "cep_prefix", matchValue: "1", price: "150", description: "Interior de SP", isActive: "true" },
    { id: id(), name: "Rio de Janeiro - CEP 2xxxx", ruleType: "cep_prefix", matchValue: "2", price: "200", description: "Rio de Janeiro", isActive: "true" },
    { id: id(), name: "Padrão - outras regiões", ruleType: "fixed", matchValue: "*", price: "120", description: "Valor padrão para outras regiões", isActive: "true" },
  ];
  await db.insert(travelPricingRules).values(tpRules);

  // Requester companies
  const rc1Id = id();
  const rc2Id = id();
  await db.insert(requesterCompanies).values([
    { id: rc1Id, name: "Empresa ABC Ltda", taxId: "12.345.678/0001-90", email: "contato@abc.com.br", phone: "(11) 3000-1000", address: "Av. Paulista, 1000", cep: "01311-000", city: "São Paulo", state: "SP" },
    { id: rc2Id, name: "Empresa XYZ S.A.", taxId: "98.765.432/0001-10", email: "operacoes@xyz.com.br", phone: "(11) 4000-2000", address: "Rua das Flores, 500", cep: "01310-100", city: "São Paulo", state: "SP" },
  ]);

  // Provider companies
  const pc1Id = id();
  const pc2Id = id();
  await db.insert(providerCompanies).values([
    { id: pc1Id, name: "TechFix Serviços", taxId: "11.222.333/0001-44", email: "servicos@techfix.com.br", phone: "(11) 9000-5000", address: "Rua da Tecnologia, 200", cep: "04000-001", city: "São Paulo", state: "SP", commissionRate: "15" },
    { id: pc2Id, name: "RepairPro", taxId: "55.666.777/0001-88", email: "atendimento@repairpro.com.br", phone: "(11) 9001-5001", address: "Av. das Indústrias, 300", cep: "09200-000", city: "Santo André", state: "SP", commissionRate: "12" },
  ]);

  // Admin profile
  const adminId = id();
  await db.insert(adminProfiles).values([
    { id: adminId, name: "Admin ServicesHub", email: "admin@serviceshub.com.br" },
  ]);

  // Mock profiles
  await db.insert(mockProfiles).values([
    { id: "admin-1", role: "admin", name: "Admin ServicesHub", companyId: adminId, companyName: "ServicesHub" },
    { id: "req-abc", role: "requester", name: "Empresa ABC Ltda", companyId: rc1Id, companyName: "Empresa ABC Ltda" },
    { id: "req-xyz", role: "requester", name: "Empresa XYZ S.A.", companyId: rc2Id, companyName: "Empresa XYZ S.A." },
    { id: "prov-techfix", role: "provider", name: "TechFix Serviços", companyId: pc1Id, companyName: "TechFix Serviços" },
    { id: "prov-repairpro", role: "provider", name: "RepairPro", companyId: pc2Id, companyName: "RepairPro" },
  ]);

  // Service catalog items
  const cat1 = id(); const cat2 = id(); const cat3 = id(); const cat4 = id(); const cat5 = id();
  await db.insert(serviceCatalogItems).values([
    { id: cat1, providerCompanyId: pc1Id, name: "Manutenção de Ar-condicionado", description: "Limpeza, recarga e manutenção preventiva de ar-condicionado split e janela", category: "HVAC", estimatedDays: 1, basePrice: "350", isAvailable: true, regions: ["SP", "ABC"] },
    { id: cat2, providerCompanyId: pc1Id, name: "Instalação de Câmeras CCTV", description: "Instalação e configuração de câmeras de segurança IP e analógicas", category: "Segurança", estimatedDays: 2, basePrice: "800", isAvailable: true, regions: ["SP", "ABC", "Guarulhos"] },
    { id: cat3, providerCompanyId: pc1Id, name: "Manutenção Elétrica Predial", description: "Revisão de quadros elétricos, troca de tomadas e interruptores", category: "Elétrica", estimatedDays: 1, basePrice: "500", isAvailable: true, regions: ["SP"] },
    { id: cat4, providerCompanyId: pc2Id, name: "Pintura Comercial", description: "Pintura de ambientes comerciais, salas e escritórios", category: "Pintura", estimatedDays: 3, basePrice: "1200", isAvailable: true, regions: ["SP", "Santo André", "São Bernardo"] },
    { id: cat5, providerCompanyId: pc2Id, name: "Reparo Hidráulico", description: "Conserto de vazamentos, troca de registros e torneiras", category: "Hidráulica", estimatedDays: 1, basePrice: "280", isAvailable: true, regions: ["SP", "ABC"] },
  ]);

  // Work orders in various states
  const wo1 = id(); const wo2 = id(); const wo3 = id(); const wo4 = id(); const wo5 = id(); const wo6 = id(); const wo7 = id();
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  const basePrice1 = 350; const travel1 = 50; const comm1 = basePrice1 * 0.15; const final1 = basePrice1 + travel1 + comm1; const recv1 = basePrice1 + travel1;
  const basePrice2 = 800; const travel2 = 50; const comm2 = basePrice2 * 0.15; const final2 = basePrice2 + travel2 + comm2; const recv2 = basePrice2 + travel2;
  const basePrice3 = 500; const travel3 = 80; const comm3 = basePrice3 * 0.15; const final3 = basePrice3 + travel3 + comm3; const recv3 = basePrice3 + travel3;
  const basePrice4 = 1200; const travel4 = 80; const comm4 = basePrice4 * 0.15; const final4 = basePrice4 + travel4 + comm4; const recv4 = basePrice4 + travel4;
  const basePrice5 = 280; const travel5 = 50; const comm5 = basePrice5 * 0.15; const final5 = basePrice5 + travel5 + comm5; const recv5 = basePrice5 + travel5;

  await db.insert(workOrders).values([
    // requested - no provider assigned yet
    { id: wo1, requesterCompanyId: rc1Id, serviceCatalogItemId: cat1, serviceName: "Manutenção de Ar-condicionado", category: "HVAC", location: "Filial Centro - Sala 301", description: "Ar-condicionado da sala 301 apresentando ruído excessivo e perda de eficiência", cep: "01311-000", status: "requested", basePrice: String(basePrice1), travelCost: String(travel1), commissionAmount: String(comm1), finalPrice: String(final1), providerReceivable: String(recv1), requestedAt: daysAgo(1) },
    // accepted by provider
    { id: wo2, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, serviceCatalogItemId: cat2, serviceName: "Instalação de Câmeras CCTV", category: "Segurança", location: "Matriz - Estacionamento", description: "Instalação de 8 câmeras externas no estacionamento da sede", cep: "01310-100", status: "accepted", basePrice: String(basePrice2), travelCost: String(travel2), commissionAmount: String(comm2), finalPrice: String(final2), providerReceivable: String(recv2), requestedAt: daysAgo(5) },
    // in_progress
    { id: wo3, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, serviceCatalogItemId: cat3, serviceName: "Manutenção Elétrica Predial", category: "Elétrica", location: "Filial Norte - Térreo", description: "Revisão completa do quadro elétrico do térreo", cep: "01110-000", status: "in_progress", basePrice: String(basePrice3), travelCost: String(travel3), commissionAmount: String(comm3), finalPrice: String(final3), providerReceivable: String(recv3), requestedAt: daysAgo(7) },
    // invoiced (completed + invoice generated)
    { id: wo4, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, serviceCatalogItemId: cat4, serviceName: "Pintura Comercial", category: "Pintura", location: "Filial Sul - Sala de Reuniões", description: "Pintura completa da sala de reuniões com tinta lavável", cep: "09210-100", status: "invoiced", basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), requestedAt: daysAgo(15), completedAt: daysAgo(10) },
    // paid
    { id: wo5, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, serviceCatalogItemId: cat5, serviceName: "Reparo Hidráulico", category: "Hidráulica", location: "Filial Leste - Banheiros", description: "Conserto de três torneiras com vazamento e troca de dois registros", cep: "09200-000", status: "paid", basePrice: String(basePrice5), travelCost: String(travel5), commissionAmount: String(comm5), finalPrice: String(final5), providerReceivable: String(recv5), requestedAt: daysAgo(20), completedAt: daysAgo(16) },
    // paid_out
    { id: wo6, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, serviceCatalogItemId: cat1, serviceName: "Manutenção de Ar-condicionado", category: "HVAC", location: "Matriz - TI", description: "Limpeza e recarga dos aparelhos de ar da sala de servidores", cep: "01311-000", status: "paid_out", basePrice: String(basePrice1), travelCost: String(travel1), commissionAmount: String(comm1), finalPrice: String(final1), providerReceivable: String(recv1), requestedAt: daysAgo(30), completedAt: daysAgo(25) },
    // closed
    { id: wo7, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, serviceCatalogItemId: cat4, serviceName: "Pintura Comercial", category: "Pintura", location: "Sede - Recepção", description: "Repintura da recepção com nova identidade visual", cep: "09210-100", status: "closed", basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), requestedAt: daysAgo(45), completedAt: daysAgo(40) },
  ]);

  // Status history
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
    { id: id(), workOrderId: wo5, status: "paid", note: "Pagamento confirmado via PIX", changedBy: "Empresa XYZ S.A.", changedAt: daysAgo(14) },
    { id: id(), workOrderId: wo6, status: "paid_out", note: "Repasse realizado para TechFix", changedBy: "Admin ServicesHub", changedAt: daysAgo(22) },
    { id: id(), workOrderId: wo7, status: "closed", note: "Serviço encerrado", changedBy: "Admin ServicesHub", changedAt: daysAgo(38) },
  ];
  await db.insert(workOrderStatusHistory).values(histories);

  // Invoices
  const inv4Id = id(); const inv5Id = id(); const inv6Id = id(); const inv7Id = id();
  await db.insert(invoices).values([
    { id: inv4Id, workOrderId: wo4, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), status: "pending", generatedAt: daysAgo(10) },
    { id: inv5Id, workOrderId: wo5, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, basePrice: String(basePrice5), travelCost: String(travel5), commissionAmount: String(comm5), finalPrice: String(final5), providerReceivable: String(recv5), status: "paid", generatedAt: daysAgo(16), paidAt: daysAgo(14) },
    { id: inv6Id, workOrderId: wo6, requesterCompanyId: rc1Id, providerCompanyId: pc1Id, basePrice: String(basePrice1), travelCost: String(travel1), commissionAmount: String(comm1), finalPrice: String(final1), providerReceivable: String(recv1), status: "paid", generatedAt: daysAgo(25), paidAt: daysAgo(23) },
    { id: inv7Id, workOrderId: wo7, requesterCompanyId: rc2Id, providerCompanyId: pc2Id, basePrice: String(basePrice4), travelCost: String(travel4), commissionAmount: String(comm4), finalPrice: String(final4), providerReceivable: String(recv4), status: "paid", generatedAt: daysAgo(41), paidAt: daysAgo(39) },
  ]);

  // Payments
  const pay1Id = id(); const pay2Id = id();
  await db.insert(payments).values([
    { id: pay1Id, requesterCompanyId: rc2Id, amount: String(final5), paymentMethod: "pix", paidAt: daysAgo(14) },
    { id: pay2Id, requesterCompanyId: rc1Id, amount: String(final1), paymentMethod: "bank_transfer", paidAt: daysAgo(23) },
  ]);

  await db.insert(paymentInvoices).values([
    { id: id(), paymentId: pay1Id, invoiceId: inv5Id },
    { id: id(), paymentId: pay2Id, invoiceId: inv6Id },
  ]);

  // Payouts
  const payout1Id = id();
  await db.insert(payouts).values([
    { id: payout1Id, providerCompanyId: pc1Id, amount: String(recv1), notes: "Repasse referente a manutenção de AC - Matriz TI", paidAt: daysAgo(22) },
  ]);
  await db.insert(payoutWorkOrders).values([
    { id: id(), payoutId: payout1Id, workOrderId: wo6 },
  ]);

  // Notifications
  await db.insert(notifications).values([
    { id: id(), recipientId: pc1Id, recipientRole: "provider", title: "Nova ordem de serviço", message: "Você recebeu uma nova solicitação: Instalação de Câmeras CCTV", type: "new_request", relatedWorkOrderId: wo2, isRead: false },
    { id: id(), recipientId: rc1Id, recipientRole: "requester", title: "Serviço aceito", message: "TechFix Serviços aceitou sua solicitação de Instalação de Câmeras CCTV", type: "request_accepted", relatedWorkOrderId: wo2, isRead: false },
    { id: id(), recipientId: rc2Id, recipientRole: "requester", title: "Fatura disponível", message: "Uma nova fatura de R$ " + final4.toFixed(2) + " está disponível para pagamento", type: "invoice_generated", relatedWorkOrderId: wo4, isRead: false },
    { id: id(), recipientId: adminId, recipientRole: "admin", title: "Novo serviço solicitado", message: "Empresa ABC solicitou: Manutenção de Ar-condicionado", type: "new_request", relatedWorkOrderId: wo1, isRead: false },
    { id: id(), recipientId: adminId, recipientRole: "admin", title: "Pagamento confirmado", message: "Empresa XYZ confirmou pagamento de R$ " + final5.toFixed(2), type: "payment_confirmed", relatedWorkOrderId: wo5, isRead: true },
  ]);

  console.log("✅ Seed completed successfully!");
  console.log("  Mock profiles:");
  console.log("  - admin-1 (Admin)");
  console.log("  - req-abc (Empresa ABC Ltda - Requester)");
  console.log("  - req-xyz (Empresa XYZ S.A. - Requester)");
  console.log("  - prov-techfix (TechFix Serviços - Provider)");
  console.log("  - prov-repairpro (RepairPro - Provider)");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
