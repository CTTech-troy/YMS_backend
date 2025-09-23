// backend/src/middlewares/index.js
// Re-export role.middleware and provide a simple dev-friendly authMiddleware.
// Ensure this file provides named exports { authMiddleware, roleMiddleware }.

import { roleMiddleware as _roleMiddleware } from './role.middleware.js';

export const roleMiddleware = _roleMiddleware;

// Minimal auth middleware — replace with your real auth logic (JWT/Firebase) in production.
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = { id: 'dev', uid: 'dev-uid', role: 'admin', email: 'dev@example.com' };
        return next();
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1] || authHeader;
    // attach a simple user object for development — adjust to verify token in real app
    req.user = { id: token, uid: token, role: 'admin', email: null };
    return next();
  } catch (err) {
    return next(err);
  }
};

export default { authMiddleware, roleMiddleware };