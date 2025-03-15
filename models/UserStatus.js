const mongoose = require('mongoose');

const userStatusSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserStatus', userStatusSchema);
