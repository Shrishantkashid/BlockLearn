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

// Export a function to get the database instance
module.exports = { connectDB, getDB: () => db };