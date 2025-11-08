const { MongoClient } = require('mongodb');
const dns = require('dns').promises;
require('dotenv').config();

async function testDNS(hostname) {
  try {
    console.log(`Testing DNS resolution for ${hostname}...`);
    const addresses = await dns.resolve(hostname);
    console.log('✅ DNS resolved successfully:', addresses);
    return true;
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
    return false;
  }
}

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  console.log('=== MongoDB Atlas Connection Diagnostic ===');
  console.log('URI:', uri.replace(/\/\/(.*?):(.*?)@/, '//USERNAME:PASSWORD@')); // Hide credentials
  
  // Extract hostname from URI
  const match = uri.match(/mongodb\+srv:\/\/[^@]+@([^/]+)/);
  if (!match) {
    console.error('❌ Could not parse hostname from URI');
    return;
  }
  
  const hostname = match[1];
  console.log('Hostname:', hostname);
  
  // Test DNS resolution
  const dnsOk = await testDNS(hostname);
  if (!dnsOk) {
    console.log('\n🔧 DNS resolution failed. This is likely a network issue.');
    console.log('Try changing your DNS to Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1)');
    return;
  }
  
  console.log('\n=== Testing MongoDB Connection ===');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
    tls: true,
    directConnection: false,
    retryWrites: true,
    connectTimeoutMS: 10000
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
    
    await client.close();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // Specific error handling
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n🔧 Server Selection Error - Common Causes:');
      console.error('1. IP not whitelisted in MongoDB Atlas Network Access');
      console.error('2. Incorrect username/password');
      console.error('3. Cluster paused or unavailable');
      console.error('4. Network/firewall blocking connection');
      console.error('5. DNS resolution issues');
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