import { Router } from "express";
import { db } from "@workspace/db";
import { mockProfiles } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/profiles", async (_req, res) => {
  const profiles = await db.select().from(mockProfiles);
  res.json(profiles);
});

router.get("/me", async (req, res) => {
  const profileId = req.headers["x-profile-id"] as string | undefined;
  if (!profileId) {
    res.status(400).json({ error: "No profile selected" });
    return;
  }
  const [profile] = await db.select().from(mockProfiles).where(eq(mockProfiles.id, profileId));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(profile);
});

export default router;
