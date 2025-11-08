const { connectDB } = require('./config/database');

async function testConnection() {
  console.log('Testing local MongoDB connection...');
  
  try {
    const db = await connectDB();
    
    if (db) {
      console.log('✅ Successfully connected to MongoDB');
      
      // Test database operations
      try {
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Test a simple write operation
        const testCollection = db.collection('connection_test');
        const result = await testCollection.insertOne({
          test: 'connection',
          timestamp: new Date()
        });
        console.log('✅ Write operation successful, inserted ID:', result.insertedId);
        
        // Test reading it back
        const doc = await testCollection.findOne({ _id: result.insertedId });
        console.log('✅ Read operation successful:', doc);
        
        // Clean up
        await testCollection.deleteOne({ _id: result.insertedId });
        console.log('✅ Cleanup successful');
        
      } catch (opError) {
        console.warn('⚠️  Database operations test failed:', opError.message);
      }
      
    } else {
      console.log('⚠️  Connected to mock database');
    }
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
  }
}

testConnection();