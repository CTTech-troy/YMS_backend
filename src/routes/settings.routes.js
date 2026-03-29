import express from 'express';
import { getPortalSettings, updatePortalSettings } from '../controllers/settings.controller.js';

const router = express.Router();

router.get('/portal', getPortalSettings);
router.put('/portal', updatePortalSettings);

export default router;
