/**
 * Seed script for populating dummy data for the matching system
 * This script creates sample users, skills, and matching data for training purposes
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
  try {
    console.log('Starting to seed matching data...');
    
    // 1. Create sample skills
    console.log('Creating sample skills...');
    for (const skill of skills) {
      const skillQuery = `
        INSERT INTO skills (name, category, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (name) DO NOTHING
        RETURNING id
      `;
      await pool.query(skillQuery, [skill.name, skill.category]);
    }
    
    // Get all skill IDs
    const skillResult = await pool.query('SELECT id FROM skills');
    const skillIds = skillResult.rows.map(row => row.id);
    
    // 2. Create sample users (30 users)
    console.log('Creating sample users...');
    const userIds = [];
    const passwordHash = await bcrypt.hash('password123', 10);
    
    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `user${i + 1}@${firstName.toLowerCase()}.com`;
      const campus = campuses[Math.floor(Math.random() * campuses.length)];
      
      // Create user
      const userQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, campus_verified, profile_complete, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `;
      const userResult = await pool.query(userQuery, [
        email,
        passwordHash,
        firstName,
        lastName,
        true,
        true
      ]);
      
      const userId = userResult.rows[0].id;
      userIds.push(userId);
      
      // Create user profile
      const profileQuery = `
        INSERT INTO user_profiles (user_id, bio, campus, year_of_study, department, availability, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      await pool.query(profileQuery, [
        userId,
        `I'm passionate about ${skills[Math.floor(Math.random() * skills.length)].name} and love helping others learn.`,
        campus,
        Math.floor(Math.random() * 4) + 1, // Year 1-4
        'Computer Science',
        generateAvailability(),
        new Date()
      ]);
      
      // Assign random skills to user (2-5 skills)
      const userSkillCount = Math.floor(Math.random() * 4) + 2;
      const shuffledSkills = [...skillIds].sort(() => 0.5 - Math.random());
      const userSkills = shuffledSkills.slice(0, userSkillCount);
      
      for (const skillId of userSkills) {
        // Randomly assign as offered or needed (70% chance of offered)
        const skillType = Math.random() < 0.7 ? 'offered' : 'needed';
        const proficiency = generateProficiency();
        
        const userSkillQuery = `
          INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level, description, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
        `;
        await pool.query(userSkillQuery, [
          userId,
          skillId,
          skillType,
          proficiency,
          `I ${skillType === 'offered' ? 'can teach' : 'want to learn'} this skill at level ${proficiency}`
        ]);
      }
    }
    
    console.log('Created 30 sample users with profiles and skills');
    
    // 3. Create sample sessions and match history (50 sessions)
    console.log('Creating sample sessions and match history...');
    for (let i = 0; i < 50; i++) {
      // Select random student and mentor (ensure they're different)
      const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
      const studentId = shuffledUsers[0];
      const mentorId = shuffledUsers[1];
      
      // Select random skill that mentor offers
      const mentorSkillsQuery = `
        SELECT skill_id FROM user_skills 
        WHERE user_id = $1 AND skill_type = 'offered'
      `;
      const mentorSkillsResult = await pool.query(mentorSkillsQuery, [mentorId]);
      
      if (mentorSkillsResult.rows.length === 0) continue;
      
      const skillId = mentorSkillsResult.rows[0].skill_id;
      
      // Create session
      const statusOptions = ['completed', 'scheduled', 'in_progress', 'cancelled'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      const sessionQuery = `
        INSERT INTO sessions (
          student_id, mentor_id, skill_id, scheduled_at, duration_minutes, 
          status, meeting_link, location, notes, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id
      `;
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
      
      const sessionResult = await pool.query(sessionQuery, [
        studentId,
        mentorId,
        skillId,
        futureDate,
        Math.floor(Math.random() * 3) * 30 + 30, // 30, 60, or 90 minutes
        status,
        'https://meet.google.com/abc-defg-hij',
        'Online',
        'Sample session notes',
      ]);
      
      const sessionId = sessionResult.rows[0].id;
      
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
      
      const matchHistoryQuery = `
        INSERT INTO match_history (
          student_id, mentor_id, skill_id, match_score, score_breakdown, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await pool.query(matchHistoryQuery, [
        studentId,
        mentorId,
        skillId,
        matchScore,
        JSON.stringify(scoreBreakdown)
      ]);
      
      // Create session outcome (80% connection rate)
      const connected = Math.random() < 0.8;
      
      const sessionOutcomeQuery = `
        INSERT INTO session_outcomes (
          session_id, connected, feedback_data, created_at
        )
        VALUES ($1, $2, $3, NOW())
      `;
      
      const feedbackData = connected ? {
        rating: Math.floor(Math.random() * 5) + 1,
        feedback_type: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
        comment: 'Great session, very helpful!',
        is_student: true
      } : null;
      
      await pool.query(sessionOutcomeQuery, [
        sessionId,
        connected,
        feedbackData ? JSON.stringify(feedbackData) : null
      ]);
      
      // Create feedback session (for completed sessions)
      if (status === 'completed' && connected) {
        const studentRating = Math.floor(Math.random() * 5) + 1;
        const mentorRating = Math.floor(Math.random() * 5) + 1;
        
        const feedbackSessionQuery = `
          INSERT INTO feedback_sessions (
            session_id, student_rating, student_feedback_type, student_comment,
            mentor_rating, mentor_feedback_type, mentor_comment, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;
        await pool.query(feedbackSessionQuery, [
          sessionId,
          studentRating,
          studentRating > 3 ? 'positive' : 'negative',
          studentRating > 3 ? 'Great mentor, very knowledgeable!' : 'Could improve explanations',
          mentorRating,
          mentorRating > 3 ? 'positive' : 'negative',
          mentorRating > 3 ? 'Engaged student, good questions!' : 'Student seemed disinterested'
        ]);
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
    await pool.end();
  }
}

// Run the seed function
seedDatabase();