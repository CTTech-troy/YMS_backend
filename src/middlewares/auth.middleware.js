// Lightweight auth middleware used by routes.
// Replace token handling with real verification (JWT/Firebase/etc.) in production.
export const authMiddleware = (req, res, next) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth) {
      if (process.env.NODE_ENV === 'development') {
        // allow local dev: attach a dev user for convenience
        req.user = { uid: 'dev-user', role: 'admin' };
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // NOTE: replace this placeholder with real verification (verify JWT, lookup session, etc.)
    req.user = { uid: token, role: 'user' };
    return next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

export default authMiddleware;