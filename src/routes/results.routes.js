import express from 'express';
import * as resultsController from '../controllers/results.controller.js';

const router = express.Router();

// Create a new result
router.post('/', resultsController.createResult);

// Get all results
router.get('/', resultsController.getAllResults);

// Get a specific result by ID
router.get('/:id', resultsController.getResultById);

// Update a result by ID
router.put('/:id', resultsController.updateResult);

// Delete a result by ID
router.delete('/:id', resultsController.deleteResult);

// Student checks result with ID + scratch card
router.post('/check', resultsController.checkResult);

export default router;
