import express from "express";
import { createAdmin, listAdmins, deleteAdmin } from "../controllers/admin.controller.js";

const router = express.Router();

// list admins
router.get("/", listAdmins);

// Admin creation
router.post("/", createAdmin);

// Admin deletion
router.delete("/:id", deleteAdmin);

export default router;
