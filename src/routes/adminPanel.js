// src/routes/adminPanel.js
const express = require('express');
const bcrypt = require('bcryptjs'); // Needed for hashing the temp password
const Employee = require('../models/Employee'); // We use Employee model for employers/admin/employees
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
// This route handles the creation of a standard Multi-Employee client by Admin.
// ==============================================================================
router.post('/employers', async (req, res) => {
  try {
    // Note: The Admin token is already verified by the router.use(adminAuth) above.
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

    // Generate password hash
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
      address: address || {}, // expects { line1, city, state, zip }
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
    // Log the full stack trace for future debugging
    console.error('Employer Creation POST Crash:', err.stack);
    // Send a generic 500 status back to the client
    res.status(500).json({ error: 'Server error during employer creation.' });
  }
});


// ==============================================================================
// 2. GET /api/admin/employers - LIST ALL EMPLOYERS
// Used to populate the Employer Management dashboard table
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


// ==============================================================================
// 3. GET /api/admin/stats - BASIC STATS
// ==============================================================================
router.get('/stats', async (req, res) => {
  try {
    const employerCount = await Employee.countDocuments({ role: 'employer' });
    const employeeCount = await Employee.countDocuments({ role: 'employee' });
    
    res.json({
      ok: true,
      stats: {
        employers: employerCount,
        employees: employeeCount,
      },
      actingAdmin: req.admin,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================================================================
// 4. GET /api/admin/health - ADMIN TOKEN CHECK
// ==============================================================================
router.get('/health', (req, res) => {
  // This route is used to verify the token is active without database lookups
  res.json({
    ok: true,
    admin: req.admin,
  });
});

// Add PATCH/DELETE routes for /employers/:id here if needed
// ...

module.exports = router;
