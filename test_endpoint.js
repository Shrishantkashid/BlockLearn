const axios = require('axios');

async function testEndpoint() {
  try {
    const response = await axios.put('http://localhost:5000/api/auth/profile', {
      userId: 'test'
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testEndpoint();