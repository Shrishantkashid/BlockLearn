const { MongoClient } = require('mongodb');
require('dotenv').config();

// Use your MongoDB URI from the .env file
const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB Atlas connection');
console.log('URI:', uri);

async function testConnection() {
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000, // Increase timeout
    tls: true,
    tlsAllowInvalidCertificates: false, // Keep strict SSL
    directConnection: false
  });

  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('This may take up to 15 seconds...');
    
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    // Test database operations
    const db = client.db('blocklearn');
    console.log('Database name:', db.databaseName);
    
    // Try to create a test collection if it doesn't exist
    const collections = await db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    // Try a simple write operation
    const testCollection = db.collection('connection_test');
    const result = await testCollection.insertOne({
      test: 'connection',
      timestamp: new Date()
    });
    console.log('✅ Write operation successful, inserted ID:', result.insertedId);
    
    // Try to read it back
    const doc = await testCollection.findOne({ _id: result.insertedId });
    console.log('✅ Read operation successful:', doc);
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup successful');
    
    await client.close();
    console.log('✅ Connection closed successfully');
    
    console.log('\n🎉 MongoDB Atlas connection is working correctly!');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    
    // Provide specific troubleshooting steps
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check MongoDB Atlas Network Access settings');
    console.log('   - Go to https://cloud.mongodb.com/');
    console.log('   - Select your cluster');
    console.log('   - Go to "Network Access" in the left menu');
    console.log('   - Add your current IP address or 0.0.0.0/0 (temporary)');
    
    console.log('\n2. Verify database user credentials');
    console.log('   - Go to "Database Access" in the left menu');
    console.log('   - Ensure user "skshrishant44_db_user" exists');
    console.log('   - Verify password is correct');
    
    console.log('\n3. Check if your network/firewall is blocking connections');
    console.log('   - Try connecting from a different network');
    console.log('   - Check if corporate firewall is blocking port 27017');
    
    console.log('\n4. Test DNS resolution');
    console.log('   - Try changing your DNS to 8.8.8.8 and 8.8.4.4');
    
    console.log('\n5. Verify the connection string format');
    console.log('   - Should be: mongodb+srv://username:password@cluster.XXXXX.mongodb.net/database');
  }
}

testConnection();