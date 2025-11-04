const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const pool = require("../config/database");
const MatchingService = require("../utils/matchingService");

const router = express.Router();

/**
 * Calculate match score between student and mentor based on multiple factors
 * @param {Object} student - Student profile data
 * @param {Object} mentor - Mentor profile data
 * @param {Object} sessionRequest - Details of the session request
 * @returns {Object} Match score and breakdown
 */
async function calculateMatchScore(student, mentor, sessionRequest) {
  const weights = {
    skills: 0.35,           // Skill match importance
    campus: 0.20,           // Campus proximity importance
    availability: 0.25,     // Time overlap importance
    experience: 0.10,       // Experience level importance
    rating: 0.10            // Rating/reputation importance
  };

  let scoreBreakdown = {};
  let totalScore = 0;

  // 1. Skill Matching (35% weight)
  const skillMatchScore = await calculateSkillMatch(
    student.userId,
    mentor.userId,
    sessionRequest.skillId
  );
  totalScore += skillMatchScore * weights.skills;
  scoreBreakdown.skills = {
    score: skillMatchScore,
    weight: weights.skills,
    contribution: skillMatchScore * weights.skills
  };

  // 2. Campus Matching (20% weight)
  const campusMatchScore = calculateCampusMatch(student.campus, mentor.campus);
  totalScore += campusMatchScore * weights.campus;
  scoreBreakdown.campus = {
    score: campusMatchScore,
    weight: weights.campus,
    contribution: campusMatchScore * weights.campus
  };

  // 3. Availability Overlap (25% weight)
  const availabilityScore = calculateAvailabilityOverlap(
    student.availability,
    mentor.availability
  );
  totalScore += availabilityScore * weights.availability;
  scoreBreakdown.availability = {
    score: availabilityScore,
    weight: weights.availability,
    contribution: availabilityScore * weights.availability
  };

  // 4. Experience Level (10% weight)
  const experienceScore = await calculateExperienceMatch(
    mentor.userId,
    sessionRequest.skillId
  );
  totalScore += experienceScore * weights.experience;
  scoreBreakdown.experience = {
    score: experienceScore,
    weight: weights.experience,
    contribution: experienceScore * weights.experience
  };

  // 5. Rating/Reputation (10% weight)
  const ratingScore = await calculateRatingScore(mentor.userId);
  totalScore += ratingScore * weights.rating;
  scoreBreakdown.rating = {
    score: ratingScore,
    weight: weights.rating,
    contribution: ratingScore * weights.rating
  };

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: scoreBreakdown
  };
}

/**
 * Calculate skill matching score
 */
async function calculateSkillMatch(studentId, mentorId, skillId) {
  // Check if mentor offers this skill
  const mentorSkillQuery = `
    SELECT proficiency_level FROM user_skills 
    WHERE user_id = $1 AND skill_id = $2 AND skill_type = 'offered'
  `;
  const mentorSkillResult = await pool.query(mentorSkillQuery, [mentorId, skillId]);

  if (mentorSkillResult.rows.length === 0) {
    return 0; // Mentor doesn't offer this skill
  }

  // Get student's proficiency in this skill (if they have it as needed)
  const studentSkillQuery = `
    SELECT proficiency_level FROM user_skills 
    WHERE user_id = $1 AND skill_id = $2 AND skill_type = 'needed'
  `;
  const studentSkillResult = await pool.query(studentSkillQuery, [studentId, skillId]);

  // Higher score if both have the skill (student needs it, mentor offers it)
  // Even higher if there's a good proficiency level difference (mentor more proficient)
  const mentorProficiency = mentorSkillResult.rows[0].proficiency_level;
  const studentProficiency = studentSkillResult.rows.length > 0 
    ? studentSkillResult.rows[0].proficiency_level 
    : 1;

  // Score based on mentor's proficiency (1-5 scale)
  return mentorProficiency / 5;
}

/**
 * Calculate campus matching score
 */
function calculateCampusMatch(studentCampus, mentorCampus) {
  if (!studentCampus || !mentorCampus) return 0.5; // Neutral score if data missing
  return studentCampus === mentorCampus ? 1 : 0.3; // Exact match or partial match
}

/**
 * Calculate availability overlap score
 */
function calculateAvailabilityOverlap(studentAvailability, mentorAvailability) {
  if (!studentAvailability || !mentorAvailability) return 0.5;

  try {
    const studentSlots = typeof studentAvailability === 'string' 
      ? JSON.parse(studentAvailability) 
      : studentAvailability;
      
    const mentorSlots = typeof mentorAvailability === 'string' 
      ? JSON.parse(mentorAvailability) 
      : mentorAvailability;

    if (!Array.isArray(studentSlots) || !Array.isArray(mentorSlots)) {
      return 0.5;
    }

    // Count overlapping time slots
    let overlapCount = 0;
    studentSlots.forEach(studentSlot => {
      mentorSlots.forEach(mentorSlot => {
        if (studentSlot.day === mentorSlot.day) {
          // Simple overlap calculation (can be enhanced)
          if (
            (studentSlot.start <= mentorSlot.end && studentSlot.end >= mentorSlot.start) ||
            (mentorSlot.start <= studentSlot.end && mentorSlot.end >= studentSlot.start)
          ) {
            overlapCount++;
          }
        }
      });
    });

    // Normalize score based on total possible overlaps
    const maxOverlaps = Math.max(studentSlots.length, mentorSlots.length);
    return maxOverlaps > 0 ? Math.min(1, overlapCount / maxOverlaps) : 0;
  } catch (error) {
    console.error("Error calculating availability overlap:", error);
    return 0.5; // Neutral score on error
  }
}

/**
 * Calculate mentor experience score based on teaching history
 */
async function calculateExperienceMatch(mentorId, skillId) {
  // Count completed sessions for this skill
  const experienceQuery = `
    SELECT COUNT(*) as session_count, AVG(duration_minutes) as avg_duration
    FROM sessions 
    WHERE mentor_id = $1 AND skill_id = $2 AND status = 'completed'
  `;
  const experienceResult = await pool.query(experienceQuery, [mentorId, skillId]);

  if (experienceResult.rows.length === 0 || experienceResult.rows[0].session_count === 0) {
    return 0.3; // New mentors get a baseline score
  }

  const { session_count, avg_duration } = experienceResult.rows[0];
  
  // Score based on experience (session count)
  // Normalize to 0-1 range (e.g., 0 sessions = 0.3, 10+ sessions = 1.0)
  const experienceScore = Math.min(1, 0.3 + (session_count / 10) * 0.7);
  return experienceScore;
}

/**
 * Calculate mentor rating score
 */
async function calculateRatingScore(mentorId) {
  const ratingQuery = `
    SELECT 
      AVG(CASE WHEN student_id = $1 THEN mentor_rating ELSE student_rating END) as avg_rating,
      COUNT(CASE WHEN student_id = $1 THEN mentor_rating ELSE student_rating END) as rating_count
    FROM sessions s
    LEFT JOIN feedback_sessions fs ON s.id = fs.session_id
    WHERE (s.student_id = $1 OR s.mentor_id = $1) AND s.status = 'completed'
      AND (fs.student_rating IS NOT NULL OR fs.mentor_rating IS NOT NULL)
  `;
  const ratingResult = await pool.query(ratingQuery, [mentorId]);

  if (ratingResult.rows.length === 0 || ratingResult.rows[0].rating_count === 0) {
    return 0.7; // Default score for unrated mentors
  }

  const { avg_rating, rating_count } = ratingResult.rows[0];
  
  // Normalize 1-5 rating scale to 0-1 range
  const normalizedRating = (parseFloat(avg_rating) - 1) / 4;
  
  // Boost score for mentors with many ratings (more reliable)
  const reliabilityBoost = Math.min(1, rating_count / 20); // Max boost at 20 ratings
  
  return Math.min(1, normalizedRating * (0.8 + 0.2 * reliabilityBoost));
}

/**
 * Get potential mentors for a student based on a skill request
 */
router.get("/mentors/:skillId", authenticateToken, async (req, res) => {
  try {
    const { skillId } = req.params;
    const studentId = req.user.id;

    // Get student profile
    const studentQuery = `
      SELECT up.*, u.first_name, u.last_name, u.email
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    const studentResult = await pool.query(studentQuery, [studentId]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const student = studentResult.rows[0];

    // Get all mentors who offer this skill
    const mentorsQuery = `
      SELECT DISTINCT u.id as user_id, u.first_name, u.last_name, u.email, 
             up.campus, up.availability, up.bio, up.avatar_url
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      JOIN user_skills us ON u.id = us.user_id
      WHERE us.skill_id = $1 
        AND us.skill_type = 'offered'
        AND u.id != $2  -- Don't match student with themselves
    `;
    const mentorsResult = await pool.query(mentorsQuery, [skillId, studentId]);

    if (mentorsResult.rows.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No mentors found for this skill"
      });
    }

    // Calculate match scores for each mentor
    const mentorsWithScores = [];
    const sessionRequest = { skillId: parseInt(skillId) };

    for (const mentor of mentorsResult.rows) {
      const matchScore = await calculateMatchScore(student, mentor, sessionRequest);
      
      // Record match for ML training data
      await MatchingService.recordMatch(
        studentId,
        mentor.user_id,
        parseInt(skillId),
        matchScore.totalScore,
        matchScore.breakdown
      );
      
      mentorsWithScores.push({
        user: {
          id: mentor.user_id,
          first_name: mentor.first_name,
          last_name: mentor.last_name,
          email: mentor.email,
          avatar_url: mentor.avatar_url
        },
        profile: {
          campus: mentor.campus,
          bio: mentor.bio
        },
        matchScore: matchScore.totalScore,
        scoreBreakdown: matchScore.breakdown
      });
    }

    // Sort by match score (highest first)
    mentorsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: mentorsWithScores
    });

  } catch (error) {
    console.error("Error getting mentors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/**
 * Get detailed match information between a student and mentor
 */
router.get("/match-detail/:mentorId/:skillId", authenticateToken, async (req, res) => {
  try {
    const { mentorId, skillId } = req.params;
    const studentId = req.user.id;

    // Get student profile
    const studentQuery = `
      SELECT up.*, u.first_name, u.last_name, u.email
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    const studentResult = await pool.query(studentQuery, [studentId]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const student = studentResult.rows[0];

    // Get mentor profile
    const mentorQuery = `
      SELECT up.*, u.first_name, u.last_name, u.email
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    const mentorResult = await pool.query(mentorQuery, [mentorId]);

    if (mentorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mentor profile not found"
      });
    }

    const mentor = mentorResult.rows[0];
    const sessionRequest = { skillId: parseInt(skillId) };

    // Calculate match score
    const matchScore = await calculateMatchScore(student, mentor, sessionRequest);

    res.json({
      success: true,
      data: {
        student: {
          id: studentId,
          first_name: student.first_name,
          last_name: student.last_name
        },
        mentor: {
          id: parseInt(mentorId),
          first_name: mentor.first_name,
          last_name: mentor.last_name
        },
        matchScore: matchScore.totalScore,
        scoreBreakdown: matchScore.breakdown,
        recommendation: matchScore.totalScore > 0.7 
          ? "Highly Recommended" 
          : matchScore.totalScore > 0.4 
            ? "Recommended" 
            : "Limited Match"
      }
    });

  } catch (error) {
    console.error("Error getting match detail:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/**
 * Get training data for ML model
 * This endpoint provides the dataset needed to train the AI matching algorithm
 */
router.get("/training-data", authenticateToken, async (req, res) => {
  try {
    // In a production environment, you might want to add admin authentication here
    const trainingData = await MatchingService.getTrainingData();
    
    res.json({
      success: true,
      data: trainingData,
      count: trainingData.length
    });
  } catch (error) {
    console.error("Error getting training data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;