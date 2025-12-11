
// src/middleware/admin.js
// Payidi admin-only middleware.
// Use AFTER requireAuth so req.user is populated from the JWT.
module.exports = function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
