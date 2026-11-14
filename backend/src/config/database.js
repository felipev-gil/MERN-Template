const mongoose = require('mongoose');
async function connectDatabase(url) {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 5000 });
  // Ensure the unique email index exists before accepting registrations.
  await require('../models/userModel').User.init();
}
async function closeDatabase() { await mongoose.disconnect(); }
async function assertReady() {
  if (mongoose.connection.readyState !== 1) throw new Error('Database unavailable');
  await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 3000 });
}
module.exports = { assertReady, connectDatabase, closeDatabase };

