const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendTestEmail() {
  console.log('Testing email sending...');
  
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('❌ Missing email credentials. Please check your .env file.');
    return;
  }
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"BlockLearn Test" <${EMAIL_USER}>`,
      to: EMAIL_USER, // Send to yourself for testing
      subject: 'BlockLearn Email Configuration Test',
      text: 'This is a test email from BlockLearn to confirm email configuration is working.',
      html: '<h1>BlockLearn Email Test</h1><p>This is a test email from BlockLearn to confirm email configuration is working.</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Make sure you have enabled 2-factor authentication on your Google account');
      console.log('2. Generate an App Password at https://myaccount.google.com/apppasswords');
      console.log('3. Use the App Password (not your regular password) as EMAIL_PASS');
      console.log('4. Ensure EMAIL_USER is your full Gmail address');
    } else if (error.code === 'EENVELOPE') {
      console.log('\n🔧 Check that EMAIL_USER is a valid email address');
    }
  }
}

sendTestEmail();