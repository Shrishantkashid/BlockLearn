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