const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabaseData() {
  try {
    console.log('Checking database data...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected successfully to MongoDB');
    
    const db = client.db('blocklearn');
    
    // Check users collection
    const usersCollection = db.collection('users');
    const usersCount = await usersCollection.countDocuments();
    console.log(`Users collection has ${usersCount} documents`);
    
    if (usersCount > 0) {
      console.log('Sample users:');
      const sampleUsers = await usersCollection.find({}).limit(5).toArray();
      sampleUsers.forEach(user => {
        console.log(`  ID: ${user._id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}, Profile Complete: ${user.profile_complete}`);
      });
    }
    
    // Check user_profiles collection
    const profilesCollection = db.collection('user_profiles');
    const profilesCount = await profilesCollection.countDocuments();
    console.log(`User profiles collection has ${profilesCount} documents`);
    
    if (profilesCount > 0) {
      console.log('Sample profiles:');
      const sampleProfiles = await profilesCollection.find({}).limit(5).toArray();
      sampleProfiles.forEach(profile => {
        console.log(`  User ID: ${profile.user_id}, Full Name: ${profile.full_name}, School: ${profile.school_name}`);
      });
    }
    
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('❌ Database check error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

checkDatabaseData();