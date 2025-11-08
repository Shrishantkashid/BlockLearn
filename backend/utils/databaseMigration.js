// backend/utils/databaseMigration.js
const { connectDB } = require('../config/database');

async function initializeDatabase() {
  try {
    const db = await connectDB();
    
    // Check if this is a mock database (offline mode)
    if (!db.listCollections) {
      console.log('⚠️  Running in offline mode - skipping database initialization');
      return;
    }
    
    // Create mentor_applications collection if it doesn't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('mentor_applications')) {
      console.log('Creating mentor_applications collection...');
      await db.createCollection('mentor_applications');
      console.log('✅ mentor_applications collection created');
    }
    
    // Create indexes for mentor_applications
    const mentorApplications = db.collection('mentor_applications');
    await mentorApplications.createIndex({ user_id: 1 });
    await mentorApplications.createIndex({ status: 1 });
    await mentorApplications.createIndex({ created_at: -1 });
    console.log('✅ mentor_applications indexes created');
    
    // Create interview_sessions collection if it doesn't exist
    if (!collectionNames.includes('interview_sessions')) {
      console.log('Creating interview_sessions collection...');
      await db.createCollection('interview_sessions');
      console.log('✅ interview_sessions collection created');
    }
    
    // Create indexes for interview_sessions
    const interviewSessions = db.collection('interview_sessions');
    await interviewSessions.createIndex({ mentor_id: 1 });
    await interviewSessions.createIndex({ status: 1 });
    await interviewSessions.createIndex({ scheduled_at: -1 });
    await interviewSessions.createIndex({ interview_code: 1 }); // Index for interview code
    console.log('✅ interview_sessions indexes created');
    
    // Update users collection to add mentor_approved field if it doesn't exist
    const users = db.collection('users');
    const usersWithMentorField = await users.countDocuments({ mentor_approved: { $exists: true } });
    
    if (usersWithMentorField === 0) {
      // Add mentor_approved field to all existing users (default to false)
      await users.updateMany(
        { mentor_approved: { $exists: false } },
        { $set: { mentor_approved: false } }
      );
      console.log('✅ mentor_approved field added to users collection');
    }
    
    // Update users collection to add user_type field if it doesn't exist
    const usersWithUserTypeField = await users.countDocuments({ user_type: { $exists: true } });
    
    if (usersWithUserTypeField === 0) {
      // Add user_type field to all existing users (default to 'learner')
      await users.updateMany(
        { user_type: { $exists: false } },
        { $set: { user_type: 'learner' } }
      );
      console.log('✅ user_type field added to users collection');
    }
    
    // Create skills collection if it doesn't exist
    if (!collectionNames.includes('skills')) {
      console.log('Creating skills collection...');
      await db.createCollection('skills');
      console.log('✅ skills collection created');
    }
    
    // Create indexes for skills
    const skillsCollection = db.collection('skills');
    await skillsCollection.createIndex({ name: 1 });
    await skillsCollection.createIndex({ category: 1 });
    console.log('✅ skills indexes created');
    
    // Insert default skills if collection is empty
    const skillsCount = await skillsCollection.countDocuments();
    if (skillsCount === 0) {
      console.log('Inserting default skills...');
      const defaultSkills = [
        { name: "JavaScript", category: "Programming" },
        { name: "Python", category: "Programming" },
        { name: "React", category: "Programming" },
        { name: "Node.js", category: "Programming" },
        { name: "UI/UX Design", category: "Design" },
        { name: "Figma", category: "Design" },
        { name: "Photography", category: "Arts" },
        { name: "Guitar", category: "Music" },
        { name: "Spanish", category: "Languages" },
        { name: "Cooking", category: "Life Skills" }
      ];
      await skillsCollection.insertMany(defaultSkills);
      console.log('✅ Default skills inserted');
    }
    
    // Create mentor_connections collection if it doesn't exist
    if (!collectionNames.includes('mentor_connections')) {
      console.log('Creating mentor_connections collection...');
      await db.createCollection('mentor_connections');
      console.log('✅ mentor_connections collection created');
    }
    
    // Create indexes for mentor_connections
    const mentorConnections = db.collection('mentor_connections');
    await mentorConnections.createIndex({ learner_id: 1 });
    await mentorConnections.createIndex({ mentor_id: 1 });
    await mentorConnections.createIndex({ status: 1 });
    await mentorConnections.createIndex({ created_at: -1 });
    await mentorConnections.createIndex({ learner_id: 1, mentor_id: 1, status: 1 }); // Compound index
    console.log('✅ mentor_connections indexes created');
    
    // Create user_skills collection if it doesn't exist
    if (!collectionNames.includes('user_skills')) {
      console.log('Creating user_skills collection...');
      await db.createCollection('user_skills');
      console.log('✅ user_skills collection created');
    }
    
    // Create indexes for user_skills
    const userSkills = db.collection('user_skills');
    await userSkills.createIndex({ user_id: 1 });
    await userSkills.createIndex({ skill_id: 1 });
    await userSkills.createIndex({ skill_type: 1 });
    await userSkills.createIndex({ user_id: 1, skill_type: 1 }); // Compound index
    console.log('✅ user_skills indexes created');
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('Database migration completed');
    process.exit(0);
  }).catch(err => {
    console.error('Database migration failed:', err);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };