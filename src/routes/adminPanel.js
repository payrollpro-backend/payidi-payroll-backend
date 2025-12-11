// src/routes/adminPanel.js
const express = require('express');
const Admin = require('../models/Admin');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// GET /api/admin/stats  (example protected route)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    res.json({
      ok: true,
      message: 'Admin stats',
      adminCount,
      actingAdmin: req.admin,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// OPTIONAL: GET /api/admin/health here too
// If your server.js already has app.get('/api/admin/health', adminAuth, ...)
// you can remove that OR leave this unused.
router.get('/health', adminAuth, (req, res) => {
  res.json({
    ok: true,
    admin: req.admin,
  });
});

module.exports = router;
