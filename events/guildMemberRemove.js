const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      console.log(`Member left: ${member.user.tag}`);
      
      // Remove invite count from the inviter
      const result = await member.client.inviteManager.removeInvite(member.id);
      
      // Check if we found and updated an inviter
      if (result) {
        console.log(`Updated inviter ${result.inviterId}'s invite count to ${result.newInviteCount}`);
        
        // If there's a logs channel configured, send a notification
        if (config.logsChannel) {
          const logsChannel = member.guild.channels.cache.get(config.logsChannel);
          
          if (logsChannel) {
            const embed = new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle('Member Left')
              .setDescription(`<@${member.id}> (${member.user.tag}) has left the server.`)
              .addFields(
                { 
                  name: 'Invite Removed', 
                  value: `1 invite has been removed from <@${result.inviterId}>'s count.\nThey now have ${result.newInviteCount} invites.`,
                  inline: false 
                }
              )
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
              .setTimestamp()
              .setFooter({ text: config.embedFooter });
              
            await logsChannel.send({ embeds: [embed] });
          }
        }
      } else {
        console.log(`Could not find inviter for ${member.user.tag}`);
        
        // Still log the member leaving if there's a logs channel
        if (config.logsChannel) {
          const logsChannel = member.guild.channels.cache.get(config.logsChannel);
          
          if (logsChannel) {
            const embed = new EmbedBuilder()
              .setColor(config.colors.warning)
              .setTitle('Member Left')
              .setDescription(`<@${member.id}> (${member.user.tag}) has left the server.`)
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
              .setTimestamp()
              .setFooter({ text: config.embedFooter });
              
            await logsChannel.send({ embeds: [embed] });
          }
        }
      }
    } catch (error) {
      console.error('Error in guildMemberRemove event:', error);
    }
  }
};