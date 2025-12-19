// backend/src/routes/student.routes.js
import express from "express";
import * as studentCtrl from "../controllers/student.controller.js"; 
const router = express.Router();

router.post("/", studentCtrl.createStudent);
router.get("/", studentCtrl.listStudents);        // paginated (admin list/search)
router.get("/all", studentCtrl.listAllStudents);  // unpaginated (dropdowns)
router.get("/:id", studentCtrl.getStudent);
router.post("/:id/results", studentCtrl.addResult);
router.put("/:id", studentCtrl.updateStudent);
router.delete("/:id", studentCtrl.deleteStudent);

export default router;
