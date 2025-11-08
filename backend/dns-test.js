const dns = require('dns').promises;

async function testDNS() {
  try {
    console.log('Testing DNS resolution for MongoDB Atlas...');
    const hostname = 'cluster0.uz69bui.mongodb.net';
    const addresses = await dns.resolve(hostname);
    console.log('✅ DNS resolved successfully:', addresses);
    return true;
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
    return false;
  }
}

testDNS();