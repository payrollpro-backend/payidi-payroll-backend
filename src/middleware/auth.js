
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

// For Payidi: always prefer process.env.JWT_SECRET in production.
// The default is ONLY for local/dev usage.
const JWT_SECRET = process.env.JWT_SECRET || 'payidi_dev_secret_change_later';

/**
 * Usage:
 *   requireAuth()                      -> any authenticated user
 *   requireAuth(['employer'])          -> only employer role allowed
 *   requireAuth(['admin'])             -> only admin
 *   requireAuth(['admin', 'employer']) -> either admin or employer
 *
 * Assumes tokens are signed in auth logic as:
 *   { id, role, employerId? }
 */
function requireAuth(allowedRoles = []) {
  return function (req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // payload came from signToken in auth logic: { id, role, employerId, ... }

      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden for this role' });
      }

      // Make the user payload available to downstream middleware/routes
      req.user = payload;
      next();
    } catch (err) {
      console.error('JWT verify error:', err);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = { requireAuth };
