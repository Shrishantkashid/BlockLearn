const { connectDB } = require('./config/database');

async function checkProfiles() {
  try {
    const db = await connectDB();
    const profilesCollection = db.collection('user_profiles');
    
    const profiles = await profilesCollection.find({}).toArray();
    
    console.log('Profiles in database:');
    profiles.forEach(profile => {
      console.log(`User ID: ${profile.user_id}, Created: ${profile.created_at}`);
    });
    
    console.log(`Total profiles: ${profiles.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProfiles();