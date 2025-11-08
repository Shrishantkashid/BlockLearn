const axios = require('axios');

async function testProfileAPI() {
  try {
    console.log('Testing profile API...');
    
    // Test getting profile data for the user
    const userId = '690b47443e85431341b38854';
    console.log(`Fetching profile for user ID: ${userId}`);
    
    const response = await axios.get(`http://localhost:5000/api/auth/profile/${userId}`);
    console.log('Profile API Response:', response.data);
    
  } catch (error) {
    console.error('❌ Profile API test error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testProfileAPI();