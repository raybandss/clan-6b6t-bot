module.exports = {
    name: 'inviteDelete',
    async execute(invite) {
      try {
        // Get current guild invites cache
        let guildInvites = invite.client.inviteManager.invitesCache.get(invite.guild.id);
        
        // If there's cache for this guild, remove the deleted invite
        if (guildInvites) {
          guildInvites.delete(invite.code);
        }
        
        console.log(`Invite deleted in ${invite.guild.name}: ${invite.code}`);
      } catch (error) {
        console.error('Error in inviteDelete event:', error);
      }
    }
  };