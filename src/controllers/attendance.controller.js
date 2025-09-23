import { db, admin } from '../config/firebase.js';

// POST /api/attendance/mark/:id  -> studentId in params
export async function markAttendance(req, res) {
  try {
    const studentId = req.params.id;
    if (!studentId) {
      return res.status(400).json({ error: 'student id required' });
    }

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be JSON' });
    }

    const status = req.body.status ? String(req.body.status) : 'present';
    const rawDate = req.body.date;
    const dateObj = rawDate ? new Date(rawDate) : new Date();
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const dateKey = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD

    // Check if attendance exists by studentId + dateKey
    const q = db.collection('attendance')
      .where('studentId', '==', String(studentId))
      .where('dateKey', '==', dateKey)
      .limit(1);

    const snap = await q.get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      await doc.ref.update({
        status,
        date: admin.firestore.Timestamp.fromDate(dateObj),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const updated = await doc.ref.get();
      return res.status(200).json({ id: updated.id, updated: true });
    } else {
      const docRef = db.collection('attendance').doc();
      await docRef.set({
        studentId: String(studentId),
        status,
        date: admin.firestore.Timestamp.fromDate(dateObj),
        dateKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        meta: {
          userAgent: req.headers['user-agent'] || null,
          ip: req.ip || req.headers['x-forwarded-for'] || null,
        },
      });
      return res.status(201).json({ id: docRef.id, created: true });
    }
  } catch (err) {
    console.error('markAttendance error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// GET /api/attendance/:id  -> studentId
// optional ?date=YYYY-MM-DD
export async function getAttendance(req, res) {
  try {
    const studentId = req.params.id;
    if (!studentId) return res.status(400).json({ error: 'student id required' });

    const dateQuery = req.query.date;
    let q = db.collection('attendance').where('studentId', '==', String(studentId));

    if (dateQuery) {
      q = q.where('dateKey', '==', dateQuery);
    }

    // no orderBy to avoid index
    const snap = await q.get();
    if (snap.empty) {
      return res.json([]);
    }

    const records = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        studentId: d.studentId,
        status: d.status,
        date: d.date ? d.date.toDate().toISOString() : null,
        createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
        updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
      };
    });

    // sort in memory if needed
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json(records);
  } catch (err) {
    console.error('getAttendance error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// PUT /api/attendance/:id -> update attendance by doc id
export async function updateAttendance(req, res) {
  try {
    const attendanceId = req.params.id;
    if (!attendanceId) return res.status(400).json({ error: 'attendance id required' });

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Request body must be JSON' });
    }

    const payload = {};
    if (req.body.status !== undefined) payload.status = String(req.body.status);
    if (req.body.date !== undefined) {
      const d = new Date(req.body.date);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid date format' });
      payload.date = admin.firestore.Timestamp.fromDate(d);
      payload.dateKey = d.toISOString().slice(0, 10);
    }
    payload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const docRef = db.collection('attendance').doc(String(attendanceId));
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Attendance record not found' });

    await docRef.update(payload);
    const updatedSnap = await docRef.get();
    const d = updatedSnap.data();

    return res.json({
      id: updatedSnap.id,
      studentId: d.studentId,
      status: d.status,
      date: d.date ? d.date.toDate().toISOString() : null,
      updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
    });
  } catch (err) {
    console.error('updateAttendance error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// DELETE /api/attendance/:id
export async function deleteAttendance(req, res) {
  try {
    const attendanceId = req.params.id;
    if (!attendanceId) return res.status(400).json({ error: 'attendance id required' });

    const docRef = db.collection('attendance').doc(String(attendanceId));
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Attendance record not found' });

    await docRef.delete();
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteAttendance error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
