import { db } from "../config/firebase.js";

// Helper: Generate PIN
const generatePin = () =>
  Math.random().toString(36).slice(2, 10).toUpperCase();

// ✅ Generate new scratch cards
export const generateScratchCards = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const snapshot = await db.collection("scratchCards").get();
    const currentCount = snapshot.size;

    const batch = db.batch();
    const newCards = [];

    for (let i = 1; i <= quantity; i++) {
      const serialNumber = `SC-${String(currentCount + i).padStart(5, "0")}`;
      const pin = generatePin();

      const docRef = db.collection("scratchCards").doc();
      const card = {
        serialNumber,
        pin,
        status: "unused",
        generatedAt: new Date().toISOString(),
        usedAt: null,
        usedBy: null,
      };

      batch.set(docRef, card);
      // include docRef.id so client can reference the document id immediately
      newCards.push({ id: docRef.id, ...card });
    }

    await batch.commit();
    res.status(201).json(newCards);
  } catch (error) {
    console.error("❌ Error generating cards:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all scratch cards
export const getScratchCards = async (req, res) => {
  try {
    const snapshot = await db
      .collection("scratchCards")
      .orderBy("generatedAt", "desc")
      .get();

    const cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(cards);
  } catch (error) {
    console.error("❌ Error fetching cards:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete a scratch card
export const deleteScratchCard = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID is required" });

    await db.collection("scratchCards").doc(id).delete();
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting card:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Mark card as used
export const markScratchCardUsed = async (req, res) => {
  try {
    const { id } = req.params;
    const { usedBy } = req.body;

    if (!id) return res.status(400).json({ message: "ID is required" });

    const cardRef = db.collection("scratchCards").doc(id);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      return res.status(404).json({ message: "Card not found" });
    }

    await cardRef.update({
      status: "used",
      usedAt: new Date().toISOString(),
      usedBy: usedBy || "Unknown User",
    });

    res.json({ message: "Card marked as used" });
  } catch (error) {
    console.error("❌ Error updating card:", error);
    res.status(500).json({ message: "Server error" });
  }
};
