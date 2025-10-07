const express = require("express");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const pool = require("../config/database");
const { sendOTP } = require("../config/email");
const nodemailer = require('nodemailer');
const { generateOTP, isValidCampusEmail } = require("../utils/helper");
const { authenticateToken } = require("../middleware/auth");
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

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
    const { email: rawEmail } = req.body;
    const email = String(rawEmail || '').trim();
    console.log('[send-otp] email received:', email);

    if (!isValidCampusEmail(email)) {
      console.warn('[send-otp] invalid campus email by validator');
      return res.status(400).json({
        success: false,
        message: "Please use a valid campus email address",
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in DB
    const query = `
      INSERT INTO email_verifications (email, otp, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) 
      DO UPDATE SET otp = $2, expires_at = $3, verified = false
    `;
    await pool.query(query, [email, otp, expiresAt]);

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
    const { email, otp, firstName, lastName, isNewUser } = req.body;

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

    // Validate names if new user
    if (isNewUser && (!firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required for registration",
      });
    }

    // Check OTP
    const otpQuery = `
      SELECT * FROM email_verifications 
      WHERE email = $1 AND otp = $2 AND expires_at > NOW() AND verified = false
    `;
    const otpResult = await pool.query(otpQuery, [email, otp]);
    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark OTP as used
    await pool.query(
      "UPDATE email_verifications SET verified = true WHERE email = $1",
      [email]
    );

    let user;

    if (isNewUser) {
      // Check if user already exists (avoid duplicate email error)
      const existingUser = await pool.query(
        "SELECT id, email, first_name, last_name, campus_verified, profile_complete FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
      } else {
        // Register new user
        const userQuery = `
          INSERT INTO users (email, first_name, last_name, campus_verified)
          VALUES ($1, $2, $3, true)
          RETURNING id, email, first_name, last_name, campus_verified, profile_complete
        `;
        const userResult = await pool.query(userQuery, [email, firstName, lastName]);
        user = userResult.rows[0];

        // Create empty profile
        await pool.query("INSERT INTO user_profiles (user_id) VALUES ($1)", [user.id]);
      }
    } else {
      // Login existing user
      const userQuery = `
        SELECT id, email, first_name, last_name, campus_verified, profile_complete
        FROM users WHERE email = $1
      `;
      const userResult = await pool.query(userQuery, [email]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please register first.",
        });
      }
      user = userResult.rows[0];
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Login successful",
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
    // Query names to ensure first/last name are present even if middleware doesn't include them
    const result = await pool.query(
      "SELECT id, email, first_name, last_name, campus_verified, profile_complete FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const row = result.rows[0];
    return res.json({
      success: true,
      user: {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        campusVerified: row.campus_verified,
        profileComplete: row.profile_complete,
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

    // Check if user exists
    let user;
    const existingUser = await pool.query(
      "SELECT id, email, first_name, last_name, campus_verified, profile_complete FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
    } else {
      // Create new user from Google account
      const userQuery = `
        INSERT INTO users (email, first_name, last_name, campus_verified)
        VALUES ($1, $2, $3, true)
        RETURNING id, email, first_name, last_name, campus_verified, profile_complete
      `;
      const userResult = await pool.query(userQuery, [email, given_name, family_name]);
      user = userResult.rows[0];

      // Create empty profile
      await pool.query("INSERT INTO user_profiles (user_id) VALUES ($1)", [user.id]);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Google login successful",
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
    console.error("Google OAuth error:", error);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

// ✅ Traditional email/password login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // For testing purposes, accept any password for existing users
    // In production, you'd hash and verify passwords
    const userQuery = `
      SELECT id, email, first_name, last_name, campus_verified, profile_complete
      FROM users WHERE email = $1
    `;
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
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
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;