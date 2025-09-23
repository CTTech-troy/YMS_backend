// backend/src/controllers/teacher.controller.js
import { TeacherModel } from "../models/teacher.js";
import sharp from "sharp";
import admin from 'firebase-admin';

function generateTeacherUID(existingUIDs = []) {
  const yearShort = String(new Date().getFullYear()).slice(-2);
  const seqs = existingUIDs
    .filter(uid => uid && uid.startsWith(`YMS-S-${yearShort}`))
    .map(uid => {
      const m = uid.match(/(\d{2})$/);
      return m ? parseInt(m[1], 10) : 0;
    });

  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  const seqStr = String(next).padStart(2, "0");
  return `YMS-S-${yearShort}${seqStr}`;
}

export const TeacherController = {
  async createTeacher(req, res) {
    try {
      const teachers = (await TeacherModel.getAll()) || [];
      const uids = teachers.map(t => t.uid);

      const incomingUid = req.body.uid?.toString()?.trim();
      const incomingStaffId = req.body.staffId?.toString()?.trim();

      // If picture uploaded, compress to base64
      let pictureBase64 = "";
      if (req.file) {
        const compressedBuffer = await sharp(req.file.buffer)
          .resize({ width: 512, withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toBuffer();

        pictureBase64 = compressedBuffer.toString("base64");
      }

      // Build teacher payload (avoid undefined fields)
      const teacherData = {
        name: req.body.name ?? "",
        uid: incomingUid || generateTeacherUID(uids),
        email: req.body.email ?? "",
        phone: req.body.phone ?? "",
        dob: req.body.dob ?? "",
        qualifications: req.body.qualifications ?? "",
        stateOfOrigin: req.body.stateOfOrigin ?? "",
        schoolAttended: req.body.schoolAttended ?? "",
        yearsOfExperience: req.body.yearsOfExperience ?? "",
        status: req.body.status ?? "inactive",
        ...(pictureBase64 ? { picture: pictureBase64 } : {}),
        dateJoined: req.body.dateJoined ? new Date(req.body.dateJoined).toISOString() : new Date().toISOString(),
        address: req.body.address ?? "",
        nextOfKin: req.body.nextOfKin ?? "",
        nextOfKinPhone: req.body.nextOfKinPhone ?? "",
        relationship: req.body.relationship ?? "",
        assignedClass: req.body.assignedClass ?? "",
        subjects: req.body.subjects ?? [],
        password: req.body.initPassword ?? req.body.password ?? "1234567890",
        createdAt: new Date().toISOString(),
      };

      // Include staffId only when provided
      if (incomingStaffId) {
        teacherData.staffId = incomingStaffId;
      }

      const db = admin.firestore();

      // Stronger DB-level uniqueness guard when staffId is provided:
      // 1) Query existing docs with same staffId (handles older docs that used different doc IDs).
      // 2) If none, write a document using staffId as the document ID to guarantee uniqueness.
      if (incomingStaffId) {
        const q = await db.collection('teachers').where('staffId', '==', incomingStaffId).limit(1).get();
        if (!q.empty) {
          return res.status(400).json({ message: 'Teacher already exists' });
        }

        // Use staffId as the document id to avoid race-duplicate creation
        const docRef = db.collection('teachers').doc(incomingStaffId);
        // Double-check doc doesn't already exist (atomicity)
        const existingDoc = await docRef.get();
        if (existingDoc.exists) {
          return res.status(400).json({ message: 'Teacher already exists' });
        }

        await docRef.set(teacherData);
        const createdSnap = await docRef.get();
        return res.status(201).json({ id: docRef.id, ...createdSnap.data() });
      }

      // Fallback: no staffId provided — keep previous uniqueness checks before creating
      const existing = teachers.find(t =>
        (incomingUid && String(t.uid || '').toLowerCase() === incomingUid.toLowerCase()) ||
        (req.body.email && String(t.email || '').toLowerCase() === String(req.body.email).toLowerCase()) ||
        (req.body.phone && String(t.phone || '').toLowerCase() === String(req.body.phone).toLowerCase())
      );

      if (existing) {
        return res.status(409).json({ message: 'Teacher already exists (uid or email/phone). Use update endpoint to modify.', existing });
      }

      // Create via model (keeps existing behavior for older entries)
      const newTeacher = await TeacherModel.create(teacherData);
      res.status(201).json(newTeacher);
    } catch (error) {
      console.error("Error creating teacher:", error);
      res.status(500).json({ error: "Failed to create teacher", message: error.message });
    }
  },

  // New: return a single teacher by DB id or by UID/staffId
  async getTeacher(req, res) {
    try {
      const { id } = req.params;
      const teachers = (await TeacherModel.getAll()) || [];
      if (!Array.isArray(teachers)) {
        return res.status(500).json({ error: "Invalid teachers data" });
      }

      // match by common id fields or by teacher UID/staffId
      const teacher = teachers.find(t =>
        String(t.id) === String(id) ||
        String(t._id) === String(id) ||
        String(t.uid || "").toLowerCase() === String(id).toLowerCase() ||
        String(t.staffId || "").toLowerCase() === String(id).toLowerCase()
      );

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      res.json(teacher);
    } catch (error) {
      console.error("Error fetching teacher:", error);
      res.status(500).json({ error: "Failed to fetch teacher", message: error.message });
    }
  },

  async getAllTeachers(req, res) {
    try {
      const teachers = await TeacherModel.getAll();
      res.json(teachers || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  },

  async updateTeacher(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      if (updates.initPassword) {
        updates.password = updates.initPassword; // no hashing
        delete updates.initPassword;
      }

      if (req.file) {
        const compressedBuffer = await sharp(req.file.buffer)
          .resize({ width: 512, withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toBuffer();

        updates.picture = compressedBuffer.toString("base64");
      }

      // Ensure we do not accidentally create a new record: require id and call update only
      if (!id) return res.status(400).json({ error: "Missing teacher id for update" });

      const updatedTeacher = await TeacherModel.update(id, updates);
      if (!updatedTeacher) return res.status(404).json({ error: "Teacher not found" });

      res.json(updatedTeacher);
    } catch (error) {
      console.error("Error updating teacher:", error);
      res.status(500).json({ error: "Failed to update teacher", message: error.message });
    }
  },

  async deleteTeacher(req, res) {
    try {
      const { id } = req.params;
      await TeacherModel.delete(id);
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      res.status(500).json({ error: "Failed to delete teacher" });
    }
  },
};
