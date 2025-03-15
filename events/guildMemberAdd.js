const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      // Wait a short time to ensure all invite data is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch new invites
      const newInvites = await member.guild.invites.fetch();
      
      // Get cached invites
      const oldInvites = member.client.inviteManager.invitesCache.get(member.guild.id);
      
      // Debug logging
      console.log(`Member joined: ${member.user.tag}`);
      console.log(`Old invites cache size: ${oldInvites ? oldInvites.size : 0}`);
      console.log(`New invites fetch size: ${newInvites.size}`);
      
      // Find which invite was used
      let usedInvite = null;
      
      if (oldInvites) {
        for (const [code, invite] of newInvites) {
          const oldInvite = oldInvites.get(code);
          
          if (!oldInvite) {
            console.log(`New invite found and possibly used: ${code} by ${invite.inviter.tag}`);
            usedInvite = {
              code,
              inviter: invite.inviter.id,
              uses: invite.uses
            };
            break;
          }
          
          if (invite.uses > oldInvite.uses) {
            console.log(`Used invite found: ${code} by user ID ${oldInvite.inviter}`);
            usedInvite = {
              code, 
              inviter: oldInvite.inviter,
              uses: invite.uses
            };
            break;
          }
        }
      }
      
      // Update the cache with ALL current invite data
      member.client.inviteManager.invitesCache.set(
        member.guild.id,
        new Map(newInvites.map(invite => [
          invite.code, 
          { 
            uses: invite.uses, 
            inviter: invite.inviter.id 
          }
        ]))
      );
      
      // Always log if an invite was found or not
      if (usedInvite) {
        console.log(`Invite used: ${usedInvite.code} by inviter ${usedInvite.inviter}`);
      } else {
        console.log('No invite found for this join');
      }
      
      let welcomeMessage = config.welcomeMessage;
      let inviterData = null;
      
      if (usedInvite) {
        // Get inviter user before recording in database
        try {
          const inviterUser = await member.client.users.fetch(usedInvite.inviter);
          console.log(`Inviter found: ${inviterUser.tag}`);
          
          // Record the invite in the database
          inviterData = await member.client.inviteManager.addInvite(
            usedInvite.inviter, 
            member.id, 
            usedInvite.code
          );
          
          console.log(`Invite data recorded. Inviter: ${inviterUser.tag}, Count: ${inviterData?.inviteCount || 0}`);
          
          // Replace placeholders in welcome message
          welcomeMessage = welcomeMessage
            .replace('{user}', `<@${member.id}>`)
            .replace('{inviter}', `<@${usedInvite.inviter}>`)
            .replace('{inviteCount}', inviterData ? inviterData.inviteCount : '0');
        } catch (error) {
          console.error(`Error fetching inviter user: ${error}`);
          welcomeMessage = welcomeMessage
            .replace('{user}', `<@${member.id}>`)
            .replace('{inviter}', `<@${usedInvite.inviter}>`)
            .replace('{inviteCount}', '0');
        }
      } else {
        // No invite found or user joined via server discovery
        welcomeMessage = welcomeMessage
          .replace('{user}', `<@${member.id}>`)
          .replace('{inviter}', 'Unknown')
          .replace('{inviteCount}', '0');
      }
      
      // Get the welcome channel
      const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannel);
      if (welcomeChannel) {
        // Create embed
        const embed = new EmbedBuilder()
          .setColor(config.colors.primary)
          .setTitle('👋 New Member!')
          .setDescription(welcomeMessage)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .setFooter({ text: config.embedFooter });
          
        await welcomeChannel.send({ embeds: [embed] });
        console.log(`Sent welcome message for ${member.user.tag}`);
      } else {
        console.error('Welcome channel not found');
      }
    } catch (error) {
      console.error('Error in guildMemberAdd event:', error);
    }
  }
};