const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

// Generate a test token
const userId = 'test-user-id'; // This should be a valid MongoDB ObjectId
const email = 'test@example.com';

const token = jwt.sign(
  { userId, email },
  process.env.JWT_SECRET || 'your-secret-key',
  { expiresIn: '7d' }
);

console.log('Test token:', token);
console.log('User ID:', userId);
console.log('Email:', email);
console.log('JWT Secret:', process.env.JWT_SECRET || 'your-secret-key');