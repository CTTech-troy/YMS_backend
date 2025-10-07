import express from "express";
import multer from "multer";
import { addEvent, getAllEvents, updateEvent, deleteEvent } from "../controllers/event.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("media"), addEvent);
router.get("/", getAllEvents);
router.put("/:id", upload.single("media"), updateEvent);
router.delete("/:id", deleteEvent);

export default router;
