import { db } from '../firebase.js';
import axios from 'axios';


export const createResult = async (req, res) => {
  try {
    const {
      studentId,
      studentuid,
      studentUid,
      studentName,
      picture,
      session,
      term,
      subjects,
      teacherComment = '',
      principalComment = '',
      teacherUid
    } = req.body;

    // resolve possible student UID variants sent from frontend
    const resolvedStudentUid = studentUid || studentuid || req.body.studdentUid || null;

    if (!studentId || !teacherUid || !session || !term || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: studentId, teacherUid, session, term, subjects' });
    }

    // Try to get student info from the student API (if available)
    // Set STUDENT_API_URL in env (e.g. "http://localhost:3000/api/students") or it will default to the localhost path
    const studentApiBase = process.env.STUDENT_API_URL || 'http://localhost:3000/api/students';
    let apiStudentName = null;
    let apiStudentUid = null;
    try {
      const url = `${studentApiBase}/${encodeURIComponent(studentId)}`;
      const resp = await axios.get(url);
      if (resp && resp.data) {
        // accommodate common field names from different student APIs
        apiStudentName = resp.data.name || resp.data.studentName || resp.data.fullName || null;
        apiStudentUid = resp.data.uid || resp.data.studentUid || resp.data.userId || null;
      }
    } catch (fetchErr) {
      // don't fail the whole request if the student API is unavailable — just log and continue
      console.warn('createResult: failed to fetch student info from student API:', fetchErr.message || fetchErr);
    }

    // Prefer student info from the student API, fallback to request body or resolved UID
    const finalStudentName = apiStudentName || studentName || null;
    const finalStudentUid = apiStudentUid || resolvedStudentUid || null;

    const resultData = {
      studentId,
      // include resolved student info when available
      ...(finalStudentName ? { studentName: String(finalStudentName) } : {}),
      ...(picture ? { picture: String(picture) } : {}),
      session,
      term,
      subjects,
      teacherComment,
      principalComment,
      teacherUid,
      commentStatus: String(teacherComment).trim() !== '',
      published: 'no',
      createdAt: new Date().toISOString()
    };

    // Only include studentUid when we have a value (avoid undefined Firestore error)
    if (finalStudentUid) {
      resultData.studentUid = String(finalStudentUid);
    }

    const docRef = await db.collection('results').add(resultData);
    const snap = await docRef.get();
    return res.status(201).json({ id: docRef.id, ...snap.data() });
  } catch (err) {
    console.error('createResult error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create result' });
  }
};

export const getAllResults = async (req, res) => {
  try {
    const publishedQuery = (req.query.published || '').toLowerCase(); // 'yes' | 'no' | 'all' | ''
    let collectionRef = db.collection('results');

    if (publishedQuery === 'yes') {
      collectionRef = collectionRef.where('published', '==', 'yes');
    } else if (publishedQuery === 'no') {
      collectionRef = collectionRef.where('published', '==', 'no');
    }

    const snapshot = await collectionRef.get();
    const results = [];
    snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    return res.status(200).json(results);
  } catch (err) {
    console.error('getAllResults error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch results' });
  }
};

export const getResultById = async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection('results').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: 'Result not found' });
    return res.status(200).json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error('getResultById error:', err);
    return res.status(500).json({ message: err.message || 'Failed to fetch result' });
  }
};

export const updateResult = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body || {};
    const docRef = db.collection('results').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: 'Result not found' });

    await docRef.update(updates);
    const updated = await docRef.get();
    return res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('updateResult error:', err);
    return res.status(500).json({ message: err.message || 'Failed to update result' });
  }
};

export const deleteResult = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Result id required' });

    const docRef = db.collection('results').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ message: 'Result not found' });
    }

    await docRef.delete();
    return res.status(200).json({ message: 'Result deleted' });
  } catch (err) {
    console.error('deleteResult error:', err);
    return res.status(500).json({ message: err.message || 'Failed to delete result' });
  }
};

// Admin action: publish a result
export const publishResult = async (req, res) => {
  try {
    const id = req.params.id;
    const docRef = db.collection('results').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: 'Result not found' });

    await docRef.update({ published: 'yes', publishedAt: new Date().toISOString() });
    const updated = await docRef.get();
    return res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('publishResult error:', err);
    return res.status(500).json({ message: err.message || 'Failed to publish result' });
  }
};

// Student checks result (example: check by id and optional pin)
export const checkResult = async (req, res) => {
  try {
    const { id, pin } = req.body;
    if (!id) return res.status(400).json({ message: 'Result id required' });

    const docRef = db.collection('results').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ message: 'Result not found' });

    const data = snap.data();
    // If you store a scratch/pin, compare here. If not, just return the result (only if published)
    if (data.published !== 'yes') return res.status(403).json({ message: 'Result not published yet' });

    // optional pin check
    if (data.scratchPin && pin && String(data.scratchPin) !== String(pin)) {
      return res.status(400).json({ message: 'Invalid pin' });
    }

    return res.status(200).json({ id: snap.id, ...data });
  } catch (err) {
    console.error('checkResult error:', err);
    return res.status(500).json({ message: err.message || 'Failed to check result' });
  }
};

export default {
  createResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
  publishResult,
  checkResult
};
