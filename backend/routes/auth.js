const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("../config/database");
const { sendOTP } = require("../config/email");
const nodemailer = require('nodemailer');
const { generateOTP, isValidCampusEmail } = require("../utils/helper");
const { authenticateToken } = require("../middleware/auth");
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth router is working" });
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

// ✅ Send OTP
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const { email: rawEmail, firstName, lastName, isNewUser } = req.body;
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
    const { EMAIL_SERVICE, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER } = process.env;
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
    const { email, otp } = req.body;

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
        // Register new user
        const newUser = {
          email: email,
          first_name: otpResult.first_name,
          last_name: otpResult.last_name,
          campus_verified: true,
          profile_complete: false,
          created_at: new Date(),
          updated_at: new Date()
        };

        const userResult = await usersCollection.insertOne(newUser);
        user = { ...newUser, id: userResult.insertedId };

        // Create empty profile
        await profilesCollection.insertOne({
          user_id: userResult.insertedId,
          created_at: new Date(),
          updated_at: new Date()
        });
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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: otpResult.is_new_user ? "Account created successfully" : "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        campusVerified: user.campus_verified,
        profileComplete: user.profile_complete,
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
    const user = await collection.findOne({ _id: req.user.id });
    
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
        campusVerified: user.campus_verified,
        profileComplete: user.profile_complete,
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
    const { credential } = req.body;
    
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
      // Create new user from Google account
      const newUser = {
        email: email,
        first_name: given_name,
        last_name: family_name,
        campus_verified: true,
        profile_complete: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      const userResult = await usersCollection.insertOne(newUser);
      user = { ...newUser, id: userResult.insertedId };

      // Create empty profile
      await profilesCollection.insertOne({
        user_id: userResult.insertedId,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        campusVerified: user.campus_verified,
        profileComplete: user.profile_complete,
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

// ✅ Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  console.log("Profile update endpoint hit");
  console.log("Request body:", req.body);
  console.log("User from token:", req.user);
  
  try {
    const { 
      fullName, 
      schoolName, 
      grade, 
      bio, 
      skillsToLearn, 
      skillsToTeach, 
      learningGoals, 
      interests 
    } = req.body;
    
    // Basic validation
    if (!fullName || !schoolName || !grade) {
      return res.status(400).json({ 
        success: false, 
        message: "Full name, school name, and grade are required" 
      });
    }
    
    console.log("Profile update request received:", { 
      userId: req.user.id, 
      fullName, 
      schoolName, 
      grade 
    });

    // Get database connection
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');

    // Update user profile
    const user = await usersCollection.findOne({ _id: req.user.id });
    if (!user) {
      console.log("User not found:", req.user.id);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user document to mark profile as complete
    const userUpdateResult = await usersCollection.updateOne(
      { _id: req.user.id },
      { 
        $set: { 
          profile_complete: true,
          updated_at: new Date()
        }
      }
    );
    
    console.log("User update result:", userUpdateResult);

    // Update or create user profile
    const profileUpdateResult = await profilesCollection.updateOne(
      { user_id: req.user.id },
      { 
        $set: { 
          user_id: req.user.id,
          full_name: fullName,
          school_name: schoolName,
          grade: grade,
          bio: bio || "",
          skills_to_learn: skillsToLearn || "",
          skills_to_teach: skillsToTeach || "",
          learning_goals: learningGoals || "",
          interests: interests || "",
          updated_at: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log("Profile update result:", profileUpdateResult);

    console.log("Profile updated successfully for user:", req.user.id);
    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        campusVerified: user.campus_verified,
        profileComplete: true,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
});

module.exports = router;