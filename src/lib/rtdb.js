import { rtdb } from "./firebase.js";
import { logError } from "../utils/log.js";

/**
 * Save base64 string to RTDB at path (ex: uploads/riders/{id}/image)
 */
export async function saveBase64ToRTDB(path, base64String) {
  try {
    if (!path || !base64String) throw new Error("Invalid path or base64String");
    const ref = rtdb.ref(path);
    await ref.set(String(base64String));
    return true;
  } catch (err) {
    logError("saveBase64ToRTDB", err);
    throw err;
  }
}

export async function getBase64FromRTDB(path) {
  try {
    const snap = await rtdb.ref(path).get();
    return snap.exists() ? snap.val() : null;
  } catch (err) {
    logError("getBase64FromRTDB", err);
    throw err;
  }
}

/**
 * Attach a listener. Returns an unsubscribe function.
 */
export function listenToRTDB(path, cb) {
  const ref = rtdb.ref(path);
  const handler = snap => cb(null, snap.val());
  const errHandler = e => cb(e);
  ref.on("value", handler, errHandler);
  return () => ref.off("value", handler);
}

export async function removeRTDB(path) {
  try {
    await rtdb.ref(path).remove();
    return true;
  } catch (err) {
    logError("removeRTDB", err);
    throw err;
  }
}