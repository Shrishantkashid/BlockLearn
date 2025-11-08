# MongoDB Atlas Connection Fix Guide

This guide will help you resolve the MongoDB Atlas connection issues in your BlockLearn project.

## Current Issue

The application is failing to connect to MongoDB Atlas with the error:
```
❌ MongoDB connection error: Server selection timed out after 15000 ms
Error name: MongoServerSelectionError
```

Our diagnostic script has identified a more specific issue:
```
❌ DNS resolution failed: queryA ENODATA cluster0.uz69bui.mongodb.net
```

This indicates a DNS resolution problem, which is a common issue with MongoDB Atlas connections.

## Troubleshooting Steps

### 1. Fix DNS Resolution Issues

Since we've identified a DNS resolution problem, try these steps first:

#### Option A: Change Your DNS Settings
1. Open Network Settings on your computer
2. Change your DNS servers to:
   - Google DNS: `8.8.8.8` and `8.8.4.4`
   - Or Cloudflare DNS: `1.1.1.1` and `1.0.0.1`
3. Restart your computer
4. Try connecting again

#### Option B: Use Google's Public DNS Temporarily
- Open Command Prompt as Administrator
- Run: `nslookup cluster0.uz69bui.mongodb.net 8.8.8.8`

### 2. Verify MongoDB Atlas Credentials

Check that your credentials in the [.env](file:///C:/Users/shank/OneDrive/Desktop/Mini%20Project/Blocklearn/backend/.env) file are correct:

```
MONGODB_URI=mongodb+srv://skshrishant44_db_user:YOUR_PASSWORD@cluster0.uz69bui.mongodb.net/?appName=Cluster0
```

Make sure:
- Username is correct (`skshrishant44_db_user`)
- Password is correct (replace `YOUR_PASSWORD` with the actual password)
- Cluster URL is correct (`cluster0.uz69bui.mongodb.net`)

### 3. Check IP Whitelist in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Select your cluster
4. Go to "Network Access" in the left sidebar
5. Click "Add IP Address"
6. For development, you can:
   - Add your current IP address (click "Add Current IP Address")
   - Or temporarily allow access from anywhere by adding `0.0.0.0/0` (NOT recommended for production)

### 4. Verify Database User Permissions

1. In MongoDB Atlas, go to "Database Access" in the left sidebar
2. Ensure the user `skshrishant44_db_user` exists
3. Verify the user has "Read and write to any database" permissions
4. If needed, create a new user with proper permissions

### 5. Try Different Network

If possible, try connecting from a different network (e.g., mobile hotspot) to rule out network/firewall issues.

### 6. Check if Cluster is Active

1. In MongoDB Atlas, go to "Clusters" in the left sidebar
2. Ensure your cluster is not paused
3. If it's paused, click "Resume Cluster"

## Alternative Solutions

### Option 1: Use Local MongoDB for Development

If you continue having issues with MongoDB Atlas, you can use a local MongoDB instance:

1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/
2. Update your [.env](file:///C:/Users/shank/OneDrive/Desktop/Mini%20Project/Blocklearn/backend/.env) file:
   ```
   MONGODB_URI=mongodb://localhost:27017/blocklearn
   ```

### Option 2: Use MongoDB Atlas Free Tier

If you don't have an existing MongoDB Atlas account:
1. Sign up for a free tier at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Follow the setup instructions in SETUP_INSTRUCTIONS.md

## Testing the Connection

After making changes, test the connection with:

```bash
cd backend
node comprehensive-mongo-diagnostic.js
```

Or for a simpler test:

```bash
cd backend
node complete-mongo-test.js
```

## Current Application Behavior

The application is designed to work in mock mode when MongoDB is not available, so you can continue development even without a working MongoDB connection. However, some features like user authentication, data persistence, and real-time matching will not work properly in mock mode.

## Need Help?

If you're still having issues:
1. Double-check all the steps above
2. Verify your internet connection
3. Try temporarily disabling your firewall/antivirus
4. Contact MongoDB Atlas support if the issue persists