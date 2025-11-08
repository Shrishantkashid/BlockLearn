const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate a test token with a valid user ID
const userId = '690c65cea7d453da3878d8af'; // Valid student user ID
const email = 'student@test.com';
const userType = 'learner';

const token = jwt.sign(
  { 
    userId: userId,
    email: email,
    userType: userType
  },
  process.env.JWT_SECRET || "3de2bb685e53a8be7cd2fa51b0de0eb987c4837ad91541e176ef9c9a9d2815ef",
  { expiresIn: "7d" }
);

console.log('Generated test token:');
console.log(token);

console.log('\nTo test with curl:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/matching/mentors/690c65cea7d453da3878d8a7`);