const express = require('express');
const { ObjectId } = require('mongodb');
const { connectDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ✅ Connect with a mentor (send a connection request)
router.post("/connect", authenticateToken, async (req, res) => {
  try {
    const { mentorId } = req.body;
    const learnerId = req.user.id;

    // Validate inputs
    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: "Mentor ID is required"
      });
    }

    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const mentorConnectionsCollection = db.collection('mentor_connections');

    // Verify mentor exists and is actually a mentor
    const mentor = await usersCollection.findOne({ 
      _id: new ObjectId(mentorId),
      user_type: 'mentor'
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found or invalid mentor"
      });
    }

    // Verify learner exists
    const learner = await usersCollection.findOne({ 
      _id: new ObjectId(learnerId),
      user_type: 'learner'
    });

    if (!learner) {
      return res.status(400).json({
        success: false,
        message: "Invalid learner"
      });
    }

    // Check if connection request already exists
    const existingConnection = await mentorConnectionsCollection.findOne({
      learner_id: new ObjectId(learnerId),
      mentor_id: new ObjectId(mentorId),
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: "Connection request already exists"
      });
    }

    // Create connection request
    const connectionRequest = {
      learner_id: new ObjectId(learnerId),
      mentor_id: new ObjectId(mentorId),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await mentorConnectionsCollection.insertOne(connectionRequest);

    res.status(201).json({
      success: true,
      message: "Connection request sent successfully! The mentor will review your request.",
      data: {
        id: result.insertedId,
        ...connectionRequest
      }
    });

  } catch (error) {
    console.error("Connection request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Get mentor connection requests (for mentors)
router.get("/connections", authenticateToken, async (req, res) => {
  try {
    const mentorId = req.user.id;

    // Get database connection
    const db = await connectDB();
    const mentorConnectionsCollection = db.collection('mentor_connections');
    const usersCollection = db.collection('users');

    // Verify user is a mentor
    const mentor = await usersCollection.findOne({ 
      _id: new ObjectId(mentorId),
      user_type: 'mentor'
    });

    if (!mentor) {
      return res.status(403).json({
        success: false,
        message: "Only mentors can view connection requests"
      });
    }

    // Get connection requests for this mentor
    const connections = await mentorConnectionsCollection.find({
      mentor_id: new ObjectId(mentorId)
    }).sort({ created_at: -1 }).toArray();

    // Enrich with learner details
    const enrichedConnections = [];
    for (const connection of connections) {
      const learner = await usersCollection.findOne({ _id: connection.learner_id });
      
      enrichedConnections.push({
        id: connection._id,
        status: connection.status,
        created_at: connection.created_at,
        updated_at: connection.updated_at,
        learner: {
          id: learner ? learner._id : null,
          first_name: learner ? learner.first_name : null,
          last_name: learner ? learner.last_name : null,
          email: learner ? learner.email : null
        }
      });
    }

    res.json({
      success: true,
      data: enrichedConnections
    });

  } catch (error) {
    console.error("Get connections error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Accept a connection request
router.post("/accept/:connectionId", authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const mentorId = req.user.id;

    // Get database connection
    const db = await connectDB();
    const mentorConnectionsCollection = db.collection('mentor_connections');
    const usersCollection = db.collection('users');

    // Verify user is a mentor
    const mentor = await usersCollection.findOne({ 
      _id: new ObjectId(mentorId),
      user_type: 'mentor'
    });

    if (!mentor) {
      return res.status(403).json({
        success: false,
        message: "Only mentors can accept connection requests"
      });
    }

    // Find and update the connection
    const result = await mentorConnectionsCollection.updateOne(
      {
        _id: new ObjectId(connectionId),
        mentor_id: new ObjectId(mentorId),
        status: 'pending'
      },
      {
        $set: {
          status: 'accepted',
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found or already processed"
      });
    }

    res.json({
      success: true,
      message: "Connection request accepted successfully!"
    });

  } catch (error) {
    console.error("Accept connection error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Reject a connection request
router.post("/reject/:connectionId", authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const mentorId = req.user.id;

    // Get database connection
    const db = await connectDB();
    const mentorConnectionsCollection = db.collection('mentor_connections');
    const usersCollection = db.collection('users');

    // Verify user is a mentor
    const mentor = await usersCollection.findOne({ 
      _id: new ObjectId(mentorId),
      user_type: 'mentor'
    });

    if (!mentor) {
      return res.status(403).json({
        success: false,
        message: "Only mentors can reject connection requests"
      });
    }

    // Find and update the connection
    const result = await mentorConnectionsCollection.updateOne(
      {
        _id: new ObjectId(connectionId),
        mentor_id: new ObjectId(mentorId),
        status: 'pending'
      },
      {
        $set: {
          status: 'rejected',
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found or already processed"
      });
    }

    res.json({
      success: true,
      message: "Connection request rejected"
    });

  } catch (error) {
    console.error("Reject connection error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Get learner connection requests (for learners)
router.get("/learner-connections", authenticateToken, async (req, res) => {
  try {
    const learnerId = req.user.id;

    // Get database connection
    const db = await connectDB();
    const mentorConnectionsCollection = db.collection('mentor_connections');
    const usersCollection = db.collection('users');

    // Verify user is a learner
    const learner = await usersCollection.findOne({ 
      _id: new ObjectId(learnerId),
      user_type: 'learner'
    });

    if (!learner) {
      return res.status(403).json({
        success: false,
        message: "Only learners can view their connection requests"
      });
    }

    // Get connection requests for this learner
    const connections = await mentorConnectionsCollection.find({
      learner_id: new ObjectId(learnerId)
    }).sort({ created_at: -1 }).toArray();

    // Enrich with mentor details
    const enrichedConnections = [];
    for (const connection of connections) {
      const mentor = await usersCollection.findOne({ _id: connection.mentor_id });
      
      enrichedConnections.push({
        id: connection._id,
        status: connection.status,
        created_at: connection.created_at,
        updated_at: connection.updated_at,
        mentor: {
          id: mentor ? mentor._id : null,
          first_name: mentor ? mentor.first_name : null,
          last_name: mentor ? mentor.last_name : null,
          email: mentor ? mentor.email : null
        }
      });
    }

    res.json({
      success: true,
      data: enrichedConnections
    });

  } catch (error) {
    console.error("Get learner connections error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

module.exports = router;