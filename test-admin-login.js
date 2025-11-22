// Script to test admin login and make admin requests
const axios = require('axios');

async function testAdminLogin() {
  try {
    // Step 1: Admin login
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: 'admin@blocklearn.com',
      password: 'admin'
    });
    
    console.log('Admin login successful!');
    console.log('Token:', loginResponse.data.token);
    console.log('User:', loginResponse.data.user);
    
    const token = loginResponse.data.token;
    
    // Step 2: Use the token to make an admin request
    console.log('\nFetching mentor interviews...');
    const mentorsResponse = await axios.get('http://localhost:5000/api/admin/mentor-interviews', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Mentor interviews fetched successfully!');
    console.log('Number of mentors:', mentorsResponse.data.data.length);
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testAdminLogin();