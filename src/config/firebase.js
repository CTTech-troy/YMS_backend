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


if (process.env.NODE_ENV==="production") {
  console.log(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  // Load from .env
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} else {
  // Fallback: load from JSON file
  const serviceAccountPath = path.join(__dirname, "./YMSchool.json");
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
}
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
 