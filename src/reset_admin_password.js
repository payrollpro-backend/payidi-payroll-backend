// src/reset_admin_password.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee'); // Adjust path if necessary

// --- CONFIGURATION ---
const ADMIN_EMAIL = 'admin@payidi.com'; // Change this to your Admin's email
const NEW_PASSWORD = 'PayidiNewTemp2026!'; // <--- SET YOUR NEW PASSWORD HERE
// ---------------------

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error('❌ MONGO_URI is not set.');
    process.exit(1);
}

async function resetPassword() {
    console.log(`Attempting to reset password for: ${ADMIN_EMAIL}`);

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB.');

        const user = await Employee.findOne({ email: ADMIN_EMAIL });

        if (!user) {
            console.error(`❌ User not found with email: ${ADMIN_EMAIL}`);
            return;
        }

        // 1. Generate new hash for the known password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(NEW_PASSWORD, salt);

        // 2. Update the user record
        user.passwordHash = newPasswordHash;
        user.requiresPasswordChange = true; // Optional: Force user to reset it after login
        await user.save();

        console.log(`\n✅ Password successfully reset for ${ADMIN_EMAIL}!`);
        console.log(`   Use new password: ${NEW_PASSWORD}`);
        
    } catch (error) {
        console.error('⚠️ Password Reset Failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔗 Disconnected from MongoDB.');
    }
}

resetPassword();
