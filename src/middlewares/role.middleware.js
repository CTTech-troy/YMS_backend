/**
 * Role middleware (ESM) — guards routes based on user role.
 * Usage: roleMiddleware('admin') or roleMiddleware(['admin','teacher'])
 *
 * Exports:
 *  - named: export const roleMiddleware
 *  - default: export default roleMiddleware
 */
export const roleMiddleware = (roles) => {
  // if no roles provided, allow through
  if (!roles) return (req, res, next) => next();

  const allowed = Array.isArray(roles) ? roles : [roles];
  const allowedNormalized = allowed.map(r => String(r).toLowerCase());

  return (req, res, next) => {
    try {
      // ensure req.user exists
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userRole = String(req.user.role || '').toLowerCase();

      if (!allowedNormalized.includes(userRole)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default roleMiddleware;