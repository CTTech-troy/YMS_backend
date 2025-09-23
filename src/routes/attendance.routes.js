import express from "express";
import { markAttendance, getAttendance, updateAttendance, deleteAttendance } from "../controllers/attendance.controller.js";

const router = express.Router();

router.post("/mark/:id", markAttendance);
router.get("/:id", getAttendance);
router.put("/:id", updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;

