const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDB } = require('../config/database');
// Removed direct uuid import - will use dynamic import instead
const crypto = require('crypto');

const router = express.Router();

// Helper function to dynamically import uuid
async function getUuid() {
  const { v4: uuidv4 } = await import('uuid');
  return { uuidv4 };
}

// ✅ Create a new session request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mentorId, skillId, initialMessage } = req.body;

    if (!mentorId || !skillId) {
      return res.status(400).json({
        success: false,
        message: "Mentor ID and skill ID are required"
      });
    }

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const skillsCollection = db.collection('skills');

    // Import uuid
    const { uuidv4 } = await getUuid();

    // Verify the mentor exists
    const mentor = await usersCollection.findOne({ _id: mentorId });
    if (!mentor) {
      return res.status(400).json({
        success: false,
        message: "Mentor not found"
      });
    }

    // Verify the skill exists
    const skill = await skillsCollection.findOne({ _id: skillId });
    if (!skill) {
      return res.status(400).json({
        success: false,
        message: "Skill not found"
      });
    }

    // Generate a unique chat room ID
    const chatRoomId = `session_request_${uuidv4()}`;

    // Create the session request
    const newSessionRequest = {
      _id: uuidv4(),
      student_id: userId,
      mentor_id: mentorId,
      skill_id: skillId,
      status: 'pending',
      proposed_times: [],
      chat_room_id: chatRoomId,
      created_at: new Date(),
      updated_at: new Date()
    };

    const sessionRequestsCollection = db.collection('session_requests');
    const result = await sessionRequestsCollection.insertOne(newSessionRequest);

    // Add initial message if provided
    if (initialMessage) {
      const messagesCollection = db.collection('session_request_messages');
      const initialMessageDoc = {
        _id: uuidv4(),
        session_request_id: newSessionRequest._id,
        sender_id: userId,
        message: initialMessage,
        message_type: 'text',
        created_at: new Date()
      };
      
      await messagesCollection.insertOne(initialMessageDoc);
    }

    res.status(201).json({
      success: true,
      message: "Session request created successfully",
      data: {
        ...newSessionRequest,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error("Error creating session request:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get session requests for a user (both as student and mentor)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const sessionRequestsCollection = db.collection('session_requests');
    const usersCollection = db.collection('users');
    const skillsCollection = db.collection('skills');

    // Find session requests where user is either student or mentor
    const sessionRequests = await sessionRequestsCollection.find({
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    }).sort({ created_at: -1 }).toArray();

    // Enrich session requests with user and skill data
    const enrichedSessionRequests = [];
    for (const request of sessionRequests) {
      // Get student info
      const student = await usersCollection.findOne({ _id: request.student_id });
      
      // Get mentor info
      const mentor = await usersCollection.findOne({ _id: request.mentor_id });
      
      // Get skill info
      const skill = await skillsCollection.findOne({ _id: request.skill_id });
      
      enrichedSessionRequests.push({
        ...request,
        student: {
          id: student ? student._id : null,
          first_name: student ? student.first_name : null,
          last_name: student ? student.last_name : null,
          email: student ? student.email : null
        },
        mentor: {
          id: mentor ? mentor._id : null,
          first_name: mentor ? mentor.first_name : null,
          last_name: mentor ? mentor.last_name : null,
          email: mentor ? mentor.email : null
        },
        skill: {
          id: skill ? skill._id : null,
          name: skill ? skill.name : null,
          category: skill ? skill.category : null
        }
      });
    }

    res.json({
      success: true,
      data: enrichedSessionRequests
    });

  } catch (error) {
    console.error("Error getting session requests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get messages for a session request
router.get('/:sessionRequestId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionRequestId } = req.params;
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const sessionRequestsCollection = db.collection('session_requests');

    // Verify the session request exists and user is authorized
    const sessionRequest = await sessionRequestsCollection.findOne({
      _id: sessionRequestId,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: "Session request not found or not authorized"
      });
    }

    // Get messages for this session request
    const messagesCollection = db.collection('session_request_messages');
    const messages = await messagesCollection.find({ session_request_id: sessionRequestId })
      .sort({ created_at: 1 })
      .toArray();

    // Enrich messages with sender info
    const usersCollection = db.collection('users');
    const enrichedMessages = [];
    for (const message of messages) {
      const sender = await usersCollection.findOne({ _id: message.sender_id });
      enrichedMessages.push({
        ...message,
        sender: {
          id: sender ? sender._id : null,
          first_name: sender ? sender.first_name : null,
          last_name: sender ? sender.last_name : null
        }
      });
    }

    res.json({
      success: true,
      data: enrichedMessages
    });

  } catch (error) {
    console.error("Error getting session request messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Send a message in a session request chat
router.post('/:sessionRequestId/messages', authenticateToken, async (req, res) => {
  try {
    const { sessionRequestId } = req.params;
    const userId = req.user.id;
    const { message, messageType = 'text', metadata } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty"
      });
    }

    // Get database connection
    const db = await getDB();
    const sessionRequestsCollection = db.collection('session_requests');

    // Import uuid
    const { uuidv4 } = await getUuid();

    // Verify the session request exists and user is authorized
    const sessionRequest = await sessionRequestsCollection.findOne({
      _id: sessionRequestId,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: "Session request not found or not authorized"
      });
    }

    // Save the message
    const messagesCollection = db.collection('session_request_messages');
    const newMessage = {
      _id: uuidv4(),
      session_request_id: sessionRequestId,
      sender_id: userId,
      message: message.trim(),
      message_type: messageType,
      metadata: metadata || {},
      created_at: new Date()
    };

    await messagesCollection.insertOne(newMessage);

    // Update the session request's updated_at timestamp
    await sessionRequestsCollection.updateOne(
      { _id: sessionRequestId },
      { $set: { updated_at: new Date() } }
    );

    // Enrich message with sender info
    const usersCollection = db.collection('users');
    const sender = await usersCollection.findOne({ _id: userId });

    const enrichedMessage = {
      ...newMessage,
      sender: {
        id: sender ? sender._id : null,
        first_name: sender ? sender.first_name : null,
        last_name: sender ? sender.last_name : null
      }
    };

    res.json({
      success: true,
      message: "Message sent successfully",
      data: enrichedMessage
    });

  } catch (error) {
    console.error("Error sending session request message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Propose a time for the session
router.post('/:sessionRequestId/proposetimes', authenticateToken, async (req, res) => {
  try {
    const { sessionRequestId } = req.params;
    const userId = req.user.id;
    const { proposedTime } = req.body;

    if (!proposedTime) {
      return res.status(400).json({
        success: false,
        message: "Proposed time is required"
      });
    }

    // Get database connection
    const db = await getDB();
    const sessionRequestsCollection = db.collection('session_requests');

    // Import uuid
    const { uuidv4 } = await getUuid();

    // Verify the session request exists and user is authorized
    const sessionRequest = await sessionRequestsCollection.findOne({
      _id: sessionRequestId,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: "Session request not found or not authorized"
      });
    }

    // Add the proposed time to the session request
    const proposal = {
      id: uuidv4(),
      proposer_id: userId,
      proposed_time: proposedTime,
      status: 'pending',
      created_at: new Date()
    };

    await sessionRequestsCollection.updateOne(
      { _id: sessionRequestId },
      { 
        $push: { proposed_times: proposal },
        $set: { updated_at: new Date() }
      }
    );

    // Add a system message to the chat
    const messagesCollection = db.collection('session_request_messages');
    const systemMessage = {
      _id: uuidv4(),
      session_request_id: sessionRequestId,
      sender_id: userId,
      message: `Proposed a session time: ${new Date(proposedTime).toLocaleString()}`,
      message_type: 'proposal',
      metadata: { proposal_id: proposal.id },
      created_at: new Date()
    };

    await messagesCollection.insertOne(systemMessage);

    res.json({
      success: true,
      message: "Time proposed successfully",
      data: proposal
    });

  } catch (error) {
    console.error("Error proposing time:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Respond to a proposed time
router.post('/:sessionRequestId/proposetimes/:proposalId/respond', authenticateToken, async (req, res) => {
  try {
    const { sessionRequestId, proposalId } = req.params;
    const userId = req.user.id;
    const { response } = req.body; // 'accepted' or 'rejected'

    if (!response || !['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: "Valid response ('accepted' or 'rejected') is required"
      });
    }

    // Get database connection
    const db = await getDB();
    const sessionRequestsCollection = db.collection('session_requests');

    // Import uuid
    const { uuidv4 } = await getUuid();

    // Verify the session request exists and user is authorized
    const sessionRequest = await sessionRequestsCollection.findOne({
      _id: sessionRequestId,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: "Session request not found or not authorized"
      });
    }

    // Find the proposal
    const proposal = sessionRequest.proposed_times.find(p => p.id === proposalId);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found"
      });
    }

    // Prevent the proposer from responding to their own proposal
    if (proposal.proposer_id === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot respond to your own proposal"
      });
    }

    // Update the proposal status
    const updatedProposedTimes = sessionRequest.proposed_times.map(p => 
      p.id === proposalId ? { ...p, status: response } : p
    );

    await sessionRequestsCollection.updateOne(
      { _id: sessionRequestId },
      { 
        $set: { 
          proposed_times: updatedProposedTimes,
          updated_at: new Date()
        }
      }
    );

    // If the proposal is accepted, update the session request status and create the session
    if (response === 'accepted') {
      // Update session request status
      await sessionRequestsCollection.updateOne(
        { _id: sessionRequestId },
        { 
          $set: { 
            status: 'scheduled',
            accepted_time: proposal.proposed_time,
            updated_at: new Date()
          }
        }
      );

      // Create the actual session in the sessions collection
      const sessionsCollection = db.collection('sessions');
      const newSession = {
        _id: uuidv4(),
        student_id: sessionRequest.student_id,
        mentor_id: sessionRequest.mentor_id,
        skill_id: sessionRequest.skill_id,
        scheduled_at: new Date(proposal.proposed_time),
        duration_minutes: 60, // Default duration
        status: 'scheduled',
        location: 'Online',
        notes: `Session scheduled through chat-based booking`,
        created_at: new Date(),
        updated_at: new Date()
      };

      await sessionsCollection.insertOne(newSession);

      // Generate Jitsi meeting link
      const jitsiRoomName = crypto.randomUUID();
      const meetingLink = `https://meet.jit.si/${jitsiRoomName}`;

      // Create video call session
      const videoCallSessionsCollection = db.collection('video_call_sessions');
      const newVideoCallSession = {
        _id: uuidv4(),
        session_request_id: sessionRequestId,
        jitsi_room_name: jitsiRoomName,
        meeting_link: meetingLink,
        created_at: new Date()
      };

      await videoCallSessionsCollection.insertOne(newVideoCallSession);

      // Add system messages to the chat
      const messagesCollection = db.collection('session_request_messages');
      
      // Session scheduled message
      const scheduledMessage = {
        _id: uuidv4(),
        session_request_id: sessionRequestId,
        sender_id: userId,
        message: `Session scheduled for ${new Date(proposal.proposed_time).toLocaleString()} (60 minutes)`,
        message_type: 'system',
        created_at: new Date()
      };

      await messagesCollection.insertOne(scheduledMessage);

      // Jitsi link message
      const jitsiMessage = {
        _id: uuidv4(),
        session_request_id: sessionRequestId,
        sender_id: userId,
        message: `Join video call: ${meetingLink}`,
        message_type: 'jitsi_link',
        metadata: { 
          jitsi_room_name: jitsiRoomName,
          meeting_link: meetingLink
        },
        created_at: new Date()
      };

      await messagesCollection.insertOne(jitsiMessage);
    }

    // Add response message to the chat
    const messagesCollection = db.collection('session_request_messages');
    const responseMessage = {
      _id: uuidv4(),
      session_request_id: sessionRequestId,
      sender_id: userId,
      message: `Proposal ${response}`,
      message_type: 'system',
      created_at: new Date()
    };

    await messagesCollection.insertOne(responseMessage);

    res.json({
      success: true,
      message: `Proposal ${response} successfully`,
      data: {
        proposal_id: proposalId,
        response: response
      }
    });

  } catch (error) {
    console.error("Error responding to proposal:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get Jitsi meeting link for a session request
router.get('/:sessionRequestId/jitsilink', authenticateToken, async (req, res) => {
  try {
    const { sessionRequestId } = req.params;
    const userId = req.user.id;

    // Get database connection
    const db = await getDB();
    const sessionRequestsCollection = db.collection('session_requests');

    // Verify the session request exists and user is authorized
    const sessionRequest = await sessionRequestsCollection.findOne({
      _id: sessionRequestId,
      $or: [
        { student_id: userId },
        { mentor_id: userId }
      ]
    });

    if (!sessionRequest) {
      return res.status(404).json({
        success: false,
        message: "Session request not found or not authorized"
      });
    }

    // Check if session is scheduled
    if (sessionRequest.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: "Session is not yet scheduled"
      });
    }

    // Get the video call session
    const videoCallSessionsCollection = db.collection('video_call_sessions');
    const videoCallSession = await videoCallSessionsCollection.findOne({ 
      session_request_id: sessionRequestId 
    });

    if (!videoCallSession) {
      return res.status(404).json({
        success: false,
        message: "Video call session not found"
      });
    }

    res.json({
      success: true,
      data: {
        jitsi_room_name: videoCallSession.jitsi_room_name,
        meeting_link: videoCallSession.meeting_link
      }
    });

  } catch (error) {
    console.error("Error getting Jitsi link:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;