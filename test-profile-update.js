const jwt = require('jsonwebtoken');

// Generate a test token for a user with a specific user ID
const userId = 'test-user-id'; // This should be a valid MongoDB ObjectId
const email = 'test@example.com';

const token = jwt.sign(
  { userId, email },
  'your-secret-key', // This should match your JWT_SECRET in .env
  { expiresIn: '7d' }
);

console.log('Test token:', token);
console.log('User ID:', userId);