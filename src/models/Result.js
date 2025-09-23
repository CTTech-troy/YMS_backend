const { db } = require('../config/firebase');
const Result = mongoose.model('Result', resultSchema);
async function findByStudentAndCard(studentId, cardNumber) {
  const q = await db
    .collection('results')
    .where('student.uid', '==', String(studentId).trim())
    .where('cardNumber', '==', String(cardNumber).trim())
    .limit(1)
    .get();

  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function createResult(payload) {
  const ref = await db.collection('results').add(payload);
  const doc = await ref.get();
  return { id: ref.id, ...doc.data() };
}

module.exports = { Result, findByStudentAndCard, createResult };