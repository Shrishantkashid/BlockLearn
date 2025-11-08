// backend/config/database.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blocklearn';

let client;
let db;
let isMockMode = false;

// Mock database implementation
const createMockDB = () => {
  console.warn('⚠️  Using mock database - database operations will not work');
  isMockMode = true;
  return {
    collection: (name) => ({
      find: (query) => ({
        toArray: async () => {
          console.warn(`Mock: find(${JSON.stringify(query)}) on collection ${name}`);
          return [];
        },
        sort: function() { return this; },
        limit: function() { return this; }
      }),
      findOne: async (query) => {
        console.warn(`Mock: findOne(${JSON.stringify(query)}) on collection ${name}`);
        return null;
      },
      insertOne: async (doc) => {
        console.warn(`Mock: insertOne on collection ${name}`);
        return { insertedId: 'mock-id-' + Date.now() };
      },
      insertMany: async (docs) => {
        console.warn(`Mock: insertMany on collection ${name}`);
        return { insertedCount: docs.length, insertedIds: docs.map((_, i) => 'mock-id-' + i) };
      },
      updateOne: async (filter, update) => {
        console.warn(`Mock: updateOne on collection ${name}`);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      updateMany: async (filter, update) => {
        console.warn(`Mock: updateMany on collection ${name}`);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      deleteOne: async (filter) => {
        console.warn(`Mock: deleteOne on collection ${name}`);
        return { deletedCount: 1 };
      },
      deleteMany: async (filter) => {
        console.warn(`Mock: deleteMany on collection ${name}`);
        return { deletedCount: 1 };
      },
      countDocuments: async (filter) => {
        console.warn(`Mock: countDocuments on collection ${name}`);
        return 0;
      },
      aggregate: () => ({
        toArray: async () => {
          console.warn(`Mock: aggregate on collection ${name}`);
          return [];
        }
      })
    }),
    admin: () => ({
      ping: async () => {
        console.warn('Mock: admin ping');
        return { ok: 1 };
      }
    })
  };
};

async function connectDB() {
  if (db) return db;
  
  // If we're already in mock mode, return mock database
  if (isMockMode) {
    return createMockDB();
  }
  
  try {
    console.log('Connecting to MongoDB with URI:', MONGODB_URI);
    
    // Configuration for MongoDB - adjusted for localhost vs Atlas
    const isLocalhost = MONGODB_URI.includes('127.0.0.1') || MONGODB_URI.includes('localhost');
    
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 30000, // 30 second socket timeout
      // Only use TLS for Atlas connections, not for localhost
      tls: !isLocalhost,
      tlsAllowInvalidCertificates: false, // Keep strict SSL
      retryWrites: true,
      maxPoolSize: 5, // Reduced pool size
      minPoolSize: 1, // Reduced pool size
      // For localhost, we can use direct connection
      directConnection: isLocalhost,
      connectTimeoutMS: 20000,
      heartbeatFrequencyMS: 10000,
      // Retry configuration
      retryReads: true
    });
    
    // Add event listeners for better debugging
    client.on('connectionPoolCreated', () => console.log('Connection pool created'));
    client.on('connectionPoolReady', () => console.log('Connection pool ready'));
    client.on('connectionPoolClosed', () => console.log('Connection pool closed'));
    client.on('connectionCreated', () => console.log('Connection created'));
    client.on('connectionReady', () => console.log('Connection ready'));
    client.on('connectionClosed', () => console.log('Connection closed'));
    client.on('connectionCheckOutStarted', () => console.log('Connection checkout started'));
    client.on('connectionCheckOutFailed', () => console.log('Connection checkout failed'));
    client.on('serverHeartbeatSucceeded', (event) => console.log('Server heartbeat succeeded:', event.connectionId));
    client.on('serverHeartbeatFailed', (event) => console.log('Server heartbeat failed:', event.failure));
    
    await client.connect();
    db = client.db('blocklearn'); // Explicitly specify database name
    console.log('✅ MongoDB connected successfully to database:', db.databaseName);
    
    // Test the connection with a simple operation
    try {
      await db.admin().ping();
      console.log('✅ MongoDB ping successful');
    } catch (pingError) {
      console.warn('⚠️  MongoDB ping failed:', pingError.message);
    }
    
    return db;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Connection URI:', MONGODB_URI);
    console.error('Error code:', err.code);
    console.error('Error name:', err.name);
    
    // Provide specific troubleshooting guidance
    if (err.name === 'MongoServerSelectionError') {
      console.error('\n🔧 TROUBLESHOOTING MongoDBServerSelectionError:');
      console.error('1. Check MongoDB Atlas Network Access - your IP might not be whitelisted');
      console.error('2. Verify your database user credentials are correct');
      console.error('3. Check if your firewall is blocking connections to port 27017');
      console.error('4. Try connecting from a different network');
      console.error('5. Verify DNS resolution is working properly');
    }
    
    if (err.message.includes('ECONNRESET')) {
      console.error('\n🔧 TROUBLESHOOTING ECONNRESET:');
      console.error('1. This is typically a network connectivity issue');
      console.error('2. Check your internet connection');
      console.error('3. Try using a different network');
      console.error('4. Verify MongoDB Atlas cluster is active and not paused');
      console.error('5. Check if your ISP is blocking connections to MongoDB Atlas');
    }
    
    // In development, we'll continue running but with limited functionality
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Production environment requires working MongoDB connection');
      process.exit(1);
    }
    
    // Return a mock database object for development
    return createMockDB();
  }
}

// Export a function to get the database instance
module.exports = { connectDB, getDB: () => db, isMockMode: () => isMockMode };