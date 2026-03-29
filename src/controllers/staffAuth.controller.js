import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';

async function verifyStaffPassword(plain, data) {
  const p = plain ?? '';
  const hash = data.passwordHash || data.password_hash;
  if (hash && String(hash).trim()) {
    try {
      if (await bcrypt.compare(String(p), String(hash))) return true;
    } catch {
      /* ignore */
    }
  }
  if (data.password != null && String(data.password) === String(p)) return true;
  return false;
}

async function findAdminDoc(uidTrim) {
  const col = db.collection('admins');
  const tryQueries = [
    () => col.where('adminUid', '==', uidTrim).limit(1).get(),
    () => col.where('uid', '==', uidTrim).limit(1).get(),
    () => col.where('staffId', '==', uidTrim).limit(1).get()
  ];
  for (const run of tryQueries) {
    const snap = await run();
    if (!snap.empty) return snap.docs[0];
  }
  const direct = await col.doc(uidTrim).get();
  if (direct.exists) return direct;
  return null;
}

async function findTeacherDoc(uidTrim) {
  const col = db.collection('teachers');
  const tryQueries = [
    () => col.where('uid', '==', uidTrim).limit(1).get(),
    () => col.where('staffId', '==', uidTrim).limit(1).get()
  ];
  for (const run of tryQueries) {
    const snap = await run();
    if (!snap.empty) return snap.docs[0];
  }
  const direct = await col.doc(uidTrim).get();
  if (direct.exists) return direct;
  return null;
}

export async function staffLogin(req, res) {
  try {
    const uid = String(req.body.uid ?? req.body.p_uid ?? '').trim();
    const password = req.body.password ?? req.body.p_password ?? '';
    if (!uid) {
      return res.status(400).json({ ok: false, message: 'UID is required' });
    }
    if (password === '' || password == null) {
      return res.status(400).json({ ok: false, message: 'Password is required' });
    }

    const adminDoc = await findAdminDoc(uid);
    if (adminDoc) {
      const data = adminDoc.data() || {};
      const ok = await verifyStaffPassword(password, data);
      if (!ok) {
        return res.status(401).json({ ok: false, message: 'Incorrect password' });
      }
      const publicUid = data.adminUid || data.uid || uid;
      return res.json({
        ok: true,
        role: 'admin',
        id: adminDoc.id,
        name: data.name || '',
        uid: publicUid,
        avatar: data.picture || data.profile_image_url || data.avatar || null
      });
    }

    const teacherDoc = await findTeacherDoc(uid);
    if (teacherDoc) {
      const data = teacherDoc.data() || {};
      const status = data.status != null ? String(data.status).toLowerCase().trim() : '';
      if (status === 'inactive') {
        return res.status(403).json({
          ok: false,
          message: 'Your account has been disabled. Contact the admin.'
        });
      }
      const ok = await verifyStaffPassword(password, data);
      if (!ok) {
        return res.status(401).json({ ok: false, message: 'Incorrect password' });
      }
      return res.json({
        ok: true,
        role: data.role && String(data.role).trim() ? String(data.role).trim() : 'teacher',
        id: teacherDoc.id,
        name: data.name || '',
        uid: data.uid || uid,
        avatar: data.avatar || data.picture || null
      });
    }

    return res.status(404).json({ ok: false, message: 'UID not found' });
  } catch (err) {
    console.error('staffLogin', err);
    return res.status(500).json({ ok: false, message: err.message || 'Login failed' });
  }
}
