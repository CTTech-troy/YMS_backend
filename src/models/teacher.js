// backend/src/models/teacher.js
import { db } from "../config/firebase.js";

const TEACHERS_COLLECTION = "teachers";

export const TeacherModel = {
  async getAll() {
    const snapshot = await db.collection(TEACHERS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async create(data) {
    const ref = await db.collection(TEACHERS_COLLECTION).add(data);
    const doc = await ref.get();
    return { id: ref.id, ...doc.data() };
  },

  async update(id, data) {
    await db.collection(TEACHERS_COLLECTION).doc(id).update(data);
    const updatedDoc = await db.collection(TEACHERS_COLLECTION).doc(id).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  },

  async delete(id) {
    await db.collection(TEACHERS_COLLECTION).doc(id).delete();
    return true;
  },
};
