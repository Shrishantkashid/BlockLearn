const axios = require('axios');

async function testOtp() {
  try {
    console.log('Testing OTP signup...');
    
    // Test signup OTP
    const signupResponse = await axios.post('http://localhost:5000/api/auth/send-otp', {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isNewUser: true
    });
    
    console.log('Signup OTP response:', signupResponse.data);
    
    // Test login OTP
    const loginResponse = await axios.post('http://localhost:5000/api/auth/send-otp', {
      email: 'test@example.com',
      isNewUser: false
    });
    
    console.log('Login OTP response:', loginResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testOtp();