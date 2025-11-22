const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { sendWelcomeEmail } = require('../config/email');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // Check if user is authenticated and has admin user type
  if (req.user && req.user.user_type === 'admin') {
    return next();
  }
  
  // If not admin, return forbidden error
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required."
  });
};

// ✅ Get all mentor interviews (public version) - Updated to show all mentors
router.get("/mentor-interviews-public", async (req, res) => {
  try {
    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const mentorApplicationsCollection = db.collection('mentor_applications');
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Find all users with user_type 'mentor'
    const allMentors = await usersCollection.find({
      user_type: 'mentor'
    }).toArray();

    // Enrich with application data and interview information
    const enrichedMentors = [];
    for (const mentor of allMentors) {
      const application = await mentorApplicationsCollection.findOne({ 
        user_id: mentor._id 
      });
      
      const interview = await interviewSessionsCollection.findOne({ 
        mentor_id: mentor._id,
        status: 'scheduled'
      });

      enrichedMentors.push({
        id: mentor._id,
        email: mentor.email,
        firstName: mentor.first_name,
        lastName: mentor.last_name,
        createdAt: mentor.created_at,
        application: application || null,
        interview: interview || null,
        user: {
          id: mentor._id,
          email: mentor.email,
          firstName: mentor.first_name,
          lastName: mentor.last_name,
          mentorApproved: mentor.mentor_approved,
          applicationStatus: application ? application.status : null
        }
      });
    }

    res.json({
      success: true,
      data: enrichedMentors
    });

  } catch (error) {
    console.error("Error getting mentors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get all mentor interviews (protected version) - Updated to show all mentors
router.get("/mentor-interviews", authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const mentorApplicationsCollection = db.collection('mentor_applications');
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Find all users with user_type 'mentor'
    const allMentors = await usersCollection.find({
      user_type: 'mentor'
    }).toArray();

    // Enrich with application data and interview information
    const enrichedMentors = [];
    for (const mentor of allMentors) {
      const application = await mentorApplicationsCollection.findOne({ 
        user_id: mentor._id 
      });
      
      const interview = await interviewSessionsCollection.findOne({ 
        mentor_id: mentor._id,
        status: 'scheduled'
      });

      enrichedMentors.push({
        id: mentor._id,
        email: mentor.email,
        firstName: mentor.first_name,
        lastName: mentor.last_name,
        createdAt: mentor.created_at,
        application: application || null,
        interview: interview || null,
        user: {
          id: mentor._id,
          email: mentor.email,
          firstName: mentor.first_name,
          lastName: mentor.last_name,
          mentorApproved: mentor.mentor_approved,
          applicationStatus: application ? application.status : null
        }
      });
    }

    res.json({
      success: true,
      data: enrichedMentors
    });

  } catch (error) {
    console.error("Error getting mentors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Approve a mentor
router.post("/mentor-approve/:mentorId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { mentorId } = req.params;

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const mentorApplicationsCollection = db.collection('mentor_applications');

    // Update user to mark as approved mentor
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(mentorId) },
      { 
        $set: { 
          mentor_approved: true,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    // Update application status
    await mentorApplicationsCollection.updateOne(
      { user_id: new ObjectId(mentorId) },
      { 
        $set: { 
          status: 'approved',
          updated_at: new Date()
        }
      }
    );
    
    // Transfer skills from application to user_skills collection
    const mentorApplication = await mentorApplicationsCollection.findOne({ user_id: new ObjectId(mentorId) });
    if (mentorApplication && mentorApplication.skills) {
      // Get skills collection
      const skillsCollection = db.collection('skills');
      const userSkillsCollection = db.collection('user_skills');
      
      // Parse skills from application (handle both comma-separated and free text)
      let skillList = [];
      
      // First try to split by commas
      if (mentorApplication.skills.includes(',')) {
        skillList = mentorApplication.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      } else {
        // If no commas, try to split by common separators or treat as single skill
        // Try splitting by common separators
        const separators = [',', ';', '\n', '\r'];
        let skillsText = mentorApplication.skills;
        
        // Replace all separators with commas
        for (const separator of separators) {
          skillsText = skillsText.replace(new RegExp(separator, 'g'), ',');
        }
        
        // Split by comma and clean up
        skillList = skillsText.split(',').map(skill => skill.trim()).filter(skill => skill);
        
        // If still no skills or too many from single line, treat as single skill
        if (skillList.length === 0 || (skillList.length > 10 && !mentorApplication.skills.includes(','))) {
          skillList = [mentorApplication.skills.trim()];
        }
      }
      
      // For each skill, either find existing skill or create new one
      for (const skillName of skillList) {
        // Skip if skill name is too short
        if (skillName.length < 2) continue;
        
        // Try to find existing skill (case insensitive)
        let skill = await skillsCollection.findOne({ 
          name: { $regex: new RegExp(`^${skillName}$`, 'i') } 
        });
        
        // If skill doesn't exist, create it
        if (!skill) {
          const skillResult = await skillsCollection.insertOne({
            name: skillName,
            category: 'Other',
            created_at: new Date(),
            updated_at: new Date()
          });
          skill = { _id: skillResult.insertedId, name: skillName };
        }
        
        // Add skill to user_skills collection
        await userSkillsCollection.updateOne(
          { user_id: new ObjectId(mentorId), skill_id: skill._id, skill_type: 'offered' },
          { 
            $set: { 
              user_id: new ObjectId(mentorId),
              skill_id: skill._id,
              skill_type: 'offered',
              proficiency_level: 3, // Default proficiency level
              description: '',
              updated_at: new Date()
            }
          },
          { upsert: true }
        );
      }
    }

    // Get the updated user
    const user = await usersCollection.findOne({ _id: new ObjectId(mentorId) });

    res.json({
      success: true,
      message: "Mentor approved successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        mentorApproved: user.mentor_approved
      }
    });

  } catch (error) {
    console.error("Error approving mentor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Reject a mentor
router.post("/mentor-reject/:mentorId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { mentorId } = req.params;

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const mentorApplicationsCollection = db.collection('mentor_applications');

    // Update user to mark as rejected mentor
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(mentorId) },
      { 
        $set: { 
          mentor_approved: false,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    // Update application status
    await mentorApplicationsCollection.updateOne(
      { user_id: new ObjectId(mentorId) },
      { 
        $set: { 
          status: 'rejected',
          updated_at: new Date()
        }
      }
    );

    // Get the updated user
    const user = await usersCollection.findOne({ _id: new ObjectId(mentorId) });

    res.json({
      success: true,
      message: "Mentor rejected successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        mentorApproved: user.mentor_approved
      }
    });

  } catch (error) {
    console.error("Error rejecting mentor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Get mentor application details
router.get("/mentor-application/:mentorId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { mentorId } = req.params;

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const mentorApplicationsCollection = db.collection('mentor_applications');
    const userSkillsCollection = db.collection('user_skills');
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Get user
    const user = await usersCollection.findOne({ _id: new ObjectId(mentorId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    // Get application
    const application = await mentorApplicationsCollection.findOne({ 
      user_id: new ObjectId(mentorId) 
    });
    
    // Get interview session
    const interview = await interviewSessionsCollection.findOne({ 
      mentor_id: new ObjectId(mentorId),
      status: 'scheduled'
    });

    // Get skills
    const skills = await userSkillsCollection.find({ 
      user_id: new ObjectId(mentorId) 
    }).toArray();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
          mentorApproved: user.mentor_approved,
          createdAt: user.created_at
        },
        application: application || null,
        skills: skills,
        interview: interview || null
      }
    });

  } catch (error) {
    console.error("Error getting mentor application:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Schedule an interview for a mentor
router.post("/schedule-interview/:mentorId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { scheduledAt, durationMinutes } = req.body;

    // Get database connection
    const db = await getDB();
    const usersCollection = db.collection('users');
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Verify mentor exists
    const mentor = await usersCollection.findOne({ 
      _id: new ObjectId(mentorId),
      user_type: 'mentor'
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    // Check if mentor already has a scheduled interview
    const existingInterview = await interviewSessionsCollection.findOne({ 
      mentor_id: new ObjectId(mentorId),
      status: 'scheduled'
    });

    if (existingInterview) {
      return res.status(400).json({
        success: false,
        message: "Mentor already has a scheduled interview"
      });
    }

    // Generate unique random code for the interview
    const generateUniqueCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const interviewCode = generateUniqueCode();

    // Generate a unique Jitsi room name using crypto.randomUUID()
    const jitsiRoomName = require('crypto').randomUUID();

    // Generate moderated meeting links for admin and mentor
    // Admin link (moderated)
    const adminMeetingLink = `https://moderated.jitsi.net/${jitsiRoomName}`;
    // Mentor link (standard with room name)
    const mentorMeetingLink = `https://meet.jit.si/${jitsiRoomName}`;

    // Schedule the interview
    const interviewData = {
      mentor_id: new ObjectId(mentorId),
      scheduled_at: new Date(scheduledAt),
      duration_minutes: durationMinutes || 30,
      status: 'scheduled',
      meeting_link: mentorMeetingLink, // Default link for mentor
      admin_meeting_link: adminMeetingLink, // Separate link for admin
      interview_code: interviewCode, // Store the unique code
      jitsi_room_name: jitsiRoomName, // Store the unique Jitsi room name
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await interviewSessionsCollection.insertOne(interviewData);

    // Send email notification with interview details
    try {
      const nodemailer = require('nodemailer');
      
      // Create transporter
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Format the interview date and time
      const interviewDate = new Date(interviewData.scheduled_at);
      const formattedDate = interviewDate.toLocaleDateString();
      const formattedTime = interviewDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      // Email content
      const mailOptions = {
        from: `"BlockLearn Platform" <${process.env.EMAIL_USER}>`,
        to: mentor.email,
        subject: 'Your Qoder Interview Details are Here 💬',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2b57af; font-size: 28px; margin-bottom: 10px;">Interview Details</h1>
                <div style="width: 60px; height: 4px; background-color: #2b57af; margin: 0 auto;"></div>
              </div>
              
              <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi ${mentor.first_name},</p>
              
              <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                Thank you for completing your mentor onboarding process. We're excited to have you as part of our mentoring team!
              </p>
              
              <div style="background-color: #e8f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h2 style="color: #2b57af; margin-top: 0;">Interview Details</h2>
                <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0;"><strong>Duration:</strong> ${interviewData.duration_minutes} minutes</p>
                <p style="margin: 10px 0;"><strong>Interview Code:</strong> <span style="font-size: 18px; font-weight: bold; color: #2b57af;">${interviewCode}</span></p>
                <p style="margin: 10px 0;"><strong>Admin Meeting Link:</strong> <a href="${adminMeetingLink}" style="color: #2b57af; text-decoration: none; font-weight: bold;">Join as Admin</a></p>
                <p style="margin: 10px 0;"><strong>Mentor Meeting Link:</strong> <a href="${mentorMeetingLink}" style="color: #2b57af; text-decoration: none; font-weight: bold;">Join as Mentor</a></p>
              </div>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0;">
                Please make sure to join the interview on time. If you need to reschedule, please contact our support team.
              </p>
              
              <p style="font-size: 14px; color: #666666; margin: 20px 0;">
                If you have any questions, feel free to reach out to us at ${process.env.EMAIL_USER}.
              </p>
              
              <div style="border-top: 1px solid #eeeeee; margin-top: 30px; padding-top: 20px; text-align: center;">
                <p style="font-size: 12px; color: #999999;">© 2023 BlockLearn. All rights reserved.</p>
              </div>
            </div>
          </div>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`Interview confirmation email sent to ${mentor.email}`);
    } catch (emailError) {
      console.error('Error sending interview confirmation email:', emailError);
      // Don't fail the request if email sending fails, just log the error
    }

    res.json({
      success: true,
      message: "Interview scheduled successfully",
      interviewId: result.insertedId,
      interview: {
        ...interviewData,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Update an existing interview
router.put("/update-interview/:interviewId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { scheduledAt, durationMinutes } = req.body;

    // Get database connection
    const db = await getDB();
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Update the interview
    const result = await interviewSessionsCollection.updateOne(
      { _id: new ObjectId(interviewId) },
      { 
        $set: { 
          scheduled_at: new Date(scheduledAt),
          duration_minutes: durationMinutes || 30,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Interview not found"
      });
    }

    // Get the updated interview
    const updatedInterview = await interviewSessionsCollection.findOne({ 
      _id: new ObjectId(interviewId) 
    });

    res.json({
      success: true,
      message: "Interview updated successfully",
      interview: updatedInterview
    });

  } catch (error) {
    console.error("Error updating interview:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Cancel an interview
router.delete("/cancel-interview/:interviewId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { interviewId } = req.params;

    // Get database connection
    const db = await getDB();
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Update the interview status to cancelled
    const result = await interviewSessionsCollection.updateOne(
      { _id: new ObjectId(interviewId) },
      { 
        $set: { 
          status: 'cancelled',
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Interview not found"
      });
    }

    res.json({
      success: true,
      message: "Interview cancelled successfully"
    });

  } catch (error) {
    console.error("Error cancelling interview:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Validate interview code and return meeting link
router.get("/validate-interview-code/:code", async (req, res) => {
  console.log("Validate interview code route hit with code:", req.params.code);
  try {
    const { code } = req.params;

    // Get database connection
    const db = await getDB();
    
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Find interview session with the provided code
    const interview = await interviewSessionsCollection.findOne({ 
      interview_code: code,
      status: 'scheduled'
    });

    if (!interview) {
      console.log("Interview not found for code:", code);
      return res.status(404).json({
        success: false,
        message: "Invalid or expired interview code"
      });
    }

    // Check if the interview is scheduled for today or in the future
    const now = new Date();
    const interviewDate = new Date(interview.scheduled_at);
    
    // Set time to midnight for comparison
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const interviewDay = new Date(interviewDate);
    interviewDay.setHours(0, 0, 0, 0);
    
    // Check if interview is scheduled for today or in the future
    if (interviewDay < today) {
      return res.status(400).json({
        success: false,
        message: "This interview session has already passed"
      });
    }

    res.json({
      success: true,
      meetingLink: interview.meeting_link,
      adminMeetingLink: interview.admin_meeting_link,
      jitsiRoomName: interview.jitsi_room_name,
      interviewCode: interview.interview_code,
      scheduledAt: interview.scheduled_at,
      durationMinutes: interview.duration_minutes
    });

  } catch (error) {
    console.error("Error validating interview code:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;