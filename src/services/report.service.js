import { db } from '../config/firebase.js';

const LIMIT = 500;

export async function getAttendanceReportData(query = {}) {
  let ref = db.collection('attendance');
  const studentId = query.studentId;
  if (studentId) {
    ref = ref.where('studentId', '==', String(studentId));
  }
  const snap = await ref.limit(LIMIT).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getResultsReportData(query = {}) {
  const snap = await db.collection('results').limit(LIMIT).get();
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (query.session) {
    rows = rows.filter((r) => String(r.session) === String(query.session));
  }
  if (query.term) {
    rows = rows.filter((r) => String(r.term) === String(query.term));
  }
  return rows;
}

export async function getSummaryReportData() {
  const [attSnap, resSnap, stSnap] = await Promise.all([
    db.collection('attendance').limit(2000).get(),
    db.collection('results').limit(2000).get(),
    db.collection('students').limit(2000).get()
  ]);
  return {
    attendanceRecords: attSnap.size,
    resultRecords: resSnap.size,
    studentRecords: stSnap.size,
    generatedAt: new Date().toISOString()
  };
}
