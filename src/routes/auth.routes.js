// backend/src/routes/auth.routes.js
import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { loginWithPassword, loginWithScratchCard } from '../controllers/studentAuth.controller.js';
import { staffLogin } from '../controllers/staffAuth.controller.js';

const router = express.Router();

router.post('/staff/login', staffLogin);
router.post('/change-password', AuthController.changePassword);
router.post('/student/password', loginWithPassword);
router.post('/student/scratch', loginWithScratchCard);

export default router;
