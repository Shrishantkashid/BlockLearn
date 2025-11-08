const { MongoClient } = require('mongodb');

// Try direct connection instead of SRV
// First, we need to find the actual hosts from your SRV record
console.log('Attempting to connect using direct host connection...');

// This is a common pattern for MongoDB Atlas clusters
// You'll need to replace these with the actual hosts from your Atlas cluster
const directUri = "mongodb://skshrishant44_db_user:2x2f3TC6hs6Ccw2U@cluster0-shard-00-00.uz69bui.mongodb.net:27017,cluster0-shard-00-01.uz69bui.mongodb.net:27017,cluster0-shard-00-02.uz69bui.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxxx-shard-0&authSource=admin&retryWrites=true";

console.log('Testing direct connection (this is just an example format)');
console.log('You need to get the actual hostnames from your MongoDB Atlas dashboard');

console.log('\nTo get the correct direct connection string:');
console.log('1. Go to MongoDB Atlas dashboard');
console.log('2. Click on your cluster');
console.log('3. Click "Connect"');
console.log('4. Choose "Connect your application"');
console.log('5. Choose "Node.js" driver');
console.log('6. Copy the connection string and replace <password> with your actual password');