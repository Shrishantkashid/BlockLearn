const { connectDB } = require('./config/database');
const { ObjectId } = require('mongodb');

async function testMatching() {
  try {
    // Connect to database
    const db = await connectDB();
    
    // Get collections
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    const userSkillsCollection = db.collection('user_skills');
    
    // Sample skill ID (you would replace this with an actual skill ID)
    const skillId = 'SAMPLE_SKILL_ID'; // Replace with actual skill ID
    
    // Sample student ID (you would replace this with an actual student ID)
    const studentId = 'SAMPLE_STUDENT_ID'; // Replace with actual student ID
    
    console.log('Testing matching system for skill:', skillId);
    
    // Get student profile
    const studentUser = await usersCollection.findOne({ _id: new ObjectId(studentId) });
    
    if (!studentUser) {
      console.log('Student user not found');
      return;
    }
    
    // Get student profile (may not exist for new users)
    const studentProfile = await profilesCollection.findOne({ user_id: new ObjectId(studentId) });

    const student = {
      ...studentUser,
      ...(studentProfile || {}), // Merge profile data if it exists
      userId: studentId
    };
    
    console.log('Student:', student.first_name, student.last_name);
    
    // Get all mentors who offer this skill
    const mentorUserSkills = await userSkillsCollection.find({
      skill_id: new ObjectId(skillId),
      skill_type: 'offered',
      user_id: { $ne: new ObjectId(studentId) } // Don't match student with themselves
    }).toArray();
    
    console.log('Found', mentorUserSkills.length, 'mentor skills for this skill');
    
    if (mentorUserSkills.length === 0) {
      console.log('No mentors found for this skill');
      return;
    }
    
    // Get unique mentor IDs
    const mentorIds = [...new Set(mentorUserSkills.map(skill => skill.user_id.toString()))];
    
    console.log('Found', mentorIds.length, 'unique mentors');
    
    // Get mentor details
    const mentors = [];
    for (const mentorId of mentorIds) {
      const mentorUser = await usersCollection.findOne({ _id: new ObjectId(mentorId) });
      const mentorProfile = await profilesCollection.findOne({ user_id: new ObjectId(mentorId) });
      
      if (mentorUser) {
        mentors.push({
          user_id: mentorId,
          first_name: mentorUser.first_name,
          last_name: mentorUser.last_name,
          email: mentorUser.email,
          campus: mentorProfile ? mentorProfile.campus : null,
          availability: mentorProfile ? mentorProfile.availability : null,
          bio: mentorProfile ? mentorProfile.bio : null,
          avatar_url: mentorProfile ? mentorProfile.avatar_url : null
        });
      }
    }
    
    console.log('Mentors found:');
    mentors.forEach(mentor => {
      console.log('-', mentor.first_name, mentor.last_name);
    });
    
  } catch (error) {
    console.error('Error in matching test:', error);
  }
}

// Run the test
testMatching();