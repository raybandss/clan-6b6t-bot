const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  closed: { type: Boolean, default: false },
  ticketNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
