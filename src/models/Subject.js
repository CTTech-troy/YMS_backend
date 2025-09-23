// backend/src/models/Subject.js
import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

/**
 * Firestore-backed Subject "model"
 * Provides minimal API similar to Mongoose used by the app:
 *  - static create(data)
 *  - static find()
 *  - static findById(id)
 *  - static findByIdAndUpdate(id, update, { new: true })
 *  - static findByIdAndDelete(id)
 */
const collectionRef = (/* optional */) => collection(db, 'subjects');

class Subject {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // create (replacement for new Subject(data).save())
  static async create(data = {}) {
    const docData = { ...data };
    // remove undefined fields (Firestore rejects undefined)
    Object.keys(docData).forEach(k => docData[k] === undefined && delete docData[k]);
    docData.createdAt = docData.createdAt || new Date().toISOString();
    const ref = await addDoc(collectionRef(), docData);
    const snap = await getDoc(ref);
    return { id: ref.id, ...snap.data() };
  }

  static async find() {
    const snapshot = await getDocs(collectionRef());
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async findById(id) {
    if (!id) return null;
    const ref = doc(db, 'subjects', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  static async findByIdAndUpdate(id, update = {}, options = { new: true }) {
    if (!id) return null;
    const ref = doc(db, 'subjects', id);
    const before = await getDoc(ref);
    if (!before.exists()) return null;

    const sanitized = Object.entries(update).reduce((acc, [k, v]) => {
      if (typeof v !== 'undefined') acc[k] = v;
      return acc;
    }, {});

    await updateDoc(ref, sanitized);

    if (options && options.new) {
      const after = await getDoc(ref);
      return { id: after.id, ...after.data() };
    }

    return { id: before.id, ...before.data() };
  }

  static async findByIdAndDelete(id) {
    if (!id) return null;
    const ref = doc(db, 'subjects', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() };
    await deleteDoc(ref);
    return data;
  }
}

export default Subject;