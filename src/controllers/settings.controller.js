import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';

const PORTAL_DOC = 'settings/portal';

const defaults = {
  studentResultAccessMode: 'both',
  scratchCardLoginEnabled: true
};

export async function getPortalSettings(req, res) {
  try {
    const snap = await db.doc(PORTAL_DOC).get();
    const data = snap.exists ? { ...defaults, ...snap.data() } : defaults;
    const hasGeneral =
      Boolean(data.studentPortalPasswordHash) && String(data.studentPortalPasswordHash).trim().length > 0;
    return res.json({
      success: true,
      studentResultAccessMode: data.studentResultAccessMode || defaults.studentResultAccessMode,
      scratchCardLoginEnabled: data.scratchCardLoginEnabled !== false,
      hasStudentPortalPassword: hasGeneral
    });
  } catch (err) {
    console.error('getPortalSettings', err);
    return res.status(500).json({ message: err.message || 'Failed to load settings' });
  }
}

export async function updatePortalSettings(req, res) {
  try {
    const body = req.body || {};
    const studentResultAccessMode = body.studentResultAccessMode;
    const scratchCardLoginEnabled = body.scratchCardLoginEnabled;
    const newStudentPortalPassword = body.newStudentPortalPassword;
    const clearStudentPortalPassword = body.clearStudentPortalPassword === true;

    const allowed = ['password_only', 'scratch_only', 'both'];
    const patch = { updatedAt: new Date().toISOString() };

    if (studentResultAccessMode !== undefined) {
      if (!allowed.includes(String(studentResultAccessMode))) {
        return res.status(400).json({ message: 'Invalid studentResultAccessMode' });
      }
      patch.studentResultAccessMode = studentResultAccessMode;
    }
    if (scratchCardLoginEnabled !== undefined) {
      patch.scratchCardLoginEnabled = Boolean(scratchCardLoginEnabled);
    }
    if (clearStudentPortalPassword) {
      patch.studentPortalPasswordHash = null;
    } else if (newStudentPortalPassword !== undefined && newStudentPortalPassword !== null) {
      const p = String(newStudentPortalPassword);
      if (p.length > 0) {
        if (p.length < 6) {
          return res.status(400).json({ message: 'General student password must be at least 6 characters' });
        }
        const salt = await bcrypt.genSalt(10);
        patch.studentPortalPasswordHash = await bcrypt.hash(p, salt);
      }
    }

    await db.doc(PORTAL_DOC).set(patch, { merge: true });
    const snap = await db.doc(PORTAL_DOC).get();
    const merged = snap.exists ? { ...defaults, ...snap.data() } : defaults;
    const hasGeneral =
      Boolean(merged.studentPortalPasswordHash) && String(merged.studentPortalPasswordHash).trim().length > 0;
    const { studentPortalPasswordHash: _omit, ...safe } = merged;
    return res.json({
      success: true,
      ...safe,
      hasStudentPortalPassword: hasGeneral
    });
  } catch (err) {
    console.error('updatePortalSettings', err);
    return res.status(500).json({ message: err.message || 'Failed to save settings' });
  }
}
