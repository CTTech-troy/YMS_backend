import express from "express";
import {
  generateScratchCards,
  getScratchCards,
  deleteScratchCard,
  markScratchCardUsed,
} from "../controllers/ScratchCards.controller.js";

const router = express.Router();

router.post("/generate", generateScratchCards);
router.get("/", getScratchCards);
router.delete("/:id", deleteScratchCard);
router.put("/:id/use", markScratchCardUsed);

export default router;
