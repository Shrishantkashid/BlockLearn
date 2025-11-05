/**
 * Matching Service - Collects data for ML model training
 * This service tracks match scores and session outcomes to build a dataset
 * for training the AI matching algorithm.
 */

const { connectDB } = require("../config/database");

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
      const db = await connectDB();
      const collection = db.collection('match_history');
      
      const matchRecord = {
        student_id: studentId,
        mentor_id: mentorId,
        skill_id: skillId,
        match_score: matchScore,
        score_breakdown: scoreBreakdown,
        created_at: new Date()
      };
      
      const result = await collection.insertOne(matchRecord);
      return { ...matchRecord, _id: result.insertedId };
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
      const db = await connectDB();
      const collection = db.collection('session_outcomes');
      
      // Check if outcome already exists
      const existingOutcome = await collection.findOne({ session_id: sessionId });
      
      const outcomeRecord = {
        session_id: sessionId,
        connected: connected,
        feedback_data: feedback,
        created_at: new Date()
      };
      
      if (existingOutcome) {
        // Update existing outcome
        const result = await collection.updateOne(
          { session_id: sessionId },
          { $set: outcomeRecord }
        );
        return { ...outcomeRecord, _id: existingOutcome._id };
      } else {
        // Insert new outcome
        const result = await collection.insertOne(outcomeRecord);
        return { ...outcomeRecord, _id: result.insertedId };
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
      const db = await connectDB();
      const collection = db.collection('match_history');
      
      // For MongoDB, we'll simplify this to just return match history
      // A full implementation would require complex aggregation
      const matches = await collection.find({}).limit(10000).sort({ created_at: -1 }).toArray();
      
      // Transform MongoDB documents to match the expected format
      return matches.map(match => ({
        student_id: match.student_id,
        mentor_id: match.mentor_id,
        skill_id: match.skill_id,
        match_score: match.match_score,
        score_breakdown: match.score_breakdown,
        connected: null, // Would need to join with session_outcomes in a full implementation
        feedback_data: null,
        duration_minutes: null,
        status: null,
        student_campus: null,
        mentor_campus: null,
        response_time_seconds: null,
        student_rating: null,
        mentor_rating: null
      }));
    } catch (error) {
      console.error("Error getting training data:", error);
      throw error;
    }
  }
}

module.exports = MatchingService;