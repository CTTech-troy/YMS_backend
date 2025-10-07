import { db, admin } from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";

// ✅ Add new event + trigger notification
export const addEvent = async (req, res) => {
  try {
    const { title, date, description, forTeachers } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: "Title and date are required." });
    }

    // --- Create Event ---
    const eventData = {
      title,
      date,
      description: description || "",
      forTeachers: forTeachers === "true" || forTeachers === true,
      createdAt:
        typeof admin?.firestore?.FieldValue?.serverTimestamp === "function"
          ? admin.firestore.FieldValue.serverTimestamp()
          : new Date(),
    };

    const ref = await db.collection("events").add(eventData);
    await ref.update({ id: ref.id });

    // --- 🔔 Create Notification (no middleware needed) ---
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20 * 60 * 1000); // +20 min

    await db.collection("notifications").add({
      title: "New Event Added",
      message: `Event "${title}" has been created successfully.`,
      type: "info",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    const doc = await ref.get();
    return res.status(201).json({
      message: "Event saved successfully",
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error saving event:", error);
    res.status(500).json({ error: "Failed to save event." });
  }
};

// ✅ Get all events
export const getAllEvents = async (req, res) => {
  try {
    const snapshot = await db.collection("events").get();
    const events = snapshot.empty
      ? []
      : snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events." });
  }
};

// ✅ Update event + trigger notification
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Event id is required." });

    const docRef = db.collection("events").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found." });

    const { title, date, description, forTeachers } = req.body;
    const updateData = {};
    if (typeof title !== "undefined") updateData.title = title;
    if (typeof date !== "undefined") updateData.date = date;
    if (typeof description !== "undefined") updateData.description = description;
    if (typeof forTeachers !== "undefined")
      updateData.forTeachers =
        forTeachers === "true" || forTeachers === true;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update." });
    }

    updateData.updatedAt =
      typeof admin?.firestore?.FieldValue?.serverTimestamp === "function"
        ? admin.firestore.FieldValue.serverTimestamp()
        : new Date();

    await docRef.update(updateData);

    // --- 🔔 Create Notification ---
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20 * 60 * 1000);

    await db.collection("notifications").add({
      title: "Event Updated",
      message: `Event "${title || doc.data().title}" has been updated.`,
      type: "warning",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    const updatedDoc = await docRef.get();
    return res.status(200).json({
      message: "Event updated successfully",
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({ error: "Failed to update event." });
  }
};

// ✅ Delete event + trigger notification
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Event id is required." });

    const docRef = db.collection("events").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found." });

    const eventTitle = doc.data().title;

    await docRef.delete();

    // --- 🔔 Create Notification ---
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20 * 60 * 1000);

    await db.collection("notifications").add({
      title: "Event Deleted",
      message: `Event "${eventTitle}" has been deleted.`,
      type: "error",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return res.status(200).json({ message: "Event deleted successfully", id });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({ error: "Failed to delete event." });
  }
};
