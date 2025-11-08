const { connectDB } = require('./config/database');
const { ObjectId } = require('mongodb');

async function testSkillTransfer() {
  try {
    // Connect to database
    const db = await connectDB();
    
    // Sample mentor ID (you would replace this with an actual mentor ID)
    const mentorId = 'SAMPLE_MENTOR_ID'; // Replace with actual mentor ID
    
    // Sample skills from mentor application
    const mentorApplication = {
      skills: 'JavaScript, React, Node.js, Python'
    };
    
    console.log('Testing skill transfer for mentor:', mentorId);
    console.log('Skills from application:', mentorApplication.skills);
    
    // Transfer skills from application to user_skills collection
    if (mentorApplication && mentorApplication.skills) {
      // Get skills collection
      const skillsCollection = db.collection('skills');
      const userSkillsCollection = db.collection('user_skills');
      
      // Parse skills from application (handle both comma-separated and free text)
      let skillList = [];
      
      // First try to split by commas
      if (mentorApplication.skills.includes(',')) {
        skillList = mentorApplication.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      } else {
        // If no commas, try to split by common separators or treat as single skill
        // Try splitting by common separators
        const separators = [',', ';', '\n', '\r'];
        let skillsText = mentorApplication.skills;
        
        // Replace all separators with commas
        for (const separator of separators) {
          skillsText = skillsText.replace(new RegExp(separator, 'g'), ',');
        }
        
        // Split by comma and clean up
        skillList = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill);
        
        // If still no skills or too many from single line, treat as single skill
        if (skillList.length === 0 || (skillList.length > 10 && !mentorApplication.skills.includes(','))) {
          skillList = [mentorApplication.skills.trim()];
        }
      }
      
      console.log('Parsed skills:', skillList);
      
      // For each skill, either find existing skill or create new one
      for (const skillName of skillList) {
        // Skip if skill name is too short
        if (skillName.length < 2) continue;
        
        // Try to find existing skill (case insensitive)
        let skill = await skillsCollection.findOne({ 
          name: { $regex: new RegExp(`^${skillName}$`, 'i') } 
        });
        
        // If skill doesn't exist, create it
        if (!skill) {
          console.log('Creating new skill:', skillName);
          const skillResult = await skillsCollection.insertOne({
            name: skillName,
            category: 'Other',
            created_at: new Date(),
            updated_at: new Date()
          });
          skill = { _id: skillResult.insertedId, name: skillName };
        } else {
          console.log('Found existing skill:', skillName);
        }
        
        // Add skill to user_skills collection
        console.log('Adding skill to user_skills:', skillName);
        await userSkillsCollection.updateOne(
          { user_id: new ObjectId(mentorId), skill_id: skill._id, skill_type: 'offered' },
          { 
            $set: { 
              user_id: new ObjectId(mentorId),
              skill_id: skill._id,
              skill_type: 'offered',
              proficiency_level: 3, // Default proficiency level
              description: '',
              updated_at: new Date()
            }
          },
          { upsert: true }
        );
      }
      
      console.log('Skill transfer completed successfully!');
    }
  } catch (error) {
    console.error('Error in skill transfer:', error);
  }
}

// Run the test
testSkillTransfer();