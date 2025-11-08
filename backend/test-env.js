require('dotenv').config({ path: __dirname + '/.env' });
const { connectDB } = require('./config/database');

console.log('=== Environment Variables Check ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');

console.log('\n=== Email Configuration Test ===');
try {
  const { sendOTP } = require('./config/email');
  console.log('Email function loaded successfully');
  // We won't actually send an email in this test to avoid spam
  console.log('Email configuration appears to be loaded correctly');
} catch (err) {
  console.log('Email configuration error:', err.message);
}

console.log('\n=== Database Connection Test ===');
connectDB().then(db => {
  if (db) {
    console.log('✅ Database connection successful');
    db.admin().ping().then(result => {
      console.log('✅ Database ping successful:', result);
    }).catch(err => {
      console.log('❌ Database ping failed:', err.message);
    });
  } else {
    console.log('❌ Database connection failed');
  }
}).catch(err => {
  console.log('❌ Database connection error:', err.message);
});
