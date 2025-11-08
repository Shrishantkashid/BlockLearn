const jwt = require('jsonwebtoken');
const { connectDB } = require('./config/database');
const { ObjectId } = require('mongodb');

async function generateValidToken() {
  try {
    // Connect to database to get a real user
    const db = await connectDB();
    const usersCollection = db.collection('users');
    
    // Find the first user in the database
    const user = await usersCollection.findOne({});
    
    if (!user) {
      console.log('No users found in database. Creating a test user...');
      
      // Create a test user if none exists
      const testUser = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'learner',
        campus_verified: true,
        profile_complete: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await usersCollection.insertOne(testUser);
      testUser._id = result.insertedId;
      
      console.log('Created test user with ID:', testUser._id.toString());
      user = testUser;
    }
    
    if (user) {
      // Generate a valid JWT token
      const token = jwt.sign(
        { 
          userId: user._id.toString(), 
          email: user.email,
          userType: user.user_type || 'learner'
        },
        process.env.JWT_SECRET || "3de2bb685e53a8be7cd2fa51b0de0eb987c4837ad91541e176ef9c9a9d2815ef",
        { expiresIn: "7d" }
      );
      
      console.log('✅ Generated valid JWT token for user:', user.email);
      console.log('User ID:', user._id.toString());
      console.log('\n📋 Token:');
      console.log(token);
      
      console.log('\n🔧 To test with curl:');
      console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/matching/mentors/690c65cea7d453da3878d8a7`);
      
      console.log('\n🔧 To test with fetch (JavaScript):');
      console.log(`
fetch('http://localhost:5000/api/matching/mentors/690c65cea7d453da3878d8a7', {
  headers: {
    'Authorization': 'Bearer ${token}'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
      `);
      
      return token;
    } else {
      console.log('❌ Could not find or create a user');
      return null;
    }
  } catch (error) {
    console.error('Error generating token:', error);
    return null;
  }
}

generateValidToken();