const mongoose = require('mongoose');

const userInvitesSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true
    },
    invites: {
      type: Number,
      default: 0
    },
    invitedUsers: [{
      userId: String,
      username: String,
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    joinedBy: {
      userId: String,
      username: String,
      inviteCode: String
    }
  }, { timestamps: true });
  
  module.exports = mongoose.model('UserInvites', userInvitesSchema);
  
  