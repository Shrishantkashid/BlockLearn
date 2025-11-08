const nodemailer = require('nodemailer');

// Build transporter from env. Supports either well-known service or custom host/port.
const createTransporter = () => {
  const {
    EMAIL_SERVICE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS // Changed from EMAIL_PASSWORD to EMAIL_PASS
  } = process.env;

  // Use Gmail service by default if user has Gmail account
  const useGmailService = EMAIL_SERVICE === 'gmail' || (!EMAIL_SERVICE && EMAIL_USER && EMAIL_USER.includes('@gmail.com'));

  if (useGmailService) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
  }

  if (EMAIL_SERVICE) {
    return nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
    secure: EMAIL_SECURE ? EMAIL_SECURE === 'true' : false,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
};

const transporter = createTransporter();

// Function to send OTP
const sendOTP = async (to, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"BlockLearn Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your OTP Code - BlockLearn',
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP is: <b>${otp}</b></p><p>It will expire in 10 minutes.</p>`
    });

    console.log('OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

// Function to send welcome email
const sendWelcomeEmail = async (to, firstName, userType) => {
  try {
    const info = await transporter.sendMail({
      from: `"BlockLearn Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Welcome to BlockLearn, ${firstName} 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2b57af; font-size: 28px; margin-bottom: 10px;">Welcome to BlockLearn!</h1>
              <div style="width: 60px; height: 4px; background-color: #2b57af; margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi ${firstName}, welcome to BlockLearn!</p>
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
              We're excited to have you join our community of learners and mentors. BlockLearn is a platform where you can connect with others to learn new skills or share your knowledge.
            </p>
            
            <div style="background-color: #e8f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h2 style="color: #2b57af; margin-top: 0;">What's Next?</h2>
              ${userType === 'mentor' ? `
                <p style="margin: 10px 0;"><strong>1. Complete your mentor profile</strong> - Fill in your details to get started</p>
                <p style="margin: 10px 0;"><strong>2. Schedule your interview</strong> - We'll contact you to schedule an interview</p>
                <p style="margin: 10px 0;"><strong>3. Start mentoring</strong> - Once approved, you can start helping students</p>
              ` : `
                <p style="margin: 10px 0;"><strong>1. Complete your profile</strong> - Tell us about your learning interests</p>
                <p style="margin: 10px 0;"><strong>2. Find a mentor</strong> - Browse our mentors and request sessions</p>
                <p style="margin: 10px 0;"><strong>3. Start learning</strong> - Join sessions and grow your skills</p>
              `}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/dashboard" style="background-color: #2b57af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
            </div>
            
            <p style="font-size: 14px; color: #666666; margin-top: 30px;">
              If you have any questions, feel free to reach out to us at ${process.env.EMAIL_USER}.
            </p>
            
            <div style="border-top: 1px solid #eeeeee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #999999;">© 2023 BlockLearn. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

module.exports = { sendOTP, sendWelcomeEmail };