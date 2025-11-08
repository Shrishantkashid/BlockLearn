const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("../config/database");
const { sendOTP, sendWelcomeEmail } = require("../config/email");
const nodemailer = require('nodemailer');
const { generateOTP, isValidCampusEmail } = require("../utils/helper");
const { authenticateToken } = require("../middleware/auth");
const { OAuth2Client } = require('google-auth-library');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // Limit each IP to 6 OTP requests per windowMs
  message: "Too many OTP requests, please try again later.",
});

// Rate limiting for OTP verification (stricter)
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 verification attempts per windowMs
  message: "Too many verification attempts, please try again later.",
});

// Debug: expose currently allowed campus email domains
router.get("/allowed-domains", (req, res) => {
  const { getAllowedDomains } = require("../utils/helper");
  return res.json({ success: true, domains: getAllowedDomains() });
});

// Debug: Google OAuth configuration check
router.get("/google-config", (req, res) => {
  return res.json({
    success: true,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdLength: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.length : 0,
    message: process.env.GOOGLE_CLIENT_ID ? "Google Client ID is configured" : "Google Client ID is missing"
  });
});

// ✅ Send OTP
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const { email: rawEmail, firstName, lastName, userType, isNewUser } = req.body;
    const email = String(rawEmail || '').trim();
    console.log('[send-otp] email received:', email);

    if (!isValidCampusEmail(email)) {
      console.warn('[send-otp] invalid campus email by validator');
      return res.status(400).json({
        success: false,
        message: "Please use a valid campus email address",
      });
    }

    // Validate names if new user
    if (isNewUser && (!firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required for registration",
      });
    }

    // Validate user type
    if (isNewUser && userType && !['learner', 'mentor'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be 'learner' or 'mentor'",
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get database connection
    const db = await connectDB();

    // Store OTP in DB
    const collection = db.collection('email_verifications');
    await collection.updateOne(
      { email: email },
      { 
        $set: { 
          email: email,
          otp: otp,
          expires_at: expiresAt,
          verified: false,
          first_name: firstName || null,
          last_name: lastName || null,
          user_type: userType || 'learner', // Default to learner if not specified
          is_new_user: isNewUser || false
        }
      },
      { upsert: true }
    );

    // Send OTP via email
    const emailSent = await sendOTP(email, otp);
    if (emailSent) {
      return res.json({
        success: true,
        message: "OTP sent to your campus email",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// SMTP health check
router.get('/email-health', async (req, res) => {
  try {
    const { EMAIL_SERVICE, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS } = process.env;
    let transportConfig;
    if (EMAIL_SERVICE) {
      transportConfig = { service: EMAIL_SERVICE, auth: { user: EMAIL_USER, pass: '***' } };
    } else {
      transportConfig = {
        host: EMAIL_HOST || 'smtp.gmail.com',
        port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
        secure: EMAIL_SECURE ? EMAIL_SECURE === 'true' : false,
        auth: { user: EMAIL_USER, pass: '***' }
      };
    }
    const transporter = nodemailer.createTransport(transportConfig);
    const verified = await transporter.verify().catch(err => ({ error: String(err && err.message || err) }));
    return res.json({ success: true, transportConfig, verified });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e && e.message || e) });
  }
});

// ✅ Verify OTP (Register + Login combined)
router.post("/verify-otp", verifyOtpLimiter, async (req, res) => {
  try {
    const { email, otp, userType } = req.body;

    // Validate inputs
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits",
      });
    }

    // Get database connection
    const db = await connectDB();

    // Check OTP
    const collection = db.collection('email_verifications');
    const otpResult = await collection.findOne({ 
      email: email, 
      otp: otp, 
      expires_at: { $gt: new Date() },
      verified: false
    });

    if (!otpResult) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark OTP as used
    await collection.updateOne(
      { email: email },
      { $set: { verified: true } }
    );

    let user;
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');

    if (otpResult.is_new_user) {
      // Validate names for new users
      if (!otpResult.first_name || !otpResult.last_name) {
        return res.status(400).json({
          success: false,
          message: "First name and last name are required for registration",
        });
      }

      // Check if user already exists (avoid duplicate email error)
      const existingUser = await usersCollection.findOne({ email: email });

      if (existingUser) {
        user = existingUser;
      } else {
        // Register new user with user type
        // For new users, prioritize the user type from the current request over the stored one
        const effectiveUserType = userType || otpResult.user_type || 'learner';
        const newUser = {
          email: email,
          first_name: otpResult.first_name,
          last_name: otpResult.last_name,
          user_type: effectiveUserType, // Use provided user type or default to learner
          campus_verified: true,
          profile_complete: false,
          mentor_approved: effectiveUserType === 'mentor' ? false : undefined, // Set mentor_approved to false for mentors
          created_at: new Date(),
          updated_at: new Date()
        };

        const userResult = await usersCollection.insertOne(newUser);
        user = { ...newUser, _id: userResult.insertedId };

        // Create empty profile
        await profilesCollection.insertOne({
          user_id: userResult.insertedId,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        // Send welcome email
        try {
          await sendWelcomeEmail(email, otpResult.first_name, effectiveUserType);
          console.log(`Welcome email sent to ${email}`);
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // Don't fail the request if email sending fails, just log the error
        }
      }
    } else {
      // Login existing user
      const existingUser = await usersCollection.findOne({ email: email });
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please register first.",
        });
      }
      user = existingUser;
    }

    // Generate JWT with user type
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        userType: user.user_type || 'learner' // Include user type in token
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: otpResult.is_new_user ? "Account created successfully" : "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type || 'learner', // Include user type in response
        campusVerified: user.campus_verified,
        profileComplete: user.profile_complete,
        mentorApproved: user.mentor_approved
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ✅ Current user (requires Authorization: Bearer <token>)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // Get database connection
    const db = await connectDB();
    const collection = db.collection('users');
    
    // Query names to ensure first/last name are present even if middleware doesn't include them
    // Use ObjectId to properly query the database
    const user = await collection.findOne({ _id: new ObjectId(req.user.id) });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type || 'learner', // Include user type in response
        campusVerified: user.campus_verified,
        profileComplete: user.profile_complete,
        mentorApproved: user.mentor_approved
      },
    });
  } catch (error) {
    console.error("Me endpoint error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ✅ Google OAuth Login
router.post("/google", async (req, res) => {
  try {
    const { credential, userType } = req.body; // Accept user type from request
    
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    // Initialize Google OAuth client
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, given_name, family_name, email_verified } = payload;
    
    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified",
      });
    }

    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');

    // Check if user exists
    let user = await usersCollection.findOne({ email: email });

    if (!user) {
      // Create new user from Google account with user type
      const newUser = {
        email: email,
        first_name: given_name,
        last_name: family_name,
        user_type: userType || 'learner', // Use provided user type or default to learner
        campus_verified: true,
        profile_complete: false,
        mentor_approved: userType === 'mentor' ? false : undefined, // Set mentor_approved to false for mentors
        created_at: new Date(),
        updated_at: new Date()
      };

      const userResult = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: userResult.insertedId };

      // Create empty profile
      await profilesCollection.insertOne({
        user_id: userResult.insertedId,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Send welcome email
      try {
        await sendWelcomeEmail(email, given_name, userType || 'learner');
        console.log(`Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the request if email sending fails, just log the error
      }
    }

    // Generate JWT with user type
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        userType: user.user_type || 'learner' // Include user type in token
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type || 'learner', // Include user type in response
        campusVerified: user.campus_verified,
        profileComplete: user.profile_complete,
        mentorApproved: user.mentor_approved
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

// ✅ Save user profile data
router.put("/profile", async (req, res) => {
  try {
    const { userId, fullName, schoolName, grade, bio, skillsToLearn, skillsToTeach, learningGoals, interests } = req.body;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    
    // Update user data and mark profile as complete
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' '),
          updated_at: new Date(),
          profile_complete: true
        }
      }
    );
    
    // Save or update profile data
    const profileData = {
      user_id: new ObjectId(userId),
      full_name: fullName,
      school_name: schoolName,
      grade: grade,
      bio: bio,
      skills_to_learn: skillsToLearn,
      skills_to_teach: skillsToTeach,
      learning_goals: learningGoals,
      interests: interests,
      updated_at: new Date()
    };
    
    await profilesCollection.updateOne(
      { user_id: new ObjectId(userId) },
      { $set: profileData },
      { upsert: true }
    );
    
    return res.json({
      success: true,
      message: "Profile saved successfully"
    });
  } catch (error) {
    console.error("Profile save error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Get user profile data
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    
    // Get user data
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Get profile data
    const profile = await profilesCollection.findOne({ user_id: new ObjectId(userId) });
    
    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        profileComplete: user.profile_complete || false
      },
      profile: profile || {}
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
});

// ✅ Admin Login - Special endpoint for admin login with fixed credentials
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check if credentials match admin credentials
    if (email !== 'admin@blocklearn.com' || password !== 'admin') {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials"
      });
    }

    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');

    // Check if admin user exists in database, if not create it
    let adminUser = await usersCollection.findOne({ email: 'admin@blocklearn.com' });
    
    if (!adminUser) {
      // Create admin user if it doesn't exist
      const adminUserData = {
        email: 'admin@blocklearn.com',
        first_name: 'Admin',
        last_name: 'User',
        user_type: 'admin',
        campus_verified: true,
        profile_complete: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await usersCollection.insertOne(adminUserData);
      adminUser = { _id: result.insertedId, ...adminUserData };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser._id.toString(),
        email: adminUser.email,
        userType: 'admin'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        firstName: adminUser.first_name,
        lastName: adminUser.last_name,
        userType: 'admin'
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ✅ Save mentor application data
router.post("/mentor-application", authenticateToken, async (req, res) => {
  try {
    const { 
      academicDetails, 
      teachingExperience, 
      skills, 
      availability 
    } = req.body;
    
    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const mentorApplicationsCollection = db.collection('mentor_applications');
    const interviewSessionsCollection = db.collection('interview_sessions');

    // Verify user is a mentor
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
    
    console.log("User data:", user); // Debug log
    console.log("Request user:", req.user); // Debug log
    
    if (!user || user.user_type !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: "Only mentors can submit applications"
      });
    }

    // Save mentor application
    const applicationData = {
      user_id: new ObjectId(req.user.id),
      academic_details: academicDetails,
      teaching_experience: teachingExperience,
      skills: skills,
      availability: availability,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Save or update application
    await mentorApplicationsCollection.updateOne(
      { user_id: new ObjectId(req.user.id) },
      { $set: applicationData },
      { upsert: true }
    );

    // Update user to set mentor_approved to false (pending approval)
    // This ensures the user's status is properly tracked
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      { 
        $set: { 
          mentor_approved: false, // Set to false to indicate pending approval
          updated_at: new Date()
        }
      }
    );

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

    // Automatically schedule an interview session for the mentor
    const interviewData = {
      mentor_id: new ObjectId(req.user.id),
      scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Schedule for 1 week from now
      duration_minutes: 30,
      status: 'scheduled',
      meeting_link: `http://localhost:5173/mentor/interview/${interviewCode}`,
      interview_code: interviewCode, // Store the unique code
      created_at: new Date(),
      updated_at: new Date()
    };

    const interviewResult = await interviewSessionsCollection.insertOne(interviewData);

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
        to: user.email,
        subject: 'Your Qoder Interview Details are Here 💬',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2b57af; font-size: 28px; margin-bottom: 10px;">Interview Details</h1>
                <div style="width: 60px; height: 4px; background-color: #2b57af; margin: 0 auto;"></div>
              </div>
              
              <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi ${user.first_name},</p>
              
              <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                Thank you for completing your mentor onboarding process. We're excited to have you as part of our mentoring team!
              </p>
              
              <div style="background-color: #e8f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h2 style="color: #2b57af; margin-top: 0;">Interview Details</h2>
                <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 10px 0;"><strong>Time:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0;"><strong>Duration:</strong> ${interviewData.duration_minutes} minutes</p>
                <p style="margin: 10px 0;"><strong>Interview Code:</strong> <span style="font-size: 18px; font-weight: bold; color: #2b57af;">${interviewCode}</span></p>
                <p style="margin: 10px 0;"><strong>Meeting Link:</strong> <a href="${interviewData.meeting_link}" style="color: #2b57af; text-decoration: none; font-weight: bold;">Join Interview</a></p>
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
      console.log(`Interview confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Error sending interview confirmation email:', emailError);
      // Don't fail the request if email sending fails, just log the error
    }

    // Get the updated user data to return
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });

    return res.json({
      success: true,
      message: "Mentor application submitted successfully! An interview has been scheduled. Please check your email for details.",
      interviewId: interviewResult.insertedId,
      interviewCode: interviewCode,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        userType: updatedUser.user_type,
        campusVerified: updatedUser.campus_verified,
        profileComplete: updatedUser.profile_complete,
        mentorApproved: updatedUser.mentor_approved
      }
    });
  } catch (error) {
    console.error("Mentor application error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

// ✅ Validate interview code and return meeting link (non-admin route)
router.get("/validate-interview-code/:code", async (req, res) => {
  console.log("Validate interview code route hit with code:", req.params.code);
  try {
    const { code } = req.params;

    // Get database connection
    const db = await connectDB();
    
    // Check if we're using a mock database
    if (!db || typeof db.collection !== 'function') {
      // Return mock data for development
      console.log("Using mock database - returning mock interview data");
      return res.json({
        success: true,
        meetingLink: `http://localhost:5173/mentor/interview/${code}`,
        interviewCode: code,
        scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
        durationMinutes: 30
      });
    }
    
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