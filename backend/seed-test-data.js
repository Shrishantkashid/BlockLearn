const { Client } = require('pg');

// Database configuration
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'skill_swap_db',
  user: 'postgres',
  password: 'password'
});

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample data for testing...');

    await client.connect();

    // Create sample skills
    await client.query(`
      INSERT INTO skills (name, category) VALUES
      ('JavaScript', 'Programming'),
      ('Python', 'Programming'),
      ('React', 'Web Development'),
      ('Node.js', 'Backend Development'),
      ('Machine Learning', 'Data Science'),
      ('Blockchain', 'Web3'),
      ('Public Speaking', 'Communication'),
      ('Data Structures', 'Computer Science')
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Sample skills created');

    // Create sample users
    await client.query(`
      INSERT INTO users (email, first_name, last_name, campus_verified, profile_complete) VALUES
      ('student@test.com', 'John', 'Doe', true, true),
      ('mentor@test.com', 'Jane', 'Smith', true, true),
      ('admin@test.com', 'Admin', 'User', true, true)
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Sample users created');

    // Get user IDs and skill IDs for creating relationships
    const usersResult = await client.query(`
      SELECT id, email FROM users WHERE email IN ('student@test.com', 'mentor@test.com', 'admin@test.com')
    `);

    const skillsResult = await client.query(`
      SELECT id, name FROM skills WHERE name IN ('JavaScript', 'Python', 'React', 'Node.js')
    `);

    const studentId = usersResult.rows.find(u => u.email === 'student@test.com').id;
    const mentorId = usersResult.rows.find(u => u.email === 'mentor@test.com').id;

    // Create user skills (mentor offers skills, student needs skills)
    for (const skill of skillsResult.rows) {
      // Mentor offers skills
      await client.query(`
        INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level)
        VALUES ($1, $2, 'offered', 5)
        ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
      `, [mentorId, skill.id]);

      // Student needs skills
      await client.query(`
        INSERT INTO user_skills (user_id, skill_id, skill_type, proficiency_level)
        VALUES ($1, $2, 'needed', 2)
        ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING
      `, [studentId, skill.id]);
    }
    console.log('✅ User skills relationships created');

    // Create a sample session
    const javascriptSkillId = skillsResult.rows.find(s => s.name === 'JavaScript').id;
    const sessionResult = await client.query(`
      INSERT INTO sessions (student_id, mentor_id, skill_id, scheduled_at, duration_minutes, status, notes)
      VALUES ($1, $2, $3, NOW() + INTERVAL '1 day', 60, 'scheduled', 'Test session for JavaScript learning')
      RETURNING id
    `, [studentId, mentorId, javascriptSkillId]);
    console.log('✅ Sample session created');

    // Create feedback for the session
    const sessionId = sessionResult.rows[0].id;
    await client.query(`
      INSERT INTO feedback_sessions (session_id, student_rating, student_feedback_type, student_comment, mentor_rating, mentor_feedback_type, mentor_comment)
      VALUES ($1, 5, 'positive', 'Great session! Learned a lot about JavaScript.', 4, 'positive', 'Student was engaged and eager to learn.')
    `, [sessionId]);
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
    await client.end();
  }
}

// Run the seeding function
seedDatabase();
