require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    const email = process.env.INIT_ADMIN_EMAIL;
    const password = process.env.INIT_ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'You must set INIT_ADMIN_EMAIL and INIT_ADMIN_PASSWORD in Render or local .env'
      );
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      console.log('Admin already exists! No need to create.');
      process.exit(0);
    }

    const admin = new Admin({
      email,
      password,
      name: 'Super Admin',
      role: 'admin',
    });

    await admin.save();

    console.log('Admin created successfully:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
}

main();
