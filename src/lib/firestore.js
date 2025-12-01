import { db } from "./firebase.js";
import { logError, logInfo } from "../utils/log.js";

const DEFAULT_TIMEOUT = 10000; // 10s

export function promiseTimeout(promise, ms = DEFAULT_TIMEOUT) {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), ms));
  return Promise.race([promise, timeout]);
}

export async function saveDocument(collection, id, data) {
  try {
    const ref = id ? db.collection(collection).doc(String(id)) : db.collection(collection).doc();
    await promiseTimeout(ref.set(data, { merge: true }));
    return { id: ref.id, ...data };
  } catch (err) {
    logError("saveDocument", err);
    throw err;
  }
}

export async function getDocument(collection, id) {
  try {
    const docRef = db.collection(collection).doc(String(id));
    const snap = await promiseTimeout(docRef.get());
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    logError("getDocument", err);
    throw err;
  }
}

export async function queryCollection(collection, filters = [], opts = {}) {
  try {
    let q = db.collection(collection);
    for (const f of filters) {
      // expect { field, op, value }
      if (!f || !f.field) continue;
      q = q.where(f.field, f.op || "==", f.value);
    }
    if (opts.orderBy) q = q.orderBy(opts.orderBy.field, opts.orderBy.dir || "desc");
    if (opts.limit) q = q.limit(opts.limit);
    const snap = await promiseTimeout(q.get());
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { docs, lastId: snap.docs[snap.docs.length - 1]?.id || null };
  } catch (err) {
    logError("queryCollection", err);
    throw err;
  }
}

export async function paginate(collection, limit = 20, startAfterId = null, opts = {}) {
  try {
    let q = db.collection(collection).orderBy(opts.orderBy?.field || "createdAt", opts.orderBy?.dir || "desc").limit(limit + 1);
    if (startAfterId) {
      const startSnap = await promiseTimeout(db.collection(collection).doc(String(startAfterId)).get());
      if (startSnap.exists) q = q.startAfter(startSnap);
    }
    const snap = await promiseTimeout(q.get());
    const hasMore = snap.docs.length > limit;
    const docs = (hasMore ? snap.docs.slice(0, limit) : snap.docs).map(d => ({ id: d.id, ...d.data() }));
    const lastId = docs.length ? docs[docs.length - 1].id : null;
    return { docs, lastId, hasMore };
  } catch (err) {
    logError("paginate", err);
    throw err;
  }
}