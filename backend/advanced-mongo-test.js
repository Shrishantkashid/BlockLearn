const { MongoClient } = require('mongodb');
const dns = require('dns').promises;

// Use your MongoDB URI from the .env file
const uri = "mongodb+srv://skshrishant44_db_user:2x2f3TC6hs6Ccw2U@cluster0.uz69bui.mongodb.net/?appName=Cluster0";

console.log('Testing MongoDB connection with URI:', uri);

async function testDNS() {
  try {
    console.log('Testing DNS resolution...');
    const hostname = 'cluster0.uz69bui.mongodb.net';
    const addresses = await dns.resolve(hostname);
    console.log('DNS resolved successfully:', addresses);
    return true;
  } catch (error) {
    console.error('DNS resolution failed:', error.message);
    return false;
  }
}

async function testConnection() {
  // First test DNS
  const dnsOk = await testDNS();
  if (!dnsOk) {
    console.log('DNS resolution failed. This is likely a network issue.');
    return;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
    directConnection: false
  });

  try {
    console.log('Connecting to MongoDB...');
    console.log('This may take up to 10 seconds if there are network issues...');
    
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // Try to access the database
    const db = client.db('blocklearn');
    console.log('Database name:', db.databaseName);
    
    // Try a simple operation
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // Additional error details
    if (error.hasOwnProperty('reason')) {
      console.error('Error reason:', error.reason);
    }
    
    // Check if it's a network timeout
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n🔧 TROUBLESHOOTING TIPS:');
      console.log('1. Check MongoDB Atlas Network Access settings - your IP might not be whitelisted');
      console.log('2. Try connecting from a different network (mobile hotspot)');
      console.log('3. Check if your firewall is blocking outbound connections');
      console.log('4. Verify your database user credentials are correct');
    }
  }
}

testConnection();