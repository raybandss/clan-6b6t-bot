const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../../utils/logUtils');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  async execute(interaction) {
    const member = interaction.member;
    const staffRole = interaction.guild.roles.cache.get(config.staffRole);
    
    if (!member.permissions.has(PermissionFlagsBits.KickMembers) && 
        !(staffRole && member.roles.cache.has(staffRole.id))) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      
      if (targetMember.roles.highest.position >= member.roles.highest.position) {
        return interaction.reply({
          content: 'You cannot kick a member with a role higher than or equal to yours.',
          ephemeral: true
        });
      }
      
      if (!targetMember.kickable) {
        return interaction.reply({
          content: 'I cannot kick this user due to role hierarchy or missing permissions.',
          ephemeral: true
        });
      }
      
      // Create DM embed to notify user
      const dmEmbed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`You have been kicked from ${interaction.guild.name}`)
        .setDescription(`You have been kicked from ${interaction.guild.name}.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Kicked by', value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      // Try to send DM to user before kicking
      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        // If DM fails, log the error but continue with the kick
        console.log(`Could not send DM to ${targetUser.tag}: ${dmError}`);
      }
      
      await targetMember.kick(`${reason} - Kicked by ${interaction.user.tag}`);
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('User Kicked')
        .setDescription(`${targetUser.tag} has been kicked from the server.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Kicked by', value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      await interaction.reply({ embeds: [embed] });
      
      sendLog(
        interaction.client,
        'User Kicked',
        `${targetUser.tag} (${targetUser.id}) was kicked by ${interaction.user.tag}\nReason: ${reason}`,
        config.colors.warning
      );
    } catch (error) {
      console.error('Error kicking user:', error);
      await interaction.reply({
        content: 'An error occurred while trying to kick this user.',
        ephemeral: true
      });
    }
  },
};