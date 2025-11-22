const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getDB } = require("../config/database");
const MatchingService = require("../utils/matchingService");

const router = express.Router();

// ✅ Submit feedback for a session (both student and mentor)
router.post("/submit", authenticateToken, async (req, res) => {
  try {
    const { session_id, rating, feedback_type, comment } = req.body;
    const userId = req.user.id;

    if (!session_id || !rating || !feedback_type) {
      return res.status(400).json({
        success: false,
        message: "Session ID, rating, and feedback type are required"
      });
    }

    // Get database connection
    const db = await getDB();
    const sessionsCollection = db.collection('sessions');
    const feedbackSessionsCollection = db.collection('feedback_sessions');

    // Verify the session exists and the user is part of it
    const session = await sessionsCollection.findOne({
      _id: session_id,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ],
      status: 'completed'
    });

    if (!session) {
      return res.status(403).json({
        success: false,
        message: "Session not found or not authorized to submit feedback"
      });
    }

    const isStudent = session.student_id.toString() === userId.toString();

    // Check if feedback already exists for this session
    const existingFeedback = await feedbackSessionsCollection.findOne({ session_id: session_id });

    let result;
    if (!existingFeedback) {
      // Create new feedback record
      const newFeedback = {
        session_id: session_id,
        [isStudent ? 'student_rating' : 'mentor_rating']: rating,
        [isStudent ? 'student_feedback_type' : 'mentor_feedback_type']: feedback_type,
        [isStudent ? 'student_comment' : 'mentor_comment']: comment || null,
        created_at: new Date(),
        updated_at: new Date()
      };

      const insertResult = await feedbackSessionsCollection.insertOne(newFeedback);
      result = { ...newFeedback, _id: insertResult.insertedId };
    } else {
      // Update existing feedback record
      const updateFields = {
        [isStudent ? 'student_rating' : 'mentor_rating']: rating,
        [isStudent ? 'student_feedback_type' : 'mentor_feedback_type']: feedback_type,
        [isStudent ? 'student_comment' : 'mentor_comment']: comment || null,
        updated_at: new Date()
      };

      await feedbackSessionsCollection.updateOne(
        { session_id: session_id },
        { $set: updateFields }
      );

      const updatedFeedback = await feedbackSessionsCollection.findOne({ session_id: session_id });
      result = updatedFeedback;
    }

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      data: result
    });

    // Update session outcome with detailed feedback data
    try {
      const feedbackData = {
        rating: rating,
        feedback_type: feedback_type,
        comment: comment,
        is_student: isStudent
      };
      
      await MatchingService.recordSessionOutcome(
        session_id,
        true, // Connected is true since feedback was submitted
        feedbackData
      );
    } catch (feedbackError) {
      console.error("Error recording feedback for ML training:", feedbackError);
      // Don't fail the main request if ML data recording fails
    }

  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get feedback for a session
router.get("/session/:session_id", authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const sessionsCollection = db.collection('sessions');
    const feedbackSessionsCollection = db.collection('feedback_sessions');

    // Verify the session exists and the user is part of it
    const session = await sessionsCollection.findOne({
      _id: session_id,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!session) {
      return res.status(403).json({
        success: false,
        message: "Session not found or not authorized"
      });
    }

    // Get feedback for the session
    const feedback = await feedbackSessionsCollection.findOne({ session_id: session_id });

    res.json({
      success: true,
      data: feedback || null
    });

  } catch (error) {
    console.error("Error getting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get user's feedback statistics (for leaderboard integration)
router.get("/stats/:user_id", authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const currentUserId = req.user.id;

    // Users can only view their own stats unless they're an admin
    if (user_id !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user's stats"
      });
    }

    // Get database connection
    const db = await getDB();
    const sessionsCollection = db.collection('sessions');
    const feedbackSessionsCollection = db.collection('feedback_sessions');

    // Get all sessions for this user
    const sessions = await sessionsCollection.find({
      $or: [
        { student_id: user_id },
        { mentor_id: user_id }
      ],
      status: 'completed'
    }).toArray();

    // Get feedback for these sessions
    const sessionIds = sessions.map(s => s._id);
    const feedbacks = await feedbackSessionsCollection.find({
      session_id: { $in: sessionIds }
    }).toArray();

    // Calculate statistics
    let totalRatingsReceived = 0;
    let sumRatingsReceived = 0;
    let totalRatingsGiven = 0;
    let sumRatingsGiven = 0;

    feedbacks.forEach(fb => {
      // Ratings received (from others)
      if (user_id === fb.student_id.toString()) {
        if (fb.mentor_rating) {
          sumRatingsReceived += fb.mentor_rating;
          totalRatingsReceived++;
        }
      } else {
        if (fb.student_rating) {
          sumRatingsReceived += fb.student_rating;
          totalRatingsReceived++;
        }
      }

      // Ratings given (by user)
      if (user_id === fb.student_id.toString()) {
        if (fb.student_rating) {
          sumRatingsGiven += fb.student_rating;
          totalRatingsGiven++;
        }
      } else {
        if (fb.mentor_rating) {
          sumRatingsGiven += fb.mentor_rating;
          totalRatingsGiven++;
        }
      }
    });

    const avgRatingReceived = totalRatingsReceived > 0 ? sumRatingsReceived / totalRatingsReceived : 0;
    const avgRatingGiven = totalRatingsGiven > 0 ? sumRatingsGiven / totalRatingsGiven : 0;

    res.json({
      success: true,
      data: {
        total_sessions: sessions.length,
        avg_rating_received: avgRatingReceived,
        ratings_received: totalRatingsReceived,
        avg_rating_given: avgRatingGiven,
        ratings_given: totalRatingsGiven
      }
    });

  } catch (error) {
    console.error("Error getting feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get leaderboard data (top rated users)
router.get("/leaderboard", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    const sessionsCollection = db.collection('sessions');
    const feedbackSessionsCollection = db.collection('feedback_sessions');

    // This is a simplified version of the leaderboard
    // A full implementation would require complex aggregation which is beyond the scope here
    const users = await usersCollection.find({}).limit(limit).toArray();

    const leaderboard = [];
    for (const user of users) {
      const profile = await profilesCollection.findOne({ user_id: user._id });
      
      // Get sessions for this user
      const sessions = await sessionsCollection.find({
        $or: [
          { student_id: user._id },
          { mentor_id: user._id }
        ],
        status: 'completed'
      }).toArray();
      
      // Get feedback for these sessions
      const sessionIds = sessions.map(s => s._id);
      const feedbacks = await feedbackSessionsCollection.find({
        session_id: { $in: sessionIds }
      }).toArray();
      
      // Calculate average rating
      let totalRatings = 0;
      let sumRatings = 0;
      
      feedbacks.forEach(fb => {
        if (user._id.toString() === fb.student_id.toString() && fb.mentor_rating) {
          sumRatings += fb.mentor_rating;
          totalRatings++;
        } else if (user._id.toString() === fb.mentor_id.toString() && fb.student_rating) {
          sumRatings += fb.student_rating;
          totalRatings++;
        }
      });
      
      const avgRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
      
      if (totalRatings >= 3) { // Only include users with at least 3 ratings
        leaderboard.push({
          id: user._id,
          name: `${user.first_name} ${user.last_name}`,
          avatar_url: profile ? profile.avatar_url : null,
          avg_rating: avgRating,
          total_ratings: totalRatings,
          total_sessions: sessions.length
        });
      }
    }
    
    // Sort by average rating and total ratings
    leaderboard.sort((a, b) => {
      if (b.avg_rating !== a.avg_rating) {
        return b.avg_rating - a.avg_rating;
      }
      return b.total_ratings - a.total_ratings;
    });
    
    // Limit to requested number
    const limitedLeaderboard = leaderboard.slice(0, limit);

    res.json({
      success: true,
      data: limitedLeaderboard
    });

  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Simple feedback submission endpoint (for testing)
router.post("/", async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Session ID and rating are required"
      });
    }

    // Validate rating (1-5 scale)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // For testing purposes, just return success without database operations
    res.json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        sessionId: sessionId,
        rating: rating,
        comment: comment || null,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;