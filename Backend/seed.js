require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    console.log('Cleared existing users and departments');

    // Create Super Admin first (needed as createdBy for departments)
    const superAdmin = await User.create({
      userId: 'SA001',
      name: 'Super Administrator',
      email: 'superadmin@timetable.com',
      password: 'admin123',
      role: 'SUPER_ADMIN',
      department: 'NONE',
      isApproved: true,
      isActive: true
    });
    console.log('✓ Super Admin created');

    // Create Departments
    const departments = await Department.insertMany([
      { name: 'Computer Science', code: 'CS', color: '#3b82f6', createdBy: superAdmin._id },
      { name: 'Electronics & Communication', code: 'ECE', color: '#8b5cf6', createdBy: superAdmin._id },
      { name: 'Information Technology', code: 'IT', color: '#10b981', createdBy: superAdmin._id },
      { name: 'Mathematics & Computing', code: 'MNC', color: '#f97316', createdBy: superAdmin._id },
      { name: 'Machine Learning', code: 'ML', color: '#ec4899', createdBy: superAdmin._id },
    ]);
    console.log(`✓ ${departments.length} Departments created`);

    // Create Department Admins (already approved for demo)
    const csAdmin = await User.create({
      userId: 'CS001',
      name: 'CS Department Admin',
      email: 'cs.admin@timetable.com',
      password: 'admin123',
      role: 'DEPARTMENT_ADMIN',
      department: 'CS',
      isApproved: true,
      isActive: true
    });
    console.log('✓ CS Admin created');

    const eceAdmin = await User.create({
      userId: 'ECE001',
      name: 'ECE Department Admin',
      email: 'ece.admin@timetable.com',
      password: 'admin123',
      role: 'DEPARTMENT_ADMIN',
      department: 'ECE',
      isApproved: true,
      isActive: true
    });
    console.log('✓ ECE Admin created');

    const itAdmin = await User.create({
      userId: 'IT001',
      name: 'IT Department Admin',
      email: 'it.admin@timetable.com',
      password: 'admin123',
      role: 'DEPARTMENT_ADMIN',
      department: 'IT',
      isApproved: true,
      isActive: true
    });
    console.log('✓ IT Admin created');

    const mncAdmin = await User.create({
      userId: 'MNC001',
      name: 'MNC Department Admin',
      email: 'mnc.admin@timetable.com',
      password: 'admin123',
      role: 'DEPARTMENT_ADMIN',
      department: 'MNC',
      isApproved: true,
      isActive: true
    });
    console.log('✓ MNC Admin created');

    const mlAdmin = await User.create({
      userId: 'ML001',
      name: 'ML Department Admin',
      email: 'ml.admin@timetable.com',
      password: 'admin123',
      role: 'DEPARTMENT_ADMIN',
      department: 'ML',
      isApproved: true,
      isActive: true
    });
    console.log('✓ ML Admin created');

    // Create Pending Users (for demo of approval flow)
    await User.create({
      userId: 'PU001',
      name: 'Pending User One',
      email: 'pending1@timetable.com',
      password: 'user123',
      role: 'PENDING',
      department: 'NONE',
      isApproved: false,
      isActive: true
    });
    console.log('✓ Pending User 1 created');

    await User.create({
      userId: 'PU002',
      name: 'Pending User Two',
      email: 'pending2@timetable.com',
      password: 'user123',
      role: 'PENDING',
      department: 'NONE',
      isApproved: false,
      isActive: true
    });
    console.log('✓ Pending User 2 created');

    console.log('\n================================');
    console.log('SEED DATA CREATED SUCCESSFULLY!');
    console.log('================================\n');
    console.log('Departments: CS, ECE, IT, MNC, ML\n');
    console.log('Login Credentials:');
    console.log('------------------');
    console.log('Super Admin:');
    console.log('  User ID: SA001');
    console.log('  Password: admin123\n');
    console.log('CS Admin:');
    console.log('  User ID: CS001');
    console.log('  Password: admin123\n');
    console.log('ECE Admin:');
    console.log('  User ID: ECE001');
    console.log('  Password: admin123\n');
    console.log('IT Admin:');
    console.log('  User ID: IT001');
    console.log('  Password: admin123\n');
    console.log('MNC Admin:');
    console.log('  User ID: MNC001');
    console.log('  Password: admin123\n');
    console.log('ML Admin:');
    console.log('  User ID: ML001');
    console.log('  Password: admin123\n');
    console.log('Pending Users (for approval demo):');
    console.log('  User ID: PU001, Password: user123');
    console.log('  User ID: PU002, Password: user123\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seed
connectDB().then(() => seedData());