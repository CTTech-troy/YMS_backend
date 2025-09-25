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

function normalizePrivateKey(key) {
  if (!key) return key;
  // handle both literal "\n" sequences and actual newline representations
  if (key.includes("\\n")) return key.replace(/\\n/g, "\n");
  return key;
}

function parseServiceAccountFromEnv(envValue) {
  if (!envValue) return null;
  // try raw JSON
  try {
    return JSON.parse(envValue);
  } catch (e) {
    // try base64 -> JSON
    try {
      const decoded = Buffer.from(envValue, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch (err) {
      // try decodeURIComponent (sometimes set via UI)
      try {
        return JSON.parse(decodeURIComponent(envValue));
      } catch (err2) {
        return null;
      }
    }
  }
}

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // attempt to parse env var (supports JSON string, base64 JSON, or encoded)
    const parsed = parseServiceAccountFromEnv(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!parsed) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is set but could not be parsed as JSON (try base64-encoding the JSON or escaping newlines).");
    }
    serviceAccount = parsed;
    // normalize private_key newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
    }
  } else if (process.env.NODE_ENV === "production" && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // if a path was provided in env, try to read it
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const fileContents = readFileSync(credentialsPath, "utf8");
    serviceAccount = JSON.parse(fileContents);
    serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
  } else {
    // local development: read the bundled JSON file
    const serviceAccountPath = path.join(__dirname, "./YMSchool.json");
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
  }

  // basic validation
  if (!serviceAccount || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("Firebase service account is missing required fields (private_key or client_email).");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  // throw a clear error so startup logs show why Firestore auth failed
  // do NOT log the full serviceAccount to avoid leaking secrets
  throw new Error(
    `Failed to initialize Firebase Admin SDK: ${err.message}. ` +
      `Ensure FIREBASE_SERVICE_ACCOUNT is provided (JSON or base64-encoded JSON) and that private_key newlines are escaped as \\n in your env.`
  );
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
