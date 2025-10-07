// controllers/notification.controller.js
import { db } from "../config/firebase.js";

// Create a new notification
export const addNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message required" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20 * 60 * 1000); // 20 mins

    await db.collection("notifications").add({
      title,
      message,
      type: type || "info",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return res.status(201).json({ message: "Notification added successfully" });
  } catch (error) {
    console.error("Error adding notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all active notifications
export const getNotifications = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const snapshot = await db.collection("notifications").orderBy("createdAt", "desc").get();

    const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const active = all.filter((n) => new Date(n.expiresAt) > new Date(now));

    res.status(200).json({ notifications: active });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cleanup expired notifications automatically
export const cleanupExpiredNotifications = async () => {
  try {
    const now = new Date().toISOString();
    const snapshot = await db.collection("notifications").get();
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (new Date(data.expiresAt) <= new Date(now)) batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("🧹 Expired notifications deleted");
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
  }
};
