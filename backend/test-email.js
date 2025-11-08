const { sendOTP } = require('./config/email');

async function testEmail() {
  console.log('Testing email configuration...');
  
  try {
    // Test sending an OTP
    const result = await sendOTP('test@example.com', '123456');
    console.log('Email test result:', result);
    
    if (result) {
      console.log('✅ Email configuration is working correctly');
    } else {
      console.log('❌ Email configuration failed');
    }
  } catch (error) {
    console.error('Email test error:', error);
  }
}

testEmail();