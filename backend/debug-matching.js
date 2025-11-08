const { connectDB } = require('./config/database');
const { ObjectId } = require('mongodb');

async function debugMatching() {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    
    // Test user ID
    const studentId = '690c65cea7d453da3878d8af';
    
    console.log('Testing with student ID:', studentId);
    
    // Test finding user with string ID
    const user1 = await usersCollection.findOne({ _id: studentId });
    console.log('User with string ID:', user1);
    
    // Test finding user with ObjectId
    const user2 = await usersCollection.findOne({ _id: new ObjectId(studentId) });
    console.log('User with ObjectId:', user2);
    
    // Test finding profile
    const profile = await profilesCollection.findOne({ user_id: new ObjectId(studentId) });
    console.log('Profile:', profile);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugMatching();