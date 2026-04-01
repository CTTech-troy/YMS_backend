import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

let loadedEnvPath = null;

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    loadedEnvPath = envPath;
    break;
  }
}

if (loadedEnvPath) {
  console.log("Loaded .env from:", loadedEnvPath);
} else {
  console.warn("No .env file found in expected locations.");
}

function getServiceAccountFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }

    return parsed;
  } catch (error) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${error.message}`);
  }
}

function getServiceAccountFromFile() {
  const possibleJsonPaths = [
    path.resolve(process.cwd(), "src/config/YMS_school.json"),
    path.resolve(__dirname, "./YMS_school.json"),
  ];

  for (const jsonPath of possibleJsonPaths) {
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const parsed = JSON.parse(raw);

        if (parsed.private_key) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
        }

        console.log("Loaded Firebase service account from:", jsonPath);
        return parsed;
      } catch (error) {
        throw new Error(`Failed to read Firebase JSON file at ${jsonPath}: ${error.message}`);
      }
    }
  }

  return null;
}

let serviceAccount = getServiceAccountFromEnv();

if (!serviceAccount) {
  serviceAccount = getServiceAccountFromFile();
}

if (!serviceAccount) {
  throw new Error(
    "Firebase credentials not found. Add FIREBASE_SERVICE_ACCOUNT to .env or place YMS_school.json inside src/config."
  );
}

if (
  !serviceAccount.project_id ||
  !serviceAccount.client_email ||
  !serviceAccount.private_key
) {
  throw new Error("Firebase service account is missing required fields.");
}

console.log("Firebase project:", serviceAccount.project_id);
console.log("Firebase client email:", serviceAccount.client_email);
console.log("Private key present:", !!serviceAccount.private_key);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };