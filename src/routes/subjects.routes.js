// backend/src/routes/subjects.routes.js
import { Router } from 'express';
import { addSubject, getAllSubjects, getSubjectById, updateSubject, deleteSubject } from '../controllers/subjects.controller.js';

const router = Router();

// Route to add a new subject
router.post('/', addSubject);

// Route to get all subjects
router.get('/', getAllSubjects);

// Route to get a subject by ID
router.get('/:id', getSubjectById);

// Route to update a subject by ID
router.put('/:id', updateSubject);

// Route to delete a subject by ID
router.delete('/:id', deleteSubject);

export default router;