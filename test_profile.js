const http = require('http');

const data = JSON.stringify({
  userId: 'test'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/profile',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();