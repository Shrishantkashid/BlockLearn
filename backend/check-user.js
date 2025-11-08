const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkUser() {
  try {
    console.log('Checking if user exists in database...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected successfully to MongoDB');
    
    const db = client.db('blocklearn');
    const usersCollection = db.collection('users');
    
    // Check if the user exists using ObjectId
    const userId = '690b47443e85431341b38854';
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (user) {
      console.log('✅ User found:', user);
    } else {
      console.log('❌ User not found with ID:', userId);
      
      // List all users to see what IDs exist
      const users = await usersCollection.find({}).toArray();
      console.log('All users in database:');
      users.forEach(u => {
        console.log(`  ID: ${u._id}, Email: ${u.email}, Name: ${u.first_name} ${u.last_name}`);
      });
    }
    
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

checkUser();