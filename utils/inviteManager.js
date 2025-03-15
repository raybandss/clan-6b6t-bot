const { Collection } = require('discord.js');
const UserInvites = require('../models/userInvites');

class InviteManager {
  constructor(client) {
    this.client = client;
    this.invitesCache = new Collection();
  }

  // Initialize invites cache for a guild
  async fetchGuildInvites(guild) {
    try {
      const invites = await guild.invites.fetch();
      console.log(`Fetched ${invites.size} invites for guild ${guild.name}`);
      
      const inviteCollection = new Map();
      invites.forEach(invite => {
        inviteCollection.set(invite.code, { 
          uses: invite.uses, 
          inviter: invite.inviter.id,
          code: invite.code
        });
      });
      
      this.invitesCache.set(guild.id, inviteCollection);
      return inviteCollection;
    } catch (error) {
      console.error(`Error fetching invites for guild ${guild.id}:`, error);
      return new Map();
    }
  }

  // Compare old and new invites to find which one was used
  findUsedInvite(oldInvites, newInvites) {
    if (!oldInvites || oldInvites.size === 0) {
      console.log('No old invites to compare');
      return null;
    }
    
    // Find the invite that has an increased use count
    for (const [code, invite] of newInvites) {
      const oldInvite = oldInvites.get(code);
      
      if (!oldInvite) {
        console.log(`New invite found: ${code}`);
        // This is a new invite, but it might not be the one used
        // Let's check if it has been used at least once
        if (invite.uses > 0) {
          console.log(`New invite with uses: ${code}, uses: ${invite.uses}`);
          return { code, inviter: invite.inviter, uses: invite.uses };
        }
      } else if (invite.uses > oldInvite.uses) {
        console.log(`Invite used: ${code}, old uses: ${oldInvite.uses}, new uses: ${invite.uses}`);
        return { code, inviter: oldInvite.inviter, uses: invite.uses };
      }
    }
    
    console.log('No used invite found through comparison');
    return null;
  }

  // Add an invite to a user
  async addInvite(inviterId, invitedId, inviteCode) {
    try {
      console.log(`Adding invite: inviter=${inviterId}, invited=${invitedId}, code=${inviteCode}`);
      
      // Get inviter and invited users
      const inviter = await this.client.users.fetch(inviterId).catch(() => null);
      const invited = await this.client.users.fetch(invitedId).catch(() => null);
      
      if (!inviter || !invited) {
        console.error(`Could not fetch users: inviter=${!!inviter}, invited=${!!invited}`);
        return null;
      }

      // Log user objects to verify
      console.log(`Inviter: ${inviter.tag}, Invited: ${invited.tag}`);
      
      // Update or create inviter record
      const updatedInviter = await UserInvites.findOneAndUpdate(
        { userId: inviterId },
        { 
          $inc: { invites: 1 },
          $push: { 
            invitedUsers: {
              userId: invitedId,
              username: invited.username,
              joinedAt: new Date()
            }
          },
          $setOnInsert: { username: inviter.username }
        },
        { upsert: true, new: true }
      );

      // Record who invited the new user
      await UserInvites.findOneAndUpdate(
        { userId: invitedId },
        {
          $set: {
            username: invited.username,
            joinedBy: {
              userId: inviterId,
              username: inviter.username,
              inviteCode: inviteCode
            }
          }
        },
        { upsert: true, new: true }
      );
      
      console.log(`Database updated. Inviter ${inviter.tag} now has ${updatedInviter.invites} invites`);
      
      // Return inviter data
      return { 
        inviterUsername: inviter.username, 
        inviteCount: updatedInviter.invites 
      };
    } catch (error) {
      console.error('Error adding invite:', error);
      return null;
    }
  }

  // Remove an invite when the invited user leaves
  async removeInvite(leftUserId) {
    try {
      console.log(`Removing invite for user who left: ${leftUserId}`);
      
      // Find the user in the database
      const leftUserData = await UserInvites.findOne({ userId: leftUserId });
      
      // If no data or no joined by info, we don't know who invited them
      if (!leftUserData || !leftUserData.joinedBy) {
        console.log(`No invite data found for user ${leftUserId} who left`);
        return null;
      }
      
      const inviterId = leftUserData.joinedBy.userId;
      console.log(`Found inviter ${inviterId} for user ${leftUserId} who left`);
      
      // Update the inviter's record
      const updatedInviter = await UserInvites.findOneAndUpdate(
        { userId: inviterId },
        { 
          $inc: { invites: -1 }, // Decrease invite count by 1
          $pull: { invitedUsers: { userId: leftUserId } } // Remove the user from invitedUsers array
        },
        { new: true }
      );
      
      if (updatedInviter) {
        console.log(`Updated inviter ${inviterId}, new invite count: ${updatedInviter.invites}`);
        return {
          inviterId,
          inviterUsername: updatedInviter.username,
          newInviteCount: updatedInviter.invites
        };
      } else {
        console.log(`Inviter ${inviterId} not found in database`);
        return null;
      }
    } catch (error) {
      console.error('Error removing invite:', error);
      return null;
    }
  }

  // Get user invite count directly from database
  async getInviteCount(userId) {
    try {
      const userData = await UserInvites.findOne({ userId });
      console.log(`Getting invite count for ${userId}: ${userData?.invites || 0}`);
      return userData ? userData.invites : 0;
    } catch (error) {
      console.error('Error getting invite count:', error);
      return 0;
    }
  }

  // Get detailed invite data for a user
  async getDetailedInvites(userId) {
    try {
      console.log(`Getting detailed invites for ${userId}`);
      const userData = await UserInvites.findOne({ userId });
      if (!userData) {
        console.log(`No invite data found for ${userId}`);
        return { invites: 0, invitedUsers: [], joinedBy: null };
      }
      console.log(`Found ${userData.invitedUsers?.length || 0} invited users for ${userId}`);
      return userData;
    } catch (error) {
      console.error('Error getting detailed invites:', error);
      return { invites: 0, invitedUsers: [], joinedBy: null };
    }
  }
}

module.exports = InviteManager;