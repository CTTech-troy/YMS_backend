import { firestore } from 'firebase-admin';

if (!firestore) {
  throw new Error('Firestore is not initialized. Make sure backend/src/config/firebase.js is present and initialized.');
}

const collection = firestore.collection('classes');

/**
 * Firestore-backed replacement for the Mongoose Class model.
 * Mirrors the minimal Mongoose API used by existing controllers:
 *  - constructor(data) + .save()
 *  - static find()
 *  - static findById(id)
 *  - static findByIdAndUpdate(id, update, { new: true })
 *  - static findByIdAndDelete(id)
 */
class Class {
  constructor(data = {}) {
    // allow passing mongoose-like fields; keep them as plain object properties
    Object.assign(this, data);
  }

  // emulate `new Class(data).save()`
  async save() {
    const doc = { ...this };
    // remove any id property before saving
    if (doc.id) delete doc.id;
    if (doc._id) delete doc._id;
    doc.createdAt = doc.createdAt || new Date().toISOString();

    const ref = await collection.add(doc);
    const snap = await ref.get();
    return { id: ref.id, ...snap.data() };
  }

  // emulate Class.find()
  static async find() {
    const snapshot = await collection.get();
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // emulate Class.findById(id)
  static async findById(id) {
    if (!id) return null;
    const doc = await collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  // emulate Class.findByIdAndUpdate(id, update, { new: true })
  static async findByIdAndUpdate(id, update = {}, options = { new: true }) {
    if (!id) return null;
    const ref = collection.doc(id);
    const before = await ref.get();
    if (!before.exists) return null;

    // convert any undefined fields by removing them, Firestore rejects undefined
    const sanitized = Object.entries(update).reduce((acc, [k, v]) => {
      if (typeof v !== 'undefined') acc[k] = v;
      return acc;
    }, {});

    await ref.update(sanitized);

    if (options && options.new) {
      const after = await ref.get();
      return { id: after.id, ...after.data() };
    }

    return { id: before.id, ...before.data() };
  }

  // emulate Class.findByIdAndDelete(id)
  static async findByIdAndDelete(id) {
    if (!id) return null;
    const ref = collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = { id: doc.id, ...doc.data() };
    await ref.delete();
    return data;
  }
}

module.exports = Class;