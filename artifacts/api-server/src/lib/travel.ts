import { db } from "@workspace/db";
import { travelPricingRules } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function calculateTravelCost(cep: string | null | undefined): Promise<number> {
  if (!cep) return 0;

  const rules = await db
    .select()
    .from(travelPricingRules)
    .where(eq(travelPricingRules.isActive, "true"));

  const normalizedCep = cep.replace(/\D/g, "");

  for (const rule of rules) {
    if (rule.ruleType === "cep_prefix") {
      if (normalizedCep.startsWith(rule.matchValue)) {
        return parseFloat(rule.price as string);
      }
    } else if (rule.ruleType === "region_name") {
      return parseFloat(rule.price as string);
    } else if (rule.ruleType === "fixed") {
      return parseFloat(rule.price as string);
    }
  }

  return 0;
}

export async function getCommissionRate(): Promise<number> {
  const { commissionSettings } = await import("@workspace/db/schema");
  const [setting] = await db.select().from(commissionSettings).limit(1);
  if (!setting) return 15;
  return parseFloat(setting.defaultRate as string);
}

export function computePricing(
  basePrice: number,
  travelCost: number,
  commissionRate: number
): { commissionAmount: number; finalPrice: number; providerReceivable: number } {
  const commissionAmount = (basePrice * commissionRate) / 100;
  const finalPrice = basePrice + travelCost + commissionAmount;
  const providerReceivable = basePrice + travelCost;
  return { commissionAmount, finalPrice, providerReceivable };
}
