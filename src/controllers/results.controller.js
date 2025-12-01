import { db } from '../firebase.js';
// removed axios import to use global fetch instead

export const createResult = async (req, res) => {
  try {
    // accept common property names from the client
    const {
      studentId,
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

    // also allow alternate field names that might be sent
    const resolvedStudentUid = studentUid || req.body.studentuid || req.body.Uid || null;
    const resolvedStudentName = studentName || req.body.Name || null;
    const finalStudentId = studentId || req.body.studentid || req.body.id || null;

    if (!finalStudentId || !teacherUid || !session || !term || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: studentId, teacherUid, session, term, subjects' });
    }

    // declare vars to collect student info
    let apiStudentName = null;
    let apiStudentUid = null;
    let apiStudentClass = null;

    // ========================================
    // TRY FIRESTORE STUDENT DOC FIRST (fallback for name/class/uid)
    // ========================================
    const studentRef = db.collection('students').doc(finalStudentId);
    let firestoreStudentSnap = null;
    try {
      firestoreStudentSnap = await studentRef.get();
      if (firestoreStudentSnap.exists) {
        const s = firestoreStudentSnap.data() || {};
        apiStudentName = apiStudentName || s.name || s.fullName || s.studentName || null;
        apiStudentUid = apiStudentUid || s.uid || s.studentUid || null;
        apiStudentClass = apiStudentClass || s.class || s.studentClass || s.className || null;
      }
    } catch (e) {
      console.debug('createResult: failed to read student from Firestore (non-fatal)', e?.message || e);
    }

    // ========================================
    // FETCH STUDENT DATA FROM STUDENT API (if still missing)
    // ========================================
    const studentApiBase = process.env.STUDENT_API_URL || 'https://yms-backend-a2x4.onrender.com/api/students';
    try {
      const url = `${studentApiBase}/${encodeURIComponent(finalStudentId)}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        const data = json?.data ?? json; // support { data: {...} } and direct payload
        apiStudentName = apiStudentName || data?.name || data?.studentName || data?.fullName || null;
        apiStudentUid = apiStudentUid || data?.uid || data?.studentUid || data?.userId || null;
        apiStudentClass = apiStudentClass || data?.class || data?.studentClass || data?.className || data?.grade || data?.classroom || null;
      } else {
        console.warn(`createResult: student API returned status ${resp.status} for ${url}`);
      }
    } catch (fetchErr) {
      console.warn('createResult: failed to fetch student info from student API:', fetchErr?.message || fetchErr);
    }

    // ========================================
    // RESOLVE FINAL VALUES (prefer Firestore/API data, fallback to request body)
    // ========================================
    const finalStudentName = apiStudentName || resolvedStudentName || null;
    const finalStudentUid = apiStudentUid || resolvedStudentUid || null;
    const finalStudentClass = apiStudentClass || null;

    // ========================================
    // BUILD RESULT DOCUMENT
    // ========================================
    const resultData = {
      studentId: finalStudentId,
      ...(finalStudentName ? { studentName: String(finalStudentName) } : {}),
      ...(finalStudentUid ? { studentUid: String(finalStudentUid) } : {}),
      ...(finalStudentClass ? { studentClass: String(finalStudentClass) } : {}),
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

    // Save to Firestore
    const docRef = await db.collection('results').add(resultData);
    const snap = await docRef.get();
    const resultId = docRef.id;
    const resultDoc = snap.data();

    // ========================================
    // UPDATE STUDENT DOCUMENT WITH RESULT REF (and merge missing name/uid/class)
    // ========================================
    try {
      const studentSnap = firestoreStudentSnap || (await studentRef.get());
      if (studentSnap.exists) {
        const studentData = studentSnap.data() || {};
        const results = studentData.results || {};
        const resultKey = `${session}_${term}`;

        results[resultKey] = {
          id: resultId,
          createdAt: new Date().toISOString(),
          session,
          term,
          subjectCount: subjects.length
        };

        // Only add name/uid/class to student doc if missing to avoid overwriting authoritative data
        const studentUpdate = {
          results,
          lastResultSession: session,
          lastResultTerm: term,
          lastResultAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if (finalStudentName && !studentData.name) studentUpdate.name = finalStudentName;
        if (finalStudentUid && !studentData.uid) studentUpdate.uid = finalStudentUid;
        if (finalStudentClass && !studentData.class) studentUpdate.class = finalStudentClass;

        await studentRef.update(studentUpdate);
        console.debug(`createResult: updated student ${finalStudentId} with result ref`, { resultKey, resultId });
      } else {
        console.warn(`createResult: student document ${finalStudentId} not found, result created but not linked`);
      }
    } catch (e) {
      console.warn('createResult: failed to update student document with result ref (non-fatal)', e?.message || e);
    }

    return res.status(201).json({
      id: resultId,
      ...resultDoc,
      linkedToStudent: true
    });
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

    const resultData = snap.data();
    const studentId = resultData?.studentId;
    const session = resultData?.session;
    const term = resultData?.term;

    // ========================================
    // REMOVE RESULT REFERENCE FROM STUDENT
    // ========================================
    /**
     * When deleting a result, also remove its reference from the student's results field
     */
    if (studentId && session && term) {
      const studentRef = db.collection('students').doc(studentId);
      const studentSnap = await studentRef.get();
      
      if (studentSnap.exists) {
        const studentData = studentSnap.data() || {};
        const results = studentData.results || {};
        const resultKey = `${session}_${term}`;
        
        // Remove the result reference
        delete results[resultKey];
        
        await studentRef.update({ results });
        console.debug(`deleteResult: removed result ref from student ${studentId}`);
      }
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
