// backend/src/routes/teacher.routes.js
import express from "express";
import { TeacherController } from "../controllers/teacher.controller.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Add GET by id/uid route so frontend can request /api/teachers/:idOrUid
router.post("/", upload.single("picture"), TeacherController.createTeacher);
router.get("/", TeacherController.getAllTeachers);
router.get("/:id", TeacherController.getTeacher); // <-- new
router.put("/:id", upload.single("picture"), TeacherController.updateTeacher);
router.delete("/:id", TeacherController.deleteTeacher);

export default router;
