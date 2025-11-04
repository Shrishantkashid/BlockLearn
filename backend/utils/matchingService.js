/**
 * Matching Service - Collects data for ML model training
 * This service tracks match scores and session outcomes to build a dataset
 * for training the AI matching algorithm.
 */

const pool = require("../config/database");

class MatchingService {
  /**
   * Record a match event for ML training data
   * @param {number} studentId - ID of the student
   * @param {number} mentorId - ID of the mentor
   * @param {number} skillId - ID of the skill
   * @param {number} matchScore - Calculated match score (0-1)
   * @param {Object} scoreBreakdown - Detailed breakdown of the score
   */
  static async recordMatch(studentId, mentorId, skillId, matchScore, scoreBreakdown) {
    try {
      const query = `
        INSERT INTO match_history (
          student_id, mentor_id, skill_id, match_score, score_breakdown
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        studentId,
        mentorId,
        skillId,
        matchScore,
        JSON.stringify(scoreBreakdown)
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error recording match:", error);
      // Don't throw error as this is for data collection only
      return null;
    }
  }

  /**
   * Record session outcome for ML training data
   * @param {number} sessionId - ID of the session
   * @param {boolean} connected - Whether the student and mentor connected
   * @param {Object} feedback - Session feedback data
   */
  static async recordSessionOutcome(sessionId, connected, feedback = null) {
    try {
      // Check if outcome already exists
      const checkQuery = `
        SELECT id FROM session_outcomes WHERE session_id = $1
      `;
      const checkResult = await pool.query(checkQuery, [sessionId]);
      
      if (checkResult.rows.length > 0) {
        // Update existing outcome
        const updateQuery = `
          UPDATE session_outcomes 
          SET connected = $2, feedback_data = $3, created_at = CURRENT_TIMESTAMP
          WHERE session_id = $1
          RETURNING *
        `;
        const values = [
          sessionId,
          connected,
          feedback ? JSON.stringify(feedback) : null
        ];
        const result = await pool.query(updateQuery, values);
        return result.rows[0];
      } else {
        // Insert new outcome
        const insertQuery = `
          INSERT INTO session_outcomes (
            session_id, connected, feedback_data
          ) VALUES ($1, $2, $3)
          RETURNING *
        `;
        const values = [
          sessionId,
          connected,
          feedback ? JSON.stringify(feedback) : null
        ];
        const result = await pool.query(insertQuery, values);
        return result.rows[0];
      }
    } catch (error) {
      console.error("Error recording session outcome:", error);
      // Don't throw error as this is for data collection only
      return null;
    }
  }

  /**
   * Get training data for ML model
   */
  static async getTrainingData() {
    try {
      const query = `
        SELECT 
          mh.student_id,
          mh.mentor_id,
          mh.skill_id,
          mh.match_score,
          mh.score_breakdown,
          so.connected,
          so.feedback_data,
          s.duration_minutes,
          s.status,
          -- Additional features for ML
          up_student.campus as student_campus,
          up_mentor.campus as mentor_campus,
          EXTRACT(EPOCH FROM (s.scheduled_at - mh.created_at)) as response_time_seconds,
          -- Rating information
          fs.student_rating,
          fs.mentor_rating
        FROM match_history mh
        LEFT JOIN sessions s ON mh.student_id = s.student_id 
          AND mh.mentor_id = s.mentor_id 
          AND mh.skill_id = s.skill_id
        LEFT JOIN session_outcomes so ON s.id = so.session_id
        LEFT JOIN user_profiles up_student ON mh.student_id = up_student.user_id
        LEFT JOIN user_profiles up_mentor ON mh.mentor_id = up_mentor.user_id
        LEFT JOIN feedback_sessions fs ON s.id = fs.session_id
        WHERE so.connected IS NOT NULL
        ORDER BY mh.created_at DESC
        LIMIT 10000  -- Limit for performance
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error getting training data:", error);
      throw error;
    }
  }
}

module.exports = MatchingService;