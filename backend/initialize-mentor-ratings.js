// Script to initialize mentor ratings and session counts
const { getDB } = require('./config/database');

async function initializeMentorRatings() {
  try {
    const db = await getDB();
    const usersCollection = db.collection('users');
    const feedbackCollection = db.collection('feedback');
    
    // Find all mentors
    const mentors = await usersCollection.find({ user_type: 'mentor' }).toArray();
    
    for (const mentor of mentors) {
      // Count feedback records for this mentor
      const feedbackCount = await feedbackCollection.countDocuments({ 
        mentor_id: mentor._id 
      });
      
      // Calculate average rating
      let averageRating = 0;
      if (feedbackCount > 0) {
        const feedbackRecords = await feedbackCollection.find({ 
          mentor_id: mentor._id 
        }).toArray();
        
        const totalRating = feedbackRecords.reduce((sum, record) => sum + record.rating, 0);
        averageRating = totalRating / feedbackCount;
      }
      
      // Update mentor record
      await usersCollection.updateOne(
        { _id: mentor._id },
        { 
          $set: { 
            average_rating: averageRating,
            total_sessions: feedbackCount
          }
        }
      );
      
      console.log(`Updated mentor ${mentor.first_name} ${mentor.last_name}: ${feedbackCount} sessions, ${averageRating.toFixed(2)} average rating`);
    }
    
    console.log('All mentors updated successfully');
  } catch (error) {
    console.error('Error initializing mentor ratings:', error);
  }
}

// Run the script
initializeMentorRatings();