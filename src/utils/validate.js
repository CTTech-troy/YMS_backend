import { db } from "../lib/firebase.js";

/**
 * Minimal re-exports from your old controller helpers so controllers remain small.
 * Implementations are intentionally light — extend as needed.
 */
export function calculateAgeFromDOB(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function normalizeReligion(input) {
  if (input === undefined || input === null) return "";
  const s = String(input).trim().toLowerCase();
  if (s === "") return "";
  if (["christian", "christianity", "chr"].includes(s)) return "Christian";
  if (["muslim", "islam", "muslimah"].includes(s)) return "Muslim";
  if (["other", "others", "none"].includes(s)) return "Other";
  return null;
}

export async function resolveSubjects(subjectList = []) {
  if (!Array.isArray(subjectList)) return [];
  const out = [];
  for (const s of subjectList) {
    if (!s) continue;
    const snap = await db.collection("subjects").where("name", "==", String(s)).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      out.push({ id: doc.id, name: doc.data().name });
    }
  }
  return out;
}

export function parsePictureInput(p) {
  if (!p) return null;
  if (typeof p === "object" && p.mime && p.data) return { mime: p.mime, data: p.data };
  if (typeof p === "string") {
    const m = p.match(/^data:(.+);base64,(.*)$/);
    if (m) return { mime: m[1], data: m[2] };
  }
  return null;
}