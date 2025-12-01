import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://<PROJECT>.firebaseio.com",
  });
}

const db = admin.firestore();
const rtdb = admin.database();

export { admin, db, rtdb };