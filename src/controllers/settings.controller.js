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
    return res.json({
      success: true,
      studentResultAccessMode: data.studentResultAccessMode || defaults.studentResultAccessMode,
      scratchCardLoginEnabled: data.scratchCardLoginEnabled !== false
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

    await db.doc(PORTAL_DOC).set(patch, { merge: true });
    const snap = await db.doc(PORTAL_DOC).get();
    return res.json({ success: true, ...defaults, ...snap.data() });
  } catch (err) {
    console.error('updatePortalSettings', err);
    return res.status(500).json({ message: err.message || 'Failed to save settings' });
  }
}
