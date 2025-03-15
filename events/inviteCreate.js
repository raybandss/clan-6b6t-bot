module.exports = {
    name: 'inviteCreate',
    async execute(invite) {
      try {
        // Get current guild invites cache
        let guildInvites = invite.client.inviteManager.invitesCache.get(invite.guild.id);
        
        // If there's no cache for this guild yet, fetch all invites
        if (!guildInvites) {
          guildInvites = await invite.client.inviteManager.fetchGuildInvites(invite.guild);
        } else {
          // Just update the cache with the new invite
          guildInvites.set(invite.code, { uses: invite.uses, inviter: invite.inviter.id });
        }
        
        console.log(`Invite created in ${invite.guild.name}: ${invite.code} by ${invite.inviter.tag}`);
      } catch (error) {
        console.error('Error in inviteCreate event:', error);
      }
    }
  };