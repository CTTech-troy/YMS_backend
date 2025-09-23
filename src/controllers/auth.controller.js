// backend/src/controllers/auth.controller.js
import { TeacherModel } from "../models/teacher.js";

/**
 * Login endpoint
 * Expects JSON body: { uid, password }
 */
export const login = async (req, res) => {
  try {
    const { uid, password } = req.body;
    if (!uid || !password) {
      return res.status(400).json({ error: "UID and password are required" });
    }

    const teacher = await TeacherModel.findByUid(uid);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // no hash comparison; plain text check
    if (teacher.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // simple response (in production use JWT or session)
    return res.json({
      id: teacher.id,
      uid: teacher.uid,
      name: teacher.name,
      email: teacher.email,
      role: "teacher",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed", message: err.message });
  }
};

/**
 * Change password endpoint
 * Expects JSON body: { uid, oldPassword, newPassword }
 */
export const changePassword = async (req, res) => {
  try {
    const { uid, oldPassword, newPassword } = req.body;
    if (!uid || !oldPassword || !newPassword) {
      return res.status(400).json({ error: "UID, oldPassword, and newPassword are required" });
    }

    const teacher = await TeacherModel.findByUid(uid);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // no hash check, plain text comparison
    if (teacher.password !== oldPassword) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }

    // update password in Firebase
    const updated = await TeacherModel.update(teacher.id, { password: newPassword });

    return res.json({ success: true, message: "Password updated successfully", teacher: { id: updated.id, uid: updated.uid } });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Failed to change password", message: err.message });
  }
};

/**
 * Simple route to check authentication
 */
export const profile = async (req, res) => {
  try {
    const { uid } = req.body;
    const teacher = await TeacherModel.findByUid(uid);
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    return res.json({ id: teacher.id, uid: teacher.uid, name: teacher.name, email: teacher.email });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ error: "Failed to fetch profile", message: err.message });
  }
};

// Export wrapper for compatibility with routes that expect AuthController
export const AuthController = {
  login,
  changePassword,
  profile,
};
