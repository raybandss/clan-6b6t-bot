// models/TicketSetup.js
const mongoose = require('mongoose');

const ticketSetupSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  buttonLabel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TicketSetup', ticketSetupSchema);