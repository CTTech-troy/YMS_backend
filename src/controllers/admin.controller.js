import { db, auth } from "../config/firebase.js";

/**
 * Generate Admin UID (YMS-AD-25XX)
 */
const generateAdminUid = async () => {
  const year = new Date().getFullYear().toString().slice(-2); // e.g. "25"
  const snapshot = await db.collection("admins").get();
  const count = snapshot.size ? snapshot.size + 1 : 1;
  const seq = String(count).padStart(2, "0"); // "01", "02" ...
  return `YMS-AD-${year}${seq}`;
};

/**
 * Create Admin (only allowed fields)
 */
export const createAdmin = async (req, res) => {
  try {
    // Extract only allowed fields
    const {
      authUid,
      name,
      email,
      phone,
      password,
      picture,
      uid
    } = req.body;

    // Require name (must have at least a name)
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Generate adminUid
    const adminUid = await generateAdminUid();

    // Normalize values
    const payload = {
      adminUid,
      authUid: authUid || "system",
      name,
      email: email || "",
      phone: phone || "",
      password: password || "1234567890", // ⚠️ hash before storing in production
      picture: picture || "",
      uid: uid || "",
      createdAt: new Date(),
    };

    // Save admin record in Firestore
    await db.collection("admins").add(payload);

    res.status(201).json({
      message: "Admin created successfully",
      admin: payload,
    });
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * List Admins
 */
export const listAdmins = async (req, res) => {
  try {
    const snapshot = await db.collection("admins").get();
    const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(admins);
  } catch (err) {
    console.error("Error listing admins:", err);
    return res.status(500).json({ error: "Could not retrieve admins" });
  }
};

// Delete Admin by UID (Firestore doc id is expected to be the auth UID)
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Admin id is required" });

    // Delete Firestore document (admins collection)
    await db.collection("admins").doc(id).delete();

    // Try to delete the Firebase Auth user (best-effort)
    try {
      await auth.deleteUser(id);
    } catch (err) {
      // don't fail operation if auth delete fails (log for inspection)
      console.warn("Failed to delete auth user:", err?.message || err);
    }

    return res.json({ message: "Admin deleted" });
  } catch (err) {
    console.error("Error deleting admin:", err);
    return res.status(500).json({ error: "Could not delete admin" });
  }
};
