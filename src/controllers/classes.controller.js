import { db } from "../config/firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

/**
 * Create a new class (Firestore)
 */
export const createClass = async (req, res) => {
  try {
    const { teacherUid, subjectName, subjectClass, subjectCode, ...rest } = req.body;

    const payload = {
      ...rest,
      teacherUid: teacherUid || null,
      subjectName: subjectName || null,
      subjectClass: subjectClass || null,
      subjectCode: subjectCode || null,
      createdAt: new Date().toISOString(),
    };

    // Add to 'classes' collection
    const classesCol = collection(db, "classes");
    const createdRef = await addDoc(classesCol, payload);
    const createdDoc = await getDoc(createdRef);

    // Mirror to 'subjects_added'
    try {
      const mirrorCol = collection(db, "subjects_added");
      await addDoc(mirrorCol, {
        classId: createdRef.id,
        teacherUid: teacherUid || null,
        subjectName: subjectName || null,
        subjectClass: subjectClass || null,
        subjectCode: subjectCode || null,
        createdAt: new Date().toISOString(),
      });
    } catch (mirrorErr) {
      console.error("Failed to write subjects_added mirror:", mirrorErr);
    }

    res.status(201).json({ id: createdRef.id, ...createdDoc.data() });
  } catch (error) {
    console.error("createClass error:", error);
    res.status(400).json({ message: error.message || "Error creating class" });
  }
};

/**
 * Get all classes
 */
export const getClasses = async (req, res) => {
  try {
    const classesCol = collection(db, "classes");
    const snapshot = await getDocs(classesCol);
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.status(200).json(list);
  } catch (error) {
    console.error("getClasses error:", error);
    res.status(500).json({ message: error.message || "Error fetching classes" });
  }
};

/**
 * Get class by ID
 */
export const getClassById = async (req, res) => {
  try {
    const docRef = doc(db, "classes", req.params.id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error("getClassById error:", error);
    res.status(500).json({ message: error.message || "Error fetching class" });
  }
};

/**
 * Update class by ID
 */
export const updateClass = async (req, res) => {
  try {
    const docRef = doc(db, "classes", req.params.id);
    const before = await getDoc(docRef);
    if (!before.exists()) {
      return res.status(404).json({ message: "Class not found" });
    }

    const sanitized = Object.entries(req.body).reduce((acc, [k, v]) => {
      if (typeof v !== "undefined") acc[k] = v;
      return acc;
    }, {});

    await updateDoc(docRef, sanitized);
    const after = await getDoc(docRef);
    res.status(200).json({ id: after.id, ...after.data() });
  } catch (error) {
    console.error("updateClass error:", error);
    res.status(400).json({ message: error.message || "Error updating class" });
  }
};

/**
 * Delete class by ID
 */
export const deleteClass = async (req, res) => {
  try {
    const docRef = doc(db, "classes", req.params.id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ message: "Class not found" });
    }
    await deleteDoc(docRef);
    res.status(204).send();
  } catch (error) {
    console.error("deleteClass error:", error);
    res.status(500).json({ message: error.message || "Error deleting class" });
  }
};
