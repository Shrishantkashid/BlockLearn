const { MongoClient } = require('mongodb');
require('dotenv').config();

// Use your MongoDB URI from the .env file
const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB connection with URI:', uri);

async function testConnection() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000, // 15 second timeout
    socketTimeoutMS: 45000, // 45 second socket timeout
    tls: true, // Required for Atlas
    tlsAllowInvalidCertificates: false, // Keep strict SSL
    retryWrites: true,
    maxPoolSize: 10,
    minPoolSize: 5,
    // Additional options for better Atlas connectivity
    directConnection: false,
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000
  });

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // Try to list databases
    const databases = await client.db().admin().listDatabases();
    console.log('Available databases:', databases.databases.map(db => db.name));
    
    // Test specific database
    const db = client.db('blocklearn');
    console.log('Connected to database:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // Provide specific troubleshooting guidance
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n🔧 TROUBLESHOOTING MongoDBServerSelectionError:');
      console.error('1. Check MongoDB Atlas Network Access - your IP might not be whitelisted');
      console.error('2. Verify your database user credentials are correct');
      console.error('3. Check if your firewall is blocking connections to port 27017');
      console.error('4. Try connecting from a different network');
      console.error('5. Verify DNS resolution is working properly');
    }
    
    if (error.message.includes('ECONNRESET')) {
      console.error('\n🔧 TROUBLESHOOTING ECONNRESET:');
      console.error('1. This is typically a network connectivity issue');
      console.error('2. Check your internet connection');
      console.error('3. Try using a different network');
      console.error('4. Verify MongoDB Atlas cluster is active and not paused');
      console.error('5. Check if your ISP is blocking connections to MongoDB Atlas');
    }
  }
}

testConnection();