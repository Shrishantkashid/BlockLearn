const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected successfully to MongoDB');
    
    const db = client.db('blocklearn'); // or whatever your database name is
    console.log('Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testConnection();