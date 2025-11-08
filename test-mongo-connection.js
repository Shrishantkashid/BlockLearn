const { MongoClient } = require('mongodb');
require('dotenv').config({ path: __dirname + '/backend/.env' });

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    console.log('✅ Connected successfully to MongoDB');
    
    const db = client.db('blocklearn');
    console.log('Database name:', db.databaseName);
    
    // Try to list collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
  }
}

testConnection();