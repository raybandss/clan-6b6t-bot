module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
      console.log(`Logged in as ${client.user.tag}`);
      
      // Use the inviteManager that should be attached to the client
      // Not as "new client.InviteManager"
      for (const guild of client.guilds.cache.values()) {
        await client.inviteManager.fetchGuildInvites(guild);
        console.log(`Cached invites for ${guild.name}`);
      }
      
      console.log('Welcome system is ready!');
    }
};