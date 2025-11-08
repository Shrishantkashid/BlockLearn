const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate a test token
// This should be a valid MongoDB ObjectId from an actual user in your database
const userId = '690b47443e85431341b38854'; // Replace with actual user ID
const email = 'skshrishant44@gmail.com';

const token = jwt.sign(
  { userId, email },
  process.env.JWT_SECRET || '3de2bb685e53a8be7cd2fa51b0de0eb987c4837ad91541e176ef9c9a9d2815ef',
  { expiresIn: '7d' }
);

console.log('Test token:', token);
console.log('User ID:', userId);
console.log('Email:', email);
console.log('JWT Secret:', process.env.JWT_SECRET || '3de2bb685e53a8be7cd2fa51b0de0eb987c4837ad91541e176ef9c9a9d2815ef');