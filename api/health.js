module.exports = (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'BlockLearn API is running!',
    timestamp: new Date().toISOString()
  });
};