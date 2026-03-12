import { Router } from "express";
import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireProfile } from "../lib/profile.js";
import { generateId } from "../lib/id.js";

const router = Router();

router.get("/", async (req, res) => {
  const profile = await requireProfile(req);
  if (!profile) {
    res.json([]);
    return;
  }

  let allNotifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientId, profile.companyId))
    .orderBy(desc(notifications.createdAt));

  // Also get notifications for admin role
  if (profile.role === "admin") {
    allNotifs = await db.select().from(notifications).where(eq(notifications.recipientRole, "admin")).orderBy(desc(notifications.createdAt));
  }

  if (req.query.unreadOnly === "true") {
    allNotifs = allNotifs.filter((n) => !n.isRead);
  }

  res.json(allNotifs);
});

router.post("/:id/read", async (req, res) => {
  const profile = await requireProfile(req);
  if (!profile) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, req.params.id));

  const [notif] = await db.select().from(notifications).where(eq(notifications.id, req.params.id));
  res.json(notif);
});

router.post("/read-all", async (req, res) => {
  const profile = await requireProfile(req);
  if (!profile) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.recipientId, profile.companyId));

  res.status(204).send();
});

export default router;
