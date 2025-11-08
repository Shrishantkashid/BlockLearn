const functions = require('firebase-functions');
const app = require('./server-vercel');

// Export the API as a Firebase Function
exports.api = functions.https.onRequest(app);