const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster.mongodb.net/blocklearn?retryWrites=true&w=majority';

async function seedDatabase() {
  let client;
  try {
    console.log('🌱 Seeding database with sample data for testing...');

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('blocklearn');
    
    console.log('Connected to MongoDB');

    // Collections
    const skillsCollection = db.collection('skills');
    const usersCollection = db.collection('users');
    const userSkillsCollection = db.collection('user_skills');
    const sessionsCollection = db.collection('sessions');
    const feedbackSessionsCollection = db.collection('feedback_sessions');

    // Create sample skills
    const skills = [
      { name: 'JavaScript', category: 'Programming' },
      { name: 'Python', category: 'Programming' },
      { name: 'React', category: 'Web Development' },
      { name: 'Node.js', category: 'Backend Development' },
      { name: 'Machine Learning', category: 'Data Science' },
      { name: 'Blockchain', category: 'Web3' },
      { name: 'Public Speaking', category: 'Communication' },
      { name: 'Data Structures', category: 'Computer Science' }
    ];

    for (const skill of skills) {
      await skillsCollection.updateOne(
        { name: skill.name },
        { $set: { ...skill, created_at: new Date() } },
        { upsert: true }
      );
    }
    console.log('✅ Sample skills created');

    // Create sample users
    const users = [
      { email: 'student@test.com', first_name: 'John', last_name: 'Doe', campus_verified: true, profile_complete: true },
      { email: 'mentor@test.com', first_name: 'Jane', last_name: 'Smith', campus_verified: true, profile_complete: true },
      { email: 'admin@test.com', first_name: 'Admin', last_name: 'User', campus_verified: true, profile_complete: true }
    ];

    const userIds = {};
    for (const user of users) {
      const result = await usersCollection.updateOne(
        { email: user.email },
        { 
          $set: { 
            ...user, 
            created_at: new Date(), 
            updated_at: new Date() 
          } 
        },
        { upsert: true }
      );
      
      // Get the user ID
      const userDoc = await usersCollection.findOne({ email: user.email });
      userIds[user.email] = userDoc._id;
    }
    console.log('✅ Sample users created');

    // Get skill IDs
    const skillDocs = await skillsCollection.find({ 
      name: { $in: ['JavaScript', 'Python', 'React', 'Node.js'] } 
    }).toArray();
    
    const skillIds = {};
    skillDocs.forEach(skill => {
      skillIds[skill.name] = skill._id;
    });

    const studentId = userIds['student@test.com'];
    const mentorId = userIds['mentor@test.com'];

    // Create user skills (mentor offers skills, student needs skills)
    for (const skill of skillDocs) {
      // Mentor offers skills
      await userSkillsCollection.updateOne(
        { user_id: mentorId, skill_id: skill._id, skill_type: 'offered' },
        { 
          $set: { 
            user_id: mentorId, 
            skill_id: skill._id, 
            skill_type: 'offered', 
            proficiency_level: 5,
            created_at: new Date()
          } 
        },
        { upsert: true }
      );

      // Student needs skills
      await userSkillsCollection.updateOne(
        { user_id: studentId, skill_id: skill._id, skill_type: 'needed' },
        { 
          $set: { 
            user_id: studentId, 
            skill_id: skill._id, 
            skill_type: 'needed', 
            proficiency_level: 2,
            created_at: new Date()
          } 
        },
        { upsert: true }
      );
    }
    console.log('✅ User skills relationships created');

    // Create a sample session
    const javascriptSkillId = skillIds['JavaScript'];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    const sessionResult = await sessionsCollection.insertOne({
      student_id: studentId,
      mentor_id: mentorId,
      skill_id: javascriptSkillId,
      scheduled_at: futureDate,
      duration_minutes: 60,
      status: 'scheduled',
      notes: 'Test session for JavaScript learning',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const sessionId = sessionResult.insertedId;
    console.log('✅ Sample session created');

    // Create feedback for the session
    await feedbackSessionsCollection.insertOne({
      session_id: sessionId,
      student_rating: 5,
      student_feedback_type: 'positive',
      student_comment: 'Great session! Learned a lot about JavaScript.',
      mentor_rating: 4,
      mentor_feedback_type: 'positive',
      mentor_comment: 'Student was engaged and eager to learn.',
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log('✅ Sample feedback created');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Sample data created:');
    console.log(`   Users: student@test.com, mentor@test.com, admin@test.com`);
    console.log(`   Skills: JavaScript, Python, React, Node.js`);
    console.log(`   Session ID: ${sessionId}`);
    console.log('\n🔐 You can now run the TestSprite tests!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the seeding function
seedDatabase();