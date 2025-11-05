const { sendOTP } = require('./config/email');

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    
    // Try to send a test OTP
    const result = await sendOTP('test@example.com', '123456');
    
    if (result) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Failed to send email');
    }
  } catch (error) {
    console.error('Error testing email:', error.message);
  }
}

testEmail();