const nodemailer = require('nodemailer');
const { generateOTP } = require('./utils/helper');

// Test email configuration
async function testEmailConfig() {
  console.log('Testing email configuration...');
  
  const {
    EMAIL_SERVICE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS
  } = process.env;

  console.log('Email config values:');
  console.log('- EMAIL_USER:', EMAIL_USER);
  console.log('- EMAIL_SERVICE:', EMAIL_SERVICE);
  console.log('- EMAIL_HOST:', EMAIL_HOST);
  console.log('- EMAIL_PORT:', EMAIL_PORT);
  console.log('- EMAIL_SECURE:', EMAIL_SECURE);
  console.log('- EMAIL_PASS:', EMAIL_PASS ? '**** (set)' : 'not set');

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('❌ Missing EMAIL_USER or EMAIL_PASS in .env file');
    return false;
  }

  try {
    // Create transporter
    let transporter;
    if (EMAIL_SERVICE === 'gmail' || (!EMAIL_SERVICE && EMAIL_USER.includes('@gmail.com'))) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
      });
    } else if (EMAIL_SERVICE) {
      transporter = nodemailer.createTransport({
        service: EMAIL_SERVICE,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: EMAIL_HOST || 'smtp.gmail.com',
        port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
        secure: EMAIL_SECURE ? EMAIL_SECURE === 'true' : false,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
      });
    }

    // Verify connection
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
}

// Test OTP generation
function testOTPGeneration() {
  console.log('\nTesting OTP generation...');
  for (let i = 0; i < 5; i++) {
    const otp = generateOTP();
    console.log(`Generated OTP ${i + 1}: ${otp}`);
  }
}

// Run tests
async function runTests() {
  require('dotenv').config();
  
  console.log('=== Email and OTP Configuration Test ===\n');
  
  await testEmailConfig();
  testOTPGeneration();
  
  console.log('\n=== Test Complete ===');
}

runTests();