// src/middleware/adminAuth.js
const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin only' });
    }

    req.admin = decoded; // { id, email, role }
    next();
  } catch (err) {
    console.error('Admin token error:', err.message);
    return res.status(401).json({ message: 'Token is not valid' });
  }
}

module.exports = adminAuth;
