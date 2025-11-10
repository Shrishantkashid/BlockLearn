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

// Function to send session scheduling email
const sendSessionScheduledEmail = async (learnerEmail, learnerName, mentorEmail, mentorName, sessionDetails) => {
  try {
    // Send email to learner
    await transporter.sendMail({
      from: `"BlockLearn Platform" <${process.env.EMAIL_USER}>`,
      to: learnerEmail,
      subject: `Session Scheduled with ${mentorName} - BlockLearn`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2b57af; font-size: 28px; margin-bottom: 10px;">Session Scheduled!</h1>
              <div style="width: 60px; height: 4px; background-color: #2b57af; margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi ${learnerName},</p>
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
              Your session with <strong>${mentorName}</strong> has been scheduled successfully.
            </p>
            
            <div style="background-color: #e8f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h2 style="color: #2b57af; margin-top: 0;">Session Details</h2>
              <p style="margin: 10px 0;"><strong>Skill:</strong> ${sessionDetails.skillName}</p>
              <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${new Date(sessionDetails.scheduledAt).toLocaleString()}</p>
              <p style="margin: 10px 0;"><strong>Duration:</strong> ${sessionDetails.durationMinutes} minutes</p>
              ${sessionDetails.location ? `<p style="margin: 10px 0;"><strong>Location:</strong> ${sessionDetails.location}</p>` : ''}
              ${sessionDetails.notes ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${sessionDetails.notes}</p>` : ''}
              ${sessionDetails.liveSessionCode ? `<p style="margin: 10px 0;"><strong>Video Call Room Code:</strong> ${sessionDetails.liveSessionCode}</p>` : ''}
            </div>
            
            ${sessionDetails.liveSessionCode ? `
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffeaa7;">
              <h2 style="color: #856404; margin-top: 0;">Video Call Information</h2>
              <p style="margin: 10px 0;">Join the video call using the link below:</p>
              <p style="margin: 10px 0;"><strong>Meeting Link:</strong> <a href="${sessionDetails.meetingLink}" style="color: #2b57af;">${sessionDetails.meetingLink}</a></p>
              <p style="margin: 10px 0;"><strong>Room Code:</strong> ${sessionDetails.liveSessionCode}</p>
              <p style="margin: 10px 0; font-size: 14px; color: #666666;">Share this code with your mentor if needed for direct access.</p>
            </div>
            ` : ''}
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
              Please make sure to be available at the scheduled time. You can view all your sessions in your dashboard.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/sessions" style="background-color: #2b57af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Sessions</a>
            </div>
            
            <p style="font-size: 14px; color: #666666; margin-top: 30px;">
              If you need to reschedule or have any questions, please contact your mentor at ${mentorEmail}.
            </p>
            
            <div style="border-top: 1px solid #eeeeee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #999999;">© 2023 BlockLearn. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });
    
    // Send email to mentor
    await transporter.sendMail({
      from: `"BlockLearn Platform" <${process.env.EMAIL_USER}>`,
      to: mentorEmail,
      subject: `Session Scheduled with ${learnerName} - BlockLearn`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2b57af; font-size: 28px; margin-bottom: 10px;">Session Scheduled!</h1>
              <div style="width: 60px; height: 4px; background-color: #2b57af; margin: 0 auto;"></div>
            </div>
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi ${mentorName},</p>
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
              Your session with <strong>${learnerName}</strong> has been scheduled successfully.
            </p>
            
            <div style="background-color: #e8f4ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h2 style="color: #2b57af; margin-top: 0;">Session Details</h2>
              <p style="margin: 10px 0;"><strong>Skill:</strong> ${sessionDetails.skillName}</p>
              <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${new Date(sessionDetails.scheduledAt).toLocaleString()}</p>
              <p style="margin: 10px 0;"><strong>Duration:</strong> ${sessionDetails.durationMinutes} minutes</p>
              ${sessionDetails.location ? `<p style="margin: 10px 0;"><strong>Location:</strong> ${sessionDetails.location}</p>` : ''}
              ${sessionDetails.notes ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${sessionDetails.notes}</p>` : ''}
              ${sessionDetails.liveSessionCode ? `<p style="margin: 10px 0;"><strong>Video Call Room Code:</strong> ${sessionDetails.liveSessionCode}</p>` : ''}
            </div>
            
            ${sessionDetails.liveSessionCode ? `
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #ffeaa7;">
              <h2 style="color: #856404; margin-top: 0;">Video Call Information</h2>
              <p style="margin: 10px 0;">Join the video call using the link below:</p>
              <p style="margin: 10px 0;"><strong>Meeting Link:</strong> <a href="${sessionDetails.meetingLink}" style="color: #2b57af;">${sessionDetails.meetingLink}</a></p>
              <p style="margin: 10px 0;"><strong>Room Code:</strong> ${sessionDetails.liveSessionCode}</p>
              <p style="margin: 10px 0; font-size: 14px; color: #666666;">Share this code with your student if needed for direct access.</p>
            </div>
            ` : ''}
            
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
              Please make sure to be available at the scheduled time. You can view all your sessions in your dashboard.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/mentor/dashboard" style="background-color: #2b57af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Sessions</a>
            </div>
            
            <p style="font-size: 14px; color: #666666; margin-top: 30px;">
              If you need to reschedule or have any questions, please contact your student at ${learnerEmail}.
            </p>
            
            <div style="border-top: 1px solid #eeeeee; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #999999;">© 2023 BlockLearn. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });
    
    console.log('Session scheduled emails sent to learner and mentor');
    return true;
  } catch (error) {
    console.error('Error sending session scheduled emails:', error);
    return false;
  }
};

module.exports = { sendOTP, sendWelcomeEmail, sendSessionScheduledEmail };