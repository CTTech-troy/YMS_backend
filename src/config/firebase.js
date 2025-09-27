// backend/src/config/firebase.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

function tryParseEnv(val) {
  if (!val) return null;
  // try raw JSON
  try { return JSON.parse(val); } catch (e) { /* continue */ }
  // try base64 -> JSON
  try {
    const decoded = Buffer.from(val, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch (e) { return null; }
}

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = tryParseEnv(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!serviceAccount) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT: could not parse JSON (try base64-encoding the JSON).");
  }
} else {
  const serviceAccountPath = path.join(__dirname, "./YMSchool.json");
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
