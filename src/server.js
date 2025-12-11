require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Existing routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const payrollRoutes = require('./routes/payroll');
const paystubRoutes = require('./routes/paystubs');

// NEW: admin-related routes & middleware
// ./routes/adminAuth.js  => handles POST /api/admin/login
// ./routes/adminPanel.js => handles protected admin endpoints (dashboard, stats, etc.)
// ./middleware/adminAuth.js => verifies JWT and ensures role === 'admin'
const adminAuthRoutes = require('./routes/adminAuth');
const adminPanelRoutes = require('./routes/adminPanel');
const adminAuth = require('./middleware/adminAuth');

// Health / root route
app.get('/', (req, res) => {
  res.json({
    message: process.env.APP_NAME || 'payidi Backend is running',
  });
});

// Public API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/paystubs', paystubRoutes);

// Admin API routes

// 1) Admin login (unprotected)
//    POST /api/admin/login  with { email, password }
app.use('/api/admin', adminAuthRoutes);

// 2) Simple protected health check for admin token
//    GET /api/admin/health  with Authorization: Bearer <token>
app.get('/api/admin/health', adminAuth, (req, res) => {
  res.json({
    ok: true,
    admin: req.admin,
  });
});

// 3) Admin panel routes (all admin-only logic lives here)
//    Example: /api/admin/stats, /api/admin/users, etc.
app.use('/api/admin', adminPanelRoutes);

// Mongo connection
const mongoUri = process.env.MONGO_URI;

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
