# MongoDB Local Setup Configuration

## Overview
This document summarizes the changes made to configure the application to use a local MongoDB instance instead of MongoDB Atlas.

## Changes Made

### 1. Updated Environment Configuration (.env)
- Changed MONGODB_URI from MongoDB Atlas connection string to local MongoDB connection string
- New connection string: `mongodb://127.0.0.1:27017/blocklearn`

### 2. Updated Database Configuration (config/database.js)
- Updated default connection string to use IP format
- Modified MongoDB client configuration to work with both local and Atlas connections:
  - TLS is only enabled for Atlas connections, not for localhost
  - Direct connection is enabled for localhost connections
  - Adjusted connection options based on the connection type

### 3. Updated Database Migration Script (utils/databaseMigration.js)
- Enhanced error handling and messaging for local MongoDB connections
- Updated troubleshooting guidance specific to local MongoDB setup

### 4. Added Test Script (test-local-mongo.js)
- Created a simple test script to verify local MongoDB connectivity
- Tests basic database operations like insert, read, and delete

## Prerequisites
1. MongoDB must be installed locally
2. MongoDB service must be running on port 27017
3. No authentication required for local development (default configuration)

## Testing the Connection
Run the test script to verify the connection:
```bash
cd backend
node test-local-mongo.js
```

## Expected Output
If the connection is successful, you should see output similar to:
```
Environment variables loaded:
MONGODB_URI: mongodb://127.0.0.1:27017/blocklearn
JWT_SECRET: Set
PORT: 5000
Connecting to MongoDB with URI: mongodb://127.0.0.1:27017/blocklearn
Connection pool created
Connection pool ready
Connection created
Connection ready
✅ MongoDB connected successfully to database: blocklearn
✅ MongoDB ping successful
✅ Successfully connected to MongoDB
```

## Troubleshooting
If you encounter connection issues:

1. **Check if MongoDB is running**:
   - On Windows: `net start MongoDB` or check Services
   - On macOS/Linux: `sudo systemctl status mongod`

2. **Verify the port**:
   - Default MongoDB port is 27017
   - Check MongoDB configuration file for port settings

3. **Check firewall settings**:
   - Ensure port 27017 is not blocked

4. **Verify installation**:
   - Run `mongod --version` to check if MongoDB is installed

## Reverting to MongoDB Atlas
To switch back to MongoDB Atlas:
1. Update the MONGODB_URI in the .env file with your Atlas connection string
2. The application will automatically adjust the connection settings based on the URI

## Security Note
This configuration is intended for local development only. For production deployments, always use:
- Authentication enabled
- TLS/SSL encryption
- Proper access controls
- Regular backups