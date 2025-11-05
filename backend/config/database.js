// backend/config/database.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster.mongodb.net/blocklearn?retryWrites=true&w=majority';

let client;
let db;

async function connectDB() {
  if (db) return db;
  
  try {
    // If using placeholder URI, show a clear error message
    if (MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<password>')) {
      throw new Error('MongoDB URI not configured. Please update MONGODB_URI in .env file with your actual MongoDB Atlas connection string.');
    }
    
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, {
      // Add connection options for better reliability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    await client.connect();
    db = client.db('blocklearn');
    console.log('✅ MongoDB connected successfully');
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Please check your MongoDB configuration in .env file');
    console.error('Make sure to replace <username> and <password> with your actual MongoDB credentials');
    console.error('Get your connection string from: https://cloud.mongodb.com/');
    
    // In development, we'll continue running but with limited functionality
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // Return a mock database object for development
    console.warn('⚠️  Running in offline mode - database operations will not work');
    return {
      collection: (name) => ({
        find: () => ({ toArray: async () => [] }),
        findOne: async () => null,
        insertOne: async () => ({ insertedId: 'mock-id' }),
        updateOne: async () => ({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: async () => ({ deletedCount: 0 }),
        countDocuments: async () => 0
      })
    };
  }
}

// Export a function to get the database instance
module.exports = { connectDB, getDB: () => db };