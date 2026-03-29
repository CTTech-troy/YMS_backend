import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';
import { findStudentDocByNumber, toPublicStudent } from './studentPortal.controller.js';

async function getPortalMode() {
  const snap = await db.doc('settings/portal').get();
  const d = snap.exists ? snap.data() : {};
  const mode = d.studentResultAccessMode || 'both';
  const scratchOn = d.scratchCardLoginEnabled !== false;
  return { mode, scratchOn };
}

export async function loginWithPassword(req, res) {
  try {
    const { studentNumber, password } = req.body || {};
    if (!studentNumber || !password) {
      return res.status(400).json({ success: false, message: 'Student number and password are required' });
    }

    const { mode } = await getPortalMode();
    if (mode === 'scratch_only') {
      return res.status(403).json({ success: false, message: 'Password login is disabled' });
    }

    const doc = await findStudentDocByNumber(studentNumber);
    if (!doc || !doc.exists) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const data = doc.data() || {};
    const hash = data.passwordHash;
    if (!hash) {
      return res.status(403).json({
        success: false,
        message: 'No password set. Contact the school administrator.'
      });
    }

    const ok = await bcrypt.compare(String(password), String(hash));
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    return res.json({
      success: true,
      student: toPublicStudent(doc.id, data)
    });
  } catch (err) {
    console.error('loginWithPassword', err);
    return res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
}

export async function loginWithScratchCard(req, res) {
  try {
    const { studentNumber, pin } = req.body || {};
    if (!studentNumber || !pin) {
      return res.status(400).json({ success: false, message: 'Student number and scratch card PIN are required' });
    }

    const { mode, scratchOn } = await getPortalMode();
    if (!scratchOn || mode === 'password_only') {
      return res.status(403).json({ success: false, message: 'Scratch card login is disabled' });
    }

    const studentDoc = await findStudentDocByNumber(studentNumber);
    if (!studentDoc || !studentDoc.exists) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const studentData = studentDoc.data() || {};
    const studentUid = String(studentData.uid || '');

    const pinNorm = String(pin).trim().toUpperCase();
    const snap = await db.collection('scratchCards').where('pin', '==', pinNorm).limit(5).get();
    if (snap.empty) {
      return res.status(401).json({ success: false, message: 'Invalid scratch card' });
    }

    const cardDoc = snap.docs[0];
    const card = cardDoc.data() || {};

    if (card.status === 'used') {
      return res.status(403).json({ success: false, message: 'This scratch card has already been used' });
    }

    if (card.expiresAt) {
      const ex = new Date(card.expiresAt);
      if (!Number.isNaN(ex.getTime()) && ex.getTime() < Date.now()) {
        await cardDoc.ref.update({ status: 'expired', expiredCheckedAt: new Date().toISOString() }).catch(() => {});
        return res.status(403).json({ success: false, message: 'This scratch card has expired' });
      }
    }

    await cardDoc.ref.update({
      status: 'used',
      usedAt: new Date().toISOString(),
      usedByStudentUid: studentUid,
      usedByStudentDocId: studentDoc.id
    });

    return res.json({
      success: true,
      student: toPublicStudent(studentDoc.id, studentData)
    });
  } catch (err) {
    console.error('loginWithScratchCard', err);
    return res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
}
