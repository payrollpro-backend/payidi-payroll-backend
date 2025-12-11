// src/middleware/employer.js
// Payidi employer-only middleware.
// Allows both 'employer' and 'admin' roles (admins can act as employers).
// Use AFTER requireAuth so req.user is populated from the JWT.
module.exports = function employerOnly(req, res, next) {
  if (!req.user || (req.user.role !== 'employer' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Employer access required' });
  }
  next();
};
