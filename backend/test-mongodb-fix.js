const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  console.log('Testing MongoDB connection...');
  console.log('URI:', uri.replace(/\/\/(.*?):(.*?)@/, '//USERNAME:PASSWORD@')); // Hide credentials
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
    tls: true,
    directConnection: false,
    retryWrites: true
  });
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    const db = client.db('blocklearn');
    console.log('Database:', db.databaseName);
    
    // Test a simple operation
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    // List collections
    try {
      const collections = await db.listCollections().toArray();
      console.log('Collections found:', collections.length);
      collections.forEach(col => console.log('  -', col.name));
    } catch (listError) {
      console.warn('⚠️  Could not list collections:', listError.message);
    }
    
    await client.close();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Specific error handling
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n🔧 This is a common MongoDB Atlas connection issue:');
      console.error('1. Check Network Access in MongoDB Atlas - your IP may not be whitelisted');
      console.error('2. Verify your database username and password are correct');
      console.error('3. Ensure your cluster is not paused');
      console.error('4. Try connecting from a different network');
    }
    
    if (error.message.includes('AuthenticationFailed')) {
      console.error('\n🔐 Authentication failed:');
      console.error('1. Double-check your MongoDB username and password');
      console.error('2. Ensure the user exists in Database Access settings');
      console.error('3. Verify the user has proper permissions');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n🌐 Network connectivity issue:');
      console.error('1. Check your internet connection');
      console.error('2. Verify DNS resolution is working');
      console.error('3. Check if a firewall is blocking the connection');
    }
    
    console.log('\n📝 For detailed troubleshooting, see MONGODB_ATLAS_FIX_GUIDE.md');
  }
}

testConnection();