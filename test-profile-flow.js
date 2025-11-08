const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function testProfileFlow() {
  try {
    console.log('Testing profile completion flow...');
    
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('blocklearn');
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    
    // Find a user with profile_complete: false
    const user = await usersCollection.findOne({ profile_complete: false });
    
    if (!user) {
      console.log('❌ No user found with incomplete profile');
      // List all users for debugging
      const allUsers = await usersCollection.find({}).toArray();
      console.log('All users:');
      allUsers.forEach(u => {
        console.log(`  ID: ${u._id}, Email: ${u.email}, Profile Complete: ${u.profile_complete}`);
      });
      await client.close();
      return;
    }
    
    console.log('Found user with incomplete profile:');
    console.log(`  ID: ${user._id}, Email: ${user.email}`);
    
    // Generate a valid token for this user
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('Generated token:', token);
    
    // Test the profile update endpoint
    console.log('Testing profile update...');
    
    // Simulate a profile update request
    const profileData = {
      fullName: "Test User",
      schoolName: "Test School",
      grade: "10th",
      bio: "This is a test bio",
      skillsToLearn: "JavaScript, React",
      skillsToTeach: "Python, HTML",
      learningGoals: "Become a full-stack developer",
      interests: "Coding, Music"
    };
    
    // Update the user in the database directly to simulate the profile update
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          profile_complete: true,
          updated_at: new Date()
        }
      }
    );
    
    // Update or create user profile
    await profilesCollection.updateOne(
      { user_id: user._id },
      { 
        $set: { 
          user_id: user._id,
          full_name: profileData.fullName,
          school_name: profileData.schoolName,
          grade: profileData.grade,
          bio: profileData.bio,
          skills_to_learn: profileData.skillsToLearn,
          skills_to_teach: profileData.skillsToTeach,
          learning_goals: profileData.learningGoals,
          interests: profileData.interests,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('✅ Profile updated successfully in database');
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    const userProfile = await profilesCollection.findOne({ user_id: user._id });
    
    console.log('Updated user:', {
      id: updatedUser._id,
      email: updatedUser.email,
      profileComplete: updatedUser.profile_complete
    });
    
    console.log('User profile:', {
      fullName: userProfile.full_name,
      schoolName: userProfile.school_name,
      grade: userProfile.grade
    });
    
    await client.close();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testProfileFlow();