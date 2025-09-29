// backend/src/controllers/student.controller.js
import { db, admin } from "../config/firebase.js";
import { normalizeGender, normalizeGuardians } from "../models/student.js";

// Calculate age from a DOB string (best-effort). Returns null on invalid DOB.
function calculateAgeFromDOB(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

// Normalize religion input. Accepts common variants and returns canonical value or null if invalid.
// Canonical values: "Christian", "Muslim", "Other", or empty string when not provided.
function normalizeReligion(input) {
  if (input === undefined || input === null) return "";
  const s = String(input).trim().toLowerCase();
  if (s === "") return "";
  if (["christian", "christianity", "chr"].includes(s)) return "Christian";
  if (["muslim", "islam", "muslimah"].includes(s)) return "Muslim";
  if (["other", "others", "none"].includes(s)) return "Other";
  return null;
}

/**
 * Generate UID like YMS-25-001
 */
async function generateUid() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const prefix = `YMS-${year}`;
  const counterRef = db.collection("counters").doc(`students-${year}`);

  let nextSeq = 1;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    if (!snap.exists) {
      tx.set(counterRef, { seq: 1 });
      nextSeq = 1;
    } else {
      nextSeq = (snap.data().seq || 0) + 1;
      tx.update(counterRef, { seq: nextSeq });
    }
  });

  // Pad to 3 digits (001, 002, ... 010, 011 ...)
  return `${prefix}-${String(nextSeq).padStart(3, "0")}`;
}


/**
 * Resolve subjects from Firestore
 */
async function resolveSubjects(subjectList = []) {
  if (!Array.isArray(subjectList)) return [];

  const subjectsRef = db.collection("subjects");
  const resolved = [];

  for (const s of subjectList) {
    if (!s) continue;
    const snap = await subjectsRef
      .where("name", "==", String(s))
      .limit(1)
      .get();

    if (!snap.empty) {
      const doc = snap.docs[0];
      resolved.push({ id: doc.id, name: doc.data().name });
    }
  }
  return resolved;
}

/**
 * Parse a data URL or picture object into { mime, data } (base64)
 */
function parsePictureInput(p) {
  if (!p) return null;
  if (typeof p === "object" && p.mime && p.data) return { mime: p.mime, data: p.data };
  if (typeof p === "string") {
    // data:[mime];base64,[data]
    const m = p.match(/^data:(.+);base64,(.*)$/);
    if (m) return { mime: m[1], data: m[2] };
  }
  return null;
}

/**
 * Create Student
 */
async function createStudent(req, res) {
  try {
    const body = req.body;

    const uid = await generateUid();
    const gender = normalizeGender(body.gender);
    const guardians = normalizeGuardians(body.guardians || body.guardian);
    // compute age from DOB (if provided)
    const age = calculateAgeFromDOB(body.dob);

    // handle religion if provided
    let religion = "";
    if (body.religion !== undefined) {
      const r = normalizeReligion(body.religion);
      if (r === null) return res.status(400).json({ error: "Invalid religion" });
      religion = r;
    }

    if (gender === null)
      return res.status(400).json({ error: "Invalid gender" });
    if (!guardians)
      return res.status(400).json({ error: "1 to 3 guardians required" });

    const subjects = await resolveSubjects(body.subjects || []);

    // parse picture into { mime, data } and store base64 data (or empty string)
    const pictureObj = parsePictureInput(body.picture);
    const pictureToStore = pictureObj ? pictureObj : "";

    const studentData = {
      name: body.name || "",
      uid,
      linNumber: body.linNumber || "",
      dob: body.dob || "",
      age: age !== null ? age : null,
      gender,
      class: body.class || "",
      guardians,
      address: body.address || "",
      stateOfOrigin: body.stateOfOrigin || "",
      lga: body.lga || "",
      // store as object { mime, data } (data is base64)
      picture: pictureToStore,
      bloodGroup: body.bloodGroup || "",
      allergies: body.allergies || "",
      medicalConditions: body.medicalConditions || "",
      emergencyContactName: body.emergencyContactName || "",
      emergencyContactPhone: body.emergencyContactPhone || "",
      subjects,
      religion,
      results: {},
      joinDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("students").add(studentData);
    // ensure id field on document
    await ref.update({ id: ref.id });

    // return the created document data (so frontend can append/mapping)
    const doc = await ref.get();
    return res.status(201).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get Student
 */
async function getStudent(req, res) {
  try {
    const { id } = req.params;
    const doc = await db.collection("students").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Student not found" });
    return res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * List Students
 */
async function listStudents(req, res) {
  try {
    const snap = await db.collection("students").orderBy("createdAt", "desc").get();
    const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, data: students });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Add Result
 *
 * Simple scaffold: accepts body.tests (object of scores), body.session, body.term
 * Stores result under results["{session}_{term}"] on the student document.
 */
async function addResult(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!body.session || !body.term)
      return res.status(400).json({ error: "Session and term are required" });

    const tests = body.tests || {};
    const total = Object.values(tests).reduce((acc, v) => acc + Number(v || 0), 0);

    const result = {
      session: body.session,
      term: body.term,
      tests,
      total,
      note: body.note || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const studentRef = db.collection("students").doc(id);
    const doc = await studentRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Student not found" });

    const data = doc.data() || {};
    const results = data.results || {};
    const key = `${body.session}_${body.term}`;
    results[key] = result;

    await studentRef.update({
      results,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, resultKey: key });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Update student
 */
async function updateStudent(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const body = req.body || {};
    const docRef = db.collection("students").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Student not found" });

    // Validate/normalize fields where appropriate
    if (body.gender !== undefined) {
      const g = normalizeGender(body.gender);
      if (g === null) return res.status(400).json({ error: "Invalid gender" });
      body.gender = g;
    }
 
    if (body.guardians !== undefined || body.guardian !== undefined) {
      const guardians = normalizeGuardians(body.guardians || body.guardian);
      if (!guardians) return res.status(400).json({ error: "1 to 3 guardians required" });
      body.guardians = guardians;
    }
 
    if (body.subjects !== undefined) {
      body.subjects = await resolveSubjects(body.subjects || []);
    }

    // If DOB is provided on update, recompute age
    if (body.dob !== undefined) {
      const newAge = calculateAgeFromDOB(body.dob);
      body.age = newAge !== null ? newAge : null;
    }

    // If religion provided on update, validate/normalize it
    if (body.religion !== undefined) {
      const r = normalizeReligion(body.religion);
      if (r === null) return res.status(400).json({ error: "Invalid religion" });
      body.religion = r;
    }

    // parse picture if provided (accept data URL or {mime,data})
    if (body.picture !== undefined) {
      const pic = parsePictureInput(body.picture);
      body.picture = pic ? pic : ""; // store object or empty string
    }

    const allowed = [
      "name","linNumber","dob","gender","class","guardians","address",
      "stateOfOrigin","lga","picture","bloodGroup","allergies","medicalConditions",
      "emergencyContactName","emergencyContactPhone","subjects","age","religion"
    ];
    const updateData = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updateData[k] = body[k];
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await docRef.update(updateData);
    const updatedSnap = await docRef.get();
    return res.status(200).json({ success: true, data: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Delete student
 */
async function deleteStudent(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const docRef = db.collection("students").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Student not found" });
    await docRef.delete();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

// ✅ Use ESM export instead of module.exports
export { createStudent, getStudent, listStudents, addResult, updateStudent, deleteStudent };
