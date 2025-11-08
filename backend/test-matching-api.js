const axios = require('axios');

// Test the matching API with proper authentication
async function testMatchingAPI() {
  // Use the valid token we generated
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBjMTkwNWM3MmVlMmViNzIyOTVhZGEiLCJlbWFpbCI6InNrc2hyaXNoYW50NDRAZ21haWwuY29tIiwidXNlclR5cGUiOiJsZWFybmVyIiwiaWF0IjoxNzYyNDIyNDYyLCJleHAiOjE3NjMwMjcyNjJ9.wW82MCTLrEUa_fKaWvl2Ls_7qHiYM6t-c8-dUI5Hwno';
  const skillId = '690c65cea7d453da3878d8a7'; // Example skill ID
  
  try {
    console.log('Testing matching API with valid authentication...');
    
    // Test getting mentors for a skill
    const mentorsResponse = await axios.get(`http://localhost:5000/api/matching/mentors/${skillId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Successfully fetched mentors:');
    console.log(JSON.stringify(mentorsResponse.data, null, 2));
    
    // If we have mentors, test getting match detail for the first one
    if (mentorsResponse.data.data && mentorsResponse.data.data.length > 0) {
      const firstMentorId = mentorsResponse.data.data[0].user.id;
      
      const matchDetailResponse = await axios.get(
        `http://localhost:5000/api/matching/match-detail/${firstMentorId}/${skillId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('\n✅ Successfully fetched match detail:');
      console.log(JSON.stringify(matchDetailResponse.data, null, 2));
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

testMatchingAPI();