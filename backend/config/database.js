// backend/config/database.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';

let client;
let db;
let mongod;

async function connectDB() {
  if (db) return db;
  
  try {
    // If MONGODB_URI is not provided or is a placeholder, use memory server in development (unless disabled)
    if (!MONGODB_URI || MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<password>')) {
      if (process.env.MONGODB_DISABLE_FALLBACK === 'true') {
        throw new Error('MongoDB URI not configured and fallback is disabled.');
      }
      console.log('⚠️  MongoDB URI not configured. Switching to MongoDB Memory Server...');
      return await startMemoryServer();
    }
    
    console.log('Connecting to MongoDB with URI:', MONGODB_URI.replace(/:[^:@]+@/, ':***@'));
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    });
    
    await client.connect();
    db = client.db('blocklearn');
    console.log('✅ MongoDB connected successfully to database:', db.databaseName);
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    
    if (err.message.includes('authentication failed')) {
      console.error('💡 TIP: Check your MongoDB Atlas credentials (username/password) in .env');
    } else if (err.name === 'MongoServerSelectionError') {
      console.error('💡 TIP: Check if your IP address is whitelisted in MongoDB Atlas Network Access');
    }

    if (process.env.NODE_ENV === 'development' && process.env.MONGODB_DISABLE_FALLBACK !== 'true') {
      console.log('⚠️  Attempting to fallback to MongoDB Memory Server...');
      return await startMemoryServer();
    }
    
    throw err;
  }
}

async function startMemoryServer() {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    console.log('🚀 MongoDB Memory Server started at:', uri);
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('blocklearn');
    console.log('✅ Connected to MongoDB Memory Server');
    return db;
  } catch (err) {
    console.error('❌ Failed to start MongoDB Memory Server:', err.message);
    return createMockDB();
  }
}

function createMockDB() {
  console.log('⚠️  Using mock database for offline development');
  return {
    collection: (name) => ({
      findOne: () => Promise.resolve(null),
      find: () => ({ toArray: () => Promise.resolve([]), limit: () => ({ toArray: () => Promise.resolve([]) }) }),
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

async function getDB() {
  try {
    return await connectDB();
  } catch (error) {
    if (process.env.MONGODB_DISABLE_FALLBACK === 'true') {
      throw error;
    }
    return createMockDB();
  }
}

module.exports = { connectDB, getDB };