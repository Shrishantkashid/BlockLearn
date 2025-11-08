const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function resetProfile() {
  try {
    console.log('Resetting profile completion status...');
    
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('blocklearn');
    const usersCollection = db.collection('users');
    
    // Find the user and reset profile_complete to false
    const userId = '690b47443e85431341b38854';
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          profile_complete: false,
          updated_at: new Date()
        }
      }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Profile completion status reset successfully');
    } else {
      console.log('❌ User not found');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  }
}

resetProfile();