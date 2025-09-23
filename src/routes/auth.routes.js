// backend/src/routes/auth.routes.js
import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/change-password', AuthController.changePassword);


export default router;
