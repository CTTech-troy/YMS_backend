// backend/src/models/student.js

/**
 * Normalize gender to boolean (true = male, false = female)
 */
export function normalizeGender(value) {
  if (typeof value === "boolean") return value;
  if (!value) return null;
  const s = String(value).toLowerCase();
  if (s === "male" || s === "m" || s === "true") return true;
  if (s === "female" || s === "f" || s === "false") return false;
  return null;
}

/**
 * Validate guardians (must be 1..3)
 */
export function normalizeGuardians(input) {
  let guardians = [];
  if (!input) return null;
  if (Array.isArray(input)) guardians = input;
  else if (typeof input === "object") guardians = [input];
  else return null;

  guardians = guardians
    .map((g) => ({
      name: (g.name || "").trim(),
      phone: (g.phone || "").trim(),
      email: (g.email || "").trim(),
      relationship: (g.relationship || "").trim(),
    }))
    .filter(g => g.name || g.phone || g.email); // drop empty entries

  // Accept 1..3 guardians (frontend allows up to 3)
  if (guardians.length < 1 || guardians.length > 3) return null;
  return guardians;
}
