const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Check how many invites you or another user has')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to check invites for')
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get the target user (mentioned or command user)
      const targetUser = interaction.options.getUser('user') || interaction.user;
      
      // Get invite data
      const inviteData = await interaction.client.inviteManager.getDetailedInvites(targetUser.id);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`${targetUser.username}'s Invites`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: 'Total Invites', value: `${inviteData.invites || 0}`, inline: true }
        )
        .setFooter({ text: config.embedFooter })
        .setTimestamp();
      
      // Add invited users if any
      if (inviteData.invitedUsers && inviteData.invitedUsers.length > 0) {
        // Get the 5 most recent invited users
        const recentInvites = inviteData.invitedUsers
          .slice(0, 5)
          .map(user => `<@${user.userId}> (${user.username})`)
          .join('\n');
        
        embed.addFields({
          name: `Invited Users (${inviteData.invitedUsers.length})`,
          value: recentInvites || 'None',
          inline: false
        });
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error checking invites:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle('Error')
        .setDescription('There was an error checking invites. Please try again later.')
        .setFooter({ text: config.embedFooter });
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};