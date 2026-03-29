import { db } from '../config/firebase.js';

export function toPublicStudent(docId, data) {
  if (!data) return null;
  let picture = null;
  const p = data.picture;
  if (typeof p === 'string') picture = p;
  else if (p && typeof p === 'object' && p.mime && p.data) {
    picture = { mime: p.mime, data: p.data };
  }
  return {
    id: docId,
    uid: data.uid || '',
    name: data.name || '',
    class: data.class || '',
    linNumber: data.linNumber || '',
    picture
  };
}

async function findStudentDocByNumber(q) {
  const trimmed = String(q ?? '').trim();
  if (!trimmed) return null;

  const byId = await db.collection('students').doc(trimmed).get();
  if (byId.exists) return byId;

  let snap = await db.collection('students').where('uid', '==', trimmed).limit(1).get();
  if (!snap.empty) return snap.docs[0];

  snap = await db.collection('students').where('linNumber', '==', trimmed).limit(1).get();
  if (!snap.empty) return snap.docs[0];

  const upper = trimmed.toUpperCase();
  if (upper !== trimmed) {
    snap = await db.collection('students').where('uid', '==', upper).limit(1).get();
    if (!snap.empty) return snap.docs[0];
  }

  return null;
}

export async function lookupStudent(req, res) {
  try {
    const number = req.query.number ?? req.query.q ?? req.query.studentNumber;
    const doc = await findStudentDocByNumber(number);
    if (!doc || !doc.exists) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    const data = doc.data() || {};
    return res.json({
      success: true,
      student: toPublicStudent(doc.id, data)
    });
  } catch (err) {
    console.error('lookupStudent', err);
    return res.status(500).json({ success: false, message: err.message || 'Lookup failed' });
  }
}

export { findStudentDocByNumber, toPublicStudent };
