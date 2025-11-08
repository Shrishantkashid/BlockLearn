const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { connectDB } = require("../config/database");
const { ObjectId } = require('mongodb');
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
  // Get database connection
  const db = await connectDB();
  const userSkillsCollection = db.collection('user_skills');

  // Check if mentor offers this skill
  const mentorSkill = await userSkillsCollection.findOne({
    user_id: mentorId,
    skill_id: skillId,
    skill_type: 'offered'
  });

  if (!mentorSkill) {
    return 0; // Mentor doesn't offer this skill
  }

  // Get student's proficiency in this skill (if they have it as needed)
  const studentSkill = await userSkillsCollection.findOne({
    user_id: studentId,
    skill_id: skillId,
    skill_type: 'needed'
  });

  // Higher score if both have the skill (student needs it, mentor offers it)
  // Even higher if there's a good proficiency level difference (mentor more proficient)
  const mentorProficiency = mentorSkill.proficiency_level;
  const studentProficiency = studentSkill ? studentSkill.proficiency_level : 1;

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
  // Get database connection
  const db = await connectDB();
  const sessionsCollection = db.collection('sessions');

  // Count completed sessions for this skill
  const experienceCount = await sessionsCollection.countDocuments({
    mentor_id: mentorId,
    skill_id: skillId,
    status: 'completed'
  });

  if (experienceCount === 0) {
    return 0.3; // New mentors get a baseline score
  }

  // Score based on experience (session count)
  // Normalize to 0-1 range (e.g., 0 sessions = 0.3, 10+ sessions = 1.0)
  const experienceScore = Math.min(1, 0.3 + (experienceCount / 10) * 0.7);
  return experienceScore;
}

/**
 * Calculate mentor rating score
 */
async function calculateRatingScore(mentorId) {
  // Get database connection
  const db = await connectDB();
  const sessionsCollection = db.collection('sessions');
  const feedbackSessionsCollection = db.collection('feedback_sessions');

  // This is a simplified version since MongoDB aggregation would be more complex
  // For now, we'll return a default score
  return 0.7; // Default score for mentors
}

/**
 * Get potential mentors for a student based on a skill request
 */
router.get("/mentors/:skillId", authenticateToken, async (req, res) => {
  try {
    const { skillId } = req.params;
    const studentId = req.user.id;

    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    const userSkillsCollection = db.collection('user_skills');

    // Get student profile
    const studentUser = await usersCollection.findOne({ _id: new ObjectId(studentId) });
    
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: "Student user not found"
      });
    }
    
    // Get student profile (may not exist for new users)
    const studentProfile = await profilesCollection.findOne({ user_id: new ObjectId(studentId) });

    const student = {
      ...studentUser,
      ...(studentProfile || {}), // Merge profile data if it exists
      userId: studentId
    };

    // Get all mentors who offer this skill
    const mentorUserSkills = await userSkillsCollection.find({
      skill_id: new ObjectId(skillId),
      skill_type: 'offered',
      user_id: { $ne: new ObjectId(studentId) } // Don't match student with themselves
    }).toArray();

    if (mentorUserSkills.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No mentors found for this skill"
      });
    }

    // Get unique mentor IDs
    const mentorIds = [...new Set(mentorUserSkills.map(skill => skill.user_id.toString()))];

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

    // Calculate match scores for each mentor
    const mentorsWithScores = [];
    const sessionRequest = { skillId: skillId };

    for (const mentor of mentors) {
      const matchScore = await calculateMatchScore(student, mentor, sessionRequest);
      
      // Record match for ML training data
      await MatchingService.recordMatch(
        studentId,
        mentor.user_id,
        skillId,
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
      message: "Internal server error: " + error.message
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

    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');

    // Get student profile
    const studentUser = await usersCollection.findOne({ _id: new ObjectId(studentId) });
    
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: "Student user not found"
      });
    }
    
    // Get student profile (may not exist for new users)
    const studentProfile = await profilesCollection.findOne({ user_id: new ObjectId(studentId) });

    const student = {
      ...studentUser,
      ...(studentProfile || {}), // Merge profile data if it exists
      userId: studentId
    };

    // Get mentor profile
    const mentorUser = await usersCollection.findOne({ _id: new ObjectId(mentorId) });
    
    if (!mentorUser) {
      return res.status(404).json({
        success: false,
        message: "Mentor user not found"
      });
    }
    
    // Get mentor profile (may not exist for new users)
    const mentorProfile = await profilesCollection.findOne({ user_id: new ObjectId(mentorId) });

    const mentor = {
      ...mentorUser,
      ...(mentorProfile || {}), // Merge profile data if it exists
      userId: mentorId
    };

    const sessionRequest = { skillId: skillId };

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
          id: mentorId,
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
      message: "Internal server error: " + error.message
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

// ✅ Advanced mentor search with multiple filters
router.get("/mentors-advanced", authenticateToken, async (req, res) => {
  try {
    const { skillId, name, campus, minMatchScore } = req.query;
    const studentId = req.user.id;
    
    // Validate inputs
    if (!skillId && !name && !campus) {
      return res.status(400).json({
        success: false,
        message: "At least one search parameter (skillId, name, or campus) is required"
      });
    }
    
    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    const userSkillsCollection = db.collection('user_skills');
    
    // Get student profile
    const studentUser = await usersCollection.findOne({ _id: new ObjectId(studentId) });
    
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: "Student user not found"
      });
    }
    
    // Get student profile (may not exist for new users)
    const studentProfile = await profilesCollection.findOne({ user_id: new ObjectId(studentId) });

    const student = {
      ...studentUser,
      ...(studentProfile || {}), // Merge profile data if it exists
      userId: studentId
    };
    
    let mentors = [];
    
    // If searching by skill
    if (skillId) {
      // Get all mentors who offer this skill
      const mentorUserSkills = await userSkillsCollection.find({
        skill_id: new ObjectId(skillId),
        skill_type: 'offered',
        user_id: { $ne: new ObjectId(studentId) } // Don't match student with themselves
      }).toArray();
      
      if (mentorUserSkills.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: "No mentors found for this skill"
        });
      }
      
      // Get unique mentor IDs
      const mentorIds = [...new Set(mentorUserSkills.map(skill => skill.user_id.toString()))];
      
      // Get mentor details
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
    } else {
      // If not searching by skill, get all mentors
      const mentorUsers = await usersCollection.find({ 
        user_type: 'mentor',
        _id: { $ne: new ObjectId(studentId) },
        mentor_approved: true
      }).toArray();
      
      for (const mentorUser of mentorUsers) {
        const mentorProfile = await profilesCollection.findOne({ user_id: new ObjectId(mentorUser._id) });
        
        mentors.push({
          user_id: mentorUser._id.toString(),
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
    
    // Apply additional filters
    if (name) {
      const nameRegex = new RegExp(name, 'i'); // Case insensitive
      mentors = mentors.filter(mentor => 
        nameRegex.test(mentor.first_name) || nameRegex.test(mentor.last_name) || 
        nameRegex.test(`${mentor.first_name} ${mentor.last_name}`)
      );
    }
    
    if (campus) {
      const campusRegex = new RegExp(campus, 'i'); // Case insensitive
      mentors = mentors.filter(mentor => 
        mentor.campus && campusRegex.test(mentor.campus)
      );
    }
    
    // Calculate match scores for each mentor
    const mentorsWithScores = [];
    const sessionRequest = { skillId: skillId };
    
    for (const mentor of mentors) {
      const matchScore = skillId ? 
        await calculateMatchScore(student, mentor, sessionRequest) : 
        { totalScore: 0.5, breakdown: {} }; // Default score if no skill match
      
      // Record match for ML training data (only if searching by skill)
      if (skillId) {
        await MatchingService.recordMatch(
          studentId,
          mentor.user_id,
          skillId,
          matchScore.totalScore,
          matchScore.breakdown
        );
      }
      
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
    
    // Apply minimum match score filter
    if (minMatchScore) {
      const filteredMentors = mentorsWithScores.filter(mentor => mentor.matchScore >= parseFloat(minMatchScore));
      mentorsWithScores.splice(0, mentorsWithScores.length, ...filteredMentors);
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
      message: "Internal server error: " + error.message
    });
  }
});

module.exports = router;