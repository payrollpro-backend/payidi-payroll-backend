// src/routes/adminPanel.js
const express = require('express');
const bcrypt = require('bcryptjs'); // <--- CRITICAL FIX: Ensure bcrypt is imported
const Employee = require('../models/Employee'); 
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Apply adminAuth middleware to all subsequent routes in this file
router.use(adminAuth);

function generateTempPassword() {
  const rand = Math.random().toString(36).slice(2, 8); 
  return `PayidiTemp-${rand}!`;
}

// Helper function to generate unique ID
function generateExternalEmployeeId() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `EMP_${rand}`;
}


// ==============================================================================
// 1. POST /api/admin/employers - CREATE NEW EMPLOYER
// ==============================================================================
router.post('/employers', async (req, res) => {
  try {
    const { 
        firstName, lastName, email, companyName, address, customPassword 
    } = req.body;

    const normalizedCompanyName = (companyName || '').trim();
    const loginEmail = (email || '').trim().toLowerCase();

    if (!normalizedCompanyName || !loginEmail) {
      return res.status(400).json({ error: 'Company Name and Email are required.' });
    }

    const existing = await Employee.findOne({ email: loginEmail });
    if (existing) return res.status(400).json({ error: 'Account already exists with this email.' });

    // 💥 This line requires the 'bcrypt' import at the top!
    const plainPassword = customPassword || generateTempPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const uniqueId = generateExternalEmployeeId();

    const employer = await Employee.create({
      firstName: firstName || normalizedCompanyName,
      lastName: lastName || 'Owner',
      email: loginEmail,
      passwordHash,
      role: 'employer',
      companyName: normalizedCompanyName,
      address: address || {}, 
      externalEmployeeId: uniqueId,
      isSelfEmployed: false, 
      status: 'active',
      requiresPasswordChange: true,
    });

    res.status(201).json({
      employer: { id: employer._id, email: employer.email, companyName: employer.companyName },
      tempPassword: plainPassword,
      message: 'Employer created successfully.',
    });
  } catch (err) {
    // Log the full stack trace for debugging
    console.error('Employer Creation POST Crash:', err.stack);
    res.status(500).json({ error: 'Server error during employer creation.' });
  }
});


// ==============================================================================
// 2. GET /api/admin/employers - LIST ALL EMPLOYERS (Confirms token works)
// ==============================================================================
router.get('/employers', async (req, res) => {
    try {
        const employers = await Employee.find({ role: 'employer' })
            .select('companyName firstName lastName email isSelfEmployed externalEmployeeId')
            .sort({ companyName: 1 });

        res.json(employers); 
    } catch (err) {
        console.error('Admin GET /employers error:', err);
        res.status(500).json({ error: 'Failed to fetch employers' });
    }
});


// ... (omitted remaining routes for brevity)

module.exports = router;
