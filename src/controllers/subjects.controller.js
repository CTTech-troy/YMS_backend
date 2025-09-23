// backend/src/controllers/subjects.controller.js
import { db } from '../config/firebase.js';

/**
 * Helper: remove undefined and convert nested non-plain types to plain JSON
 */
function sanitizeBody(raw = {}) {
  const out = {};
  Object.entries(raw || {}).forEach(([k, v]) => {
    if (typeof v === 'undefined') return;
    if (v && typeof v === 'object') {
      try {
        out[k] = JSON.parse(JSON.stringify(v));
      } catch {
        out[k] = String(v);
      }
    } else {
      out[k] = v;
    }
  });
  return out;
}

// Add a new subject
export const addSubject = async (req, res) => {
  try {
    const data = sanitizeBody(req.body);
    data.createdAt = data.createdAt || new Date().toISOString();

    const colRef = db.collection('subjects');
    const docRef = await colRef.add(data);
    const snap = await docRef.get();

    return res.status(201).json({ id: docRef.id, ...snap.data() });
  } catch (error) {
    console.error('addSubject error:', error);
    return res.status(400).json({ message: 'Error adding subject', error: error.message });
  }
};

// Get all subjects
export const getAllSubjects = async (req, res) => {
  try {
    const colRef = db.collection('subjects');
    const snap = await colRef.get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json(list);
  } catch (error) {
    console.error('getAllSubjects error:', error);
    return res.status(500).json({ message: 'Error retrieving subjects', error: error.message });
  }
};

// Get a subject by ID
export const getSubjectById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Missing id parameter' });

    const docRef = db.collection('subjects').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) return res.status(404).json({ message: 'Subject not found' });

    return res.status(200).json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('getSubjectById error:', error);
    return res.status(500).json({ message: 'Error retrieving subject', error: error.message });
  }
};

// Update a subject by ID
export const updateSubject = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Missing id parameter' });

    const sanitized = sanitizeBody(req.body);
    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const docRef = db.collection('subjects').doc(id);
    const before = await docRef.get();
    if (!before.exists) return res.status(404).json({ message: 'Subject not found' });

    await docRef.update(sanitized);
    const after = await docRef.get();

    return res.status(200).json({ id: after.id, ...after.data() });
  } catch (error) {
    console.error('updateSubject error:', error);
    return res.status(400).json({ message: 'Error updating subject', error: error.message });
  }
};

// Delete a subject by ID
export const deleteSubject = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Missing id parameter' });

    const docRef = db.collection('subjects').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: 'Subject not found' });

    await docRef.delete();
    return res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('deleteSubject error:', error);
    return res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
};
