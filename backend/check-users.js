const { connectDB } = require('./config/database');

async function checkUsers() {
  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    
    const users = await usersCollection.find({}).toArray();
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`ID: ${user._id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();