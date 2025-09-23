import { db } from "../config/firebase.js";

/**
 * Simple scratch card controller - minimal handlers used by routes.
 * Adjust validation, error messages and storage schema to your app.
 */

export const listScratchCards = async (req, res) => {
  try {
    const snap = await db.collection("scratchCards").get();
    const cards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(cards);
  } catch (err) {
    console.error("Error listing scratch cards:", err);
    return res.status(500).json({ error: "Could not fetch scratch cards" });
  }
};

export const createScratchCard = async (req, res) => {
  try {
    const { code, value, metadata } = req.body || {};
    if (!code || !value) return res.status(400).json({ error: "code and value are required" });
    const payload = {
      code,
      value,
      metadata: metadata || {},
      createdAt: new Date(),
      used: false,
    };
    const ref = await db.collection("scratchCards").add(payload);
    const doc = await ref.get();
    return res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    console.error("Error creating scratch card:", err);
    return res.status(500).json({ error: "Could not create scratch card" });
  }
};

export const deleteScratchCard = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "id is required" });
    await db.collection("scratchCards").doc(id).delete();
    return res.json({ message: "Scratch card deleted" });
  } catch (err) {
    console.error("Error deleting scratch card:", err);
    return res.status(500).json({ error: "Could not delete scratch card" });
  }
};

// Re-export the real implementations (fixes import name mismatch / casing)
export { 
  generateScratchCards, 
  getScratchCards, 
  deleteScratchCard, 
  markScratchCardUsed 
} from "./ScratchCards.controller.js";