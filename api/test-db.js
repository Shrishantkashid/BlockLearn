const { connectDB } = require('../backend/config/database');

module.exports = async (req, res) => {
  try {
    const db = await connectDB();
    if (db) {
      res.json({ 
        success: true,
        message: 'Database connected successfully',
        database: db.databaseName || 'Connected'
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Database connection failed'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Database connection error',
      error: error.message
    });
  }
};