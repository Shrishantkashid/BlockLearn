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
    
    console.log('Connecting to MongoDB with URI:', MONGODB_URI.replace(/:[^:@]+@/, ':***@')); // Hide password in logs
    client = new MongoClient(MONGODB_URI, {
      // Add connection options for better reliability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10, // Limit connection pool size
      minPoolSize: 2,  // Maintain minimum connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds idle
      waitQueueTimeoutMS: 5000, // Timeout for waiting for a connection
    });
    
    await client.connect();
    db = client.db('blocklearn');
    console.log('✅ MongoDB connected successfully to database:', db.databaseName);
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
    
    // For development, throw the error to make it clear that MongoDB is required
    throw new Error('MongoDB connection failed. Please check your configuration.');
  }
}

// Enhanced function to get database with reconnection capability
async function getDB() {
  try {
    return await connectDB();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    // Return a mock database object for offline development
    console.log('⚠️  Using mock database for offline development');
    return {
      collection: (name) => ({
        findOne: () => Promise.resolve(null),
        find: () => ({ toArray: () => Promise.resolve([]) }),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        insertMany: () => Promise.resolve({ insertedIds: [] }),
        updateOne: () => Promise.resolve({ modifiedCount: 0 }),
        updateMany: () => Promise.resolve({ modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 }),
        deleteMany: () => Promise.resolve({ deletedCount: 0 }),
        countDocuments: () => Promise.resolve(0),
        createIndex: () => Promise.resolve(),
      }),
      listCollections: () => ({ toArray: () => Promise.resolve([]) }),
      createCollection: () => Promise.resolve(),
    };
  }
}

// Export functions
module.exports = { connectDB, getDB };