const { connectDB } = require('./config/database');
const { ObjectId } = require('mongodb');

async function checkMentors() {
  try {
    // Connect to database
    const db = await connectDB();
    
    // Get collections
    const usersCollection = db.collection('users');
    const userSkillsCollection = db.collection('user_skills');
    const skillsCollection = db.collection('skills');
    
    console.log('Checking mentors in the system...');
    
    // Find all users who are mentors
    const mentors = await usersCollection.find({ user_type: 'mentor' }).toArray();
    console.log(`Found ${mentors.length} mentors in the system:`);
    
    for (const mentor of mentors) {
      console.log(`- ${mentor.first_name} ${mentor.last_name} (${mentor.email}) - Approved: ${mentor.mentor_approved}`);
      
      // Check if mentor has skills in user_skills collection
      const mentorSkills = await userSkillsCollection.find({ 
        user_id: new ObjectId(mentor._id),
        skill_type: 'offered'
      }).toArray();
      
      console.log(`  Skills in user_skills collection: ${mentorSkills.length}`);
      
      for (const skill of mentorSkills) {
        const skillInfo = await skillsCollection.findOne({ _id: new ObjectId(skill.skill_id) });
        console.log(`    - ${skillInfo ? skillInfo.name : 'Unknown Skill'} (Proficiency: ${skill.proficiency_level})`);
      }
      
      // Check if mentor has a mentor application
      const mentorApplicationsCollection = db.collection('mentor_applications');
      const application = await mentorApplicationsCollection.findOne({ user_id: new ObjectId(mentor._id) });
      if (application) {
        console.log(`  Application status: ${application.status}`);
        console.log(`  Skills in application: ${application.skills}`);
      } else {
        console.log(`  No application found`);
      }
    }
    
    // Check user_skills collection for all offered skills
    const allOfferedSkills = await userSkillsCollection.find({ skill_type: 'offered' }).toArray();
    console.log(`\nTotal offered skills in user_skills collection: ${allOfferedSkills.length}`);
    
    // Group by user
    const skillsByUser = {};
    for (const skill of allOfferedSkills) {
      const userId = skill.user_id.toString();
      if (!skillsByUser[userId]) {
        skillsByUser[userId] = [];
      }
      skillsByUser[userId].push(skill);
    }
    
    console.log(`\nUsers with offered skills:`);
    for (const [userId, skills] of Object.entries(skillsByUser)) {
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      console.log(`- ${user ? user.first_name + ' ' + user.last_name : 'Unknown User'} (${userId}): ${skills.length} skills`);
    }
    
  } catch (error) {
    console.error('Error checking mentors:', error);
  }
}

// Run the check
checkMentors();