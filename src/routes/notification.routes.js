// routes/notification.routes.js
import express from "express";
import {
  addNotification,
  getNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/", addNotification);
router.get("/", getNotifications);

export default router;
