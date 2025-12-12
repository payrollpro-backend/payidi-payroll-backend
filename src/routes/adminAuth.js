// routes/adminAuth.js
const express = require('express');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    // Normalize email (trim + lowercase) to avoid subtle mismatches
    email = String(email).trim().toLowerCase();

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(admin);

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * TEMP ROUTE: Bootstrap a known admin in the SAME DB the app is using
 * GET /api/admin/bootstrap-admin
 * Remove or comment out after you confirm login works.
 */
router.get('/bootstrap-admin', async (req, res) => {
  try {
    const email = 'admin@payidi.com';

    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.json({
        ok: true,
        message: 'Admin already exists',
        email: admin.email,
        id: admin._id,
      });
    }

    admin = new Admin({
      email,
      password: 'StrongPass123!', // will be hashed by Admin model pre-save hook
      name: 'Admin',
      role: 'admin',
    });

    await admin.save();

    res.json({
      ok: true,
      message: 'Bootstrap admin created',
      email: admin.email,
      id: admin._id,
    });
  } catch (err) {
    console.error('Bootstrap admin error:', err);
    res
      .status(500)
      .json({ ok: false, message: 'Bootstrap failed', error: err.message });
  }
});

/**
 * DEBUG ROUTE: See what admin the backend sees
 * GET /api/admin/debug-admin
 * You can leave this or remove later.
 */
router.get('/debug-admin', async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    if (!admin) {
      return res
        .status(404)
        .json({ message: 'No admin documents found in this database' });
    }

    res.json({
      email: admin.email,
      role: admin.role,
      id: admin._id,
      passwordPreview:
        typeof admin.password === 'string'
          ? admin.password.slice(0, 20) + '...'
          : null,
    });
  } catch (err) {
    console.error('Debug admin error:', err);
    res
      .status(500)
      .json({ message: 'Debug error', error: err.message });
  }
});

module.exports = router;
