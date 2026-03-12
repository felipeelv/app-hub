import { Request } from "express";
import { db } from "@workspace/db";
import { mockProfiles } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export type Role = "requester" | "provider" | "admin";

export interface ProfileContext {
  id: string;
  role: Role;
  name: string;
  companyId: string;
  companyName: string;
}

export async function getProfileFromRequest(req: Request): Promise<ProfileContext | null> {
  const profileId = req.headers["x-profile-id"] as string | undefined;
  if (!profileId) return null;

  const profile = await db
    .select()
    .from(mockProfiles)
    .where(eq(mockProfiles.id, profileId))
    .limit(1);

  if (!profile[0]) return null;

  return {
    id: profile[0].id,
    role: profile[0].role as Role,
    name: profile[0].name,
    companyId: profile[0].companyId,
    companyName: profile[0].companyName,
  };
}

export async function requireProfile(req: Request): Promise<ProfileContext> {
  const profile = await getProfileFromRequest(req);
  if (!profile) throw new Error("Profile not found");
  return profile;
}

export async function requireRole(req: Request, ...roles: Role[]): Promise<ProfileContext> {
  const profile = await requireProfile(req);
  if (!roles.includes(profile.role)) {
    throw new Error(`Access denied. Required role: ${roles.join(" or ")}`);
  }
  return profile;
}
