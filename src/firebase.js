// Re-export the admin Firebase setup located in ./config/firebase.js
// This lets controllers that import '../firebase.js' continue to work.
import * as cfg from './config/firebase.js';

export const admin = cfg.admin;
export const db = cfg.db;
export const auth = cfg.auth;

export default { admin, db, auth };