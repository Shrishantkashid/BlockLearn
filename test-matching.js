/**
 * Test script for the matching system
 * This script demonstrates how the matching algorithm works
 */

// Import required modules
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test data
const testStudent = {
  userId: 1,
  firstName: "Alice",
  lastName: "Student",
  campus: "Main Campus",
  availability: JSON.stringify([
    { day: "Monday", start: "09:00", end: "12:00" },
    { day: "Wednesday", start: "14:00", end: "17:00" },
    { day: "Friday", start: "10:00", end: "13:00" }
  ])
};

const testMentor = {
  userId: 2,
  firstName: "Bob",
  lastName: "Mentor",
  campus: "Main Campus",
  availability: JSON.stringify([
    { day: "Monday", start: "10:00", end: "13:00" },
    { day: "Tuesday", start: "14:00", end: "17:00" },
    { day: "Wednesday", start: "15:00", end: "18:00" }
  ])
};

const testSessionRequest = {
  skillId: 1
};

/**
 * Calculate match score between student and mentor
 */
async function calculateMatchScore(student, mentor, sessionRequest) {
  const weights = {
    skills: 0.35,
    campus: 0.20,
    availability: 0.25,
    experience: 0.10,
    rating: 0.10
  };

  let scoreBreakdown = {};
  let totalScore = 0;

  // 1. Campus Matching (20% weight)
  const campusMatchScore = calculateCampusMatch(student.campus, mentor.campus);
  totalScore += campusMatchScore * weights.campus;
  scoreBreakdown.campus = {
    score: campusMatchScore,
    weight: weights.campus,
    contribution: campusMatchScore * weights.campus
  };

  // 2. Availability Overlap (25% weight)
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

  console.log(`Campus Match Score: ${campusMatchScore}`);
  console.log(`Availability Overlap Score: ${availabilityScore}`);
  console.log(`Total Match Score: ${totalScore}`);

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: scoreBreakdown
  };
}

/**
 * Calculate campus matching score
 */
function calculateCampusMatch(studentCampus, mentorCampus) {
  if (!studentCampus || !mentorCampus) return 0.5;
  return studentCampus === mentorCampus ? 1 : 0.3;
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
          // Simple overlap calculation
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
    return 0.5;
  }
}

// Run the test
async function runTest() {
  console.log("=== BlockLearn Matching System Test ===");
  console.log("Testing match between:");
  console.log(`Student: ${testStudent.firstName} ${testStudent.lastName}`);
  console.log(`Mentor: ${testMentor.firstName} ${testMentor.lastName}`);
  console.log("");

  const matchScore = await calculateMatchScore(testStudent, testMentor, testSessionRequest);
  
  console.log("");
  console.log("=== Match Results ===");
  console.log(`Total Match Score: ${matchScore.totalScore * 100}%`);
  console.log("");
  console.log("Score Breakdown:");
  Object.entries(matchScore.breakdown).forEach(([factor, data]) => {
    console.log(`  ${factor}: ${data.score * 100}% (weight: ${data.weight * 100}%, contribution: ${data.contribution * 100}%)`);
  });
  
  // Close database connection
  await pool.end();
}

// Execute the test
runTest().catch(console.error);