/**
 * Seed script for populating dummy data for the matching system
 * This script creates sample users, skills, and matching data for training purposes
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster.mongodb.net/blocklearn?retryWrites=true&w=majority';

// Sample data
const campuses = [
  'MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'Caltech',
  'Princeton', 'Yale', 'Columbia', 'Oxford', 'Cambridge'
];

const skills = [
  { name: 'JavaScript', category: 'Programming' },
  { name: 'Python', category: 'Programming' },
  { name: 'React', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Machine Learning', category: 'AI/ML' },
  { name: 'Data Science', category: 'Data' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Blockchain', category: 'Web3' },
  { name: 'Cybersecurity', category: 'Security' },
  { name: 'Mobile Development', category: 'Mobile' }
];

const firstNames = [
  'Alex', 'Taylor', 'Jordan', 'Casey', 'Riley', 
  'Morgan', 'Quinn', 'Avery', 'Peyton', 'Dakota',
  'Skyler', 'Reese', 'Emerson', 'Finley', 'Hayden',
  'Rowan', 'Shiloh', 'Phoenix', 'Justice', 'Sage'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

// Generate random availability slots
function generateAvailability() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const availability = [];
  
  // Generate 2-4 time slots
  const slotCount = Math.floor(Math.random() * 3) + 2;
  
  for (let i = 0; i < slotCount; i++) {
    const day = days[Math.floor(Math.random() * days.length)];
    const startHour = Math.floor(Math.random() * 8) + 8; // 8AM - 4PM
    const duration = Math.floor(Math.random() * 3) + 1; // 1-3 hours
    const endHour = startHour + duration;
    
    availability.push({
      day,
      start: `${startHour.toString().padStart(2, '0')}:00`,
      end: `${endHour.toString().padStart(2, '0')}:00`
    });
  }
  
  return JSON.stringify(availability);
}

// Generate random proficiency level (1-5)
function generateProficiency() {
  return Math.floor(Math.random() * 5) + 1;
}

async function seedDatabase() {
  let client;
  try {
    console.log('Starting to seed matching data...');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('blocklearn');
    
    console.log('Connected to MongoDB');
    
    // 1. Create sample skills
    console.log('Creating sample skills...');
    const skillsCollection = db.collection('skills');
    
    for (const skill of skills) {
      await skillsCollection.updateOne(
        { name: skill.name },
        { $set: { ...skill, created_at: new Date() } },
        { upsert: true }
      );
    }
    
    // Get all skill documents
    const skillDocs = await skillsCollection.find({}).toArray();
    const skillIds = skillDocs.map(skill => skill._id);
    
    // 2. Create sample users (30 users)
    console.log('Creating sample users...');
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    const userSkillsCollection = db.collection('user_skills');
    
    const userIds = [];
    const passwordHash = await bcrypt.hash('password123', 10);
    
    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `user${i + 1}@${firstName.toLowerCase()}.com`;
      const campus = campuses[Math.floor(Math.random() * campuses.length)];
      
      // Create user
      const userResult = await usersCollection.insertOne({
        email: email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        campus_verified: true,
        profile_complete: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const userId = userResult.insertedId;
      userIds.push(userId);
      
      // Create user profile
      await profilesCollection.insertOne({
        user_id: userId,
        bio: `I'm passionate about ${skills[Math.floor(Math.random() * skills.length)].name} and love helping others learn.`,
        campus: campus,
        year_of_study: Math.floor(Math.random() * 4) + 1, // Year 1-4
        department: 'Computer Science',
        availability: generateAvailability(),
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Assign random skills to user (2-5 skills)
      const userSkillCount = Math.floor(Math.random() * 4) + 2;
      const shuffledSkills = [...skillIds].sort(() => 0.5 - Math.random());
      const userSkills = shuffledSkills.slice(0, userSkillCount);
      
      for (const skillId of userSkills) {
        // Randomly assign as offered or needed (70% chance of offered)
        const skillType = Math.random() < 0.7 ? 'offered' : 'needed';
        const proficiency = generateProficiency();
        
        await userSkillsCollection.updateOne(
          { user_id: userId, skill_id: skillId, skill_type: skillType },
          { 
            $set: {
              user_id: userId,
              skill_id: skillId,
              skill_type: skillType,
              proficiency_level: proficiency,
              description: `I ${skillType === 'offered' ? 'can teach' : 'want to learn'} this skill at level ${proficiency}`,
              created_at: new Date()
            }
          },
          { upsert: true }
        );
      }
    }
    
    console.log('Created 30 sample users with profiles and skills');
    
    // 3. Create sample sessions and match history (50 sessions)
    console.log('Creating sample sessions and match history...');
    const sessionsCollection = db.collection('sessions');
    const matchHistoryCollection = db.collection('match_history');
    const sessionOutcomesCollection = db.collection('session_outcomes');
    const feedbackSessionsCollection = db.collection('feedback_sessions');
    
    for (let i = 0; i < 50; i++) {
      // Select random student and mentor (ensure they're different)
      const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
      const studentId = shuffledUsers[0];
      const mentorId = shuffledUsers[1];
      
      // Select random skill that mentor offers
      const mentorSkills = await userSkillsCollection.find({ 
        user_id: mentorId, 
        skill_type: 'offered' 
      }).toArray();
      
      if (mentorSkills.length === 0) continue;
      
      const skillId = mentorSkills[0].skill_id;
      
      // Create session
      const statusOptions = ['completed', 'scheduled', 'in_progress', 'cancelled'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
      
      const sessionResult = await sessionsCollection.insertOne({
        student_id: studentId,
        mentor_id: mentorId,
        skill_id: skillId,
        scheduled_at: futureDate,
        duration_minutes: Math.floor(Math.random() * 3) * 30 + 30, // 30, 60, or 90 minutes
        status: status,
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        location: 'Online',
        notes: 'Sample session notes',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const sessionId = sessionResult.insertedId;
      
      // Create match history (simulate the matching algorithm)
      const matchScore = Math.random(); // Random score between 0 and 1
      
      const scoreBreakdown = {
        skills: {
          score: Math.random(),
          weight: 0.35,
          contribution: Math.random() * 0.35
        },
        campus: {
          score: Math.random(),
          weight: 0.20,
          contribution: Math.random() * 0.20
        },
        availability: {
          score: Math.random(),
          weight: 0.25,
          contribution: Math.random() * 0.25
        },
        experience: {
          score: Math.random(),
          weight: 0.10,
          contribution: Math.random() * 0.10
        },
        rating: {
          score: Math.random(),
          weight: 0.10,
          contribution: Math.random() * 0.10
        }
      };
      
      await matchHistoryCollection.insertOne({
        student_id: studentId,
        mentor_id: mentorId,
        skill_id: skillId,
        match_score: matchScore,
        score_breakdown: scoreBreakdown,
        created_at: new Date()
      });
      
      // Create session outcome (80% connection rate)
      const connected = Math.random() < 0.8;
      
      const feedbackData = connected ? {
        rating: Math.floor(Math.random() * 5) + 1,
        feedback_type: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
        comment: 'Great session, very helpful!',
        is_student: true
      } : null;
      
      await sessionOutcomesCollection.insertOne({
        session_id: sessionId,
        connected: connected,
        feedback_data: feedbackData,
        created_at: new Date()
      });
      
      // Create feedback session (for completed sessions)
      if (status === 'completed' && connected) {
        const studentRating = Math.floor(Math.random() * 5) + 1;
        const mentorRating = Math.floor(Math.random() * 5) + 1;
        
        await feedbackSessionsCollection.insertOne({
          session_id: sessionId,
          student_rating: studentRating,
          student_feedback_type: studentRating > 3 ? 'positive' : 'negative',
          student_comment: studentRating > 3 ? 'Great mentor, very knowledgeable!' : 'Could improve explanations',
          mentor_rating: mentorRating,
          mentor_feedback_type: mentorRating > 3 ? 'positive' : 'negative',
          mentor_comment: mentorRating > 3 ? 'Engaged student, good questions!' : 'Student seemed disinterested',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    console.log('Created 50 sample sessions with match history and outcomes');
    
    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('  - 10 sample skills created');
    console.log('  - 30 sample users created');
    console.log('  - 50 sample sessions created');
    console.log('  - Match history and outcomes recorded');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the seed function
seedDatabase();