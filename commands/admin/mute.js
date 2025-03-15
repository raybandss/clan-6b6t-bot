const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../../utils/logUtils');
const { parseDuration, formatDuration } = require('../../utils/durationUtils');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout (mute) a user in the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration (e.g. 30m, 1h, 1d, 3d12h)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the timeout')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    const member = interaction.member;
    const staffRole = interaction.guild.roles.cache.get(config.staffRole);
    
    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers) && 
        !(staffRole && member.roles.cache.has(staffRole.id))) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('user');
    const durationString = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Parse duration string to milliseconds
    const durationMs = parseDuration(durationString);
    
    // Discord has a maximum timeout of 28 days (40320 minutes)
    const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000;
    
    if (durationMs <= 0) {
      return interaction.reply({
        content: 'Invalid duration format. Please use formats like 30m, 1h, 1d, etc.',
        ephemeral: true
      });
    }
    
    if (durationMs > maxTimeoutMs) {
      return interaction.reply({
        content: `Duration exceeds Discord's maximum timeout of 28 days.`,
        ephemeral: true
      });
    }
    
    try {
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      
      if (targetMember.roles.highest.position >= member.roles.highest.position) {
        return interaction.reply({
          content: 'You cannot timeout a member with a role higher than or equal to yours.',
          ephemeral: true
        });
      }
      
      if (!targetMember.moderatable) {
        return interaction.reply({
          content: 'I cannot timeout this user due to role hierarchy or missing permissions.',
          ephemeral: true
        });
      }
      
      const timeUntil = new Date(Date.now() + durationMs).toLocaleString();
      const formattedDuration = formatDuration(durationMs);
      
      // Create DM embed to notify user
      const dmEmbed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`You have been timed out in ${interaction.guild.name}`)
        .setDescription(`You have been timed out for ${formattedDuration} in ${interaction.guild.name}.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Timed out by', value: interaction.user.tag },
          { name: 'Expires', value: timeUntil }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      // Try to send DM to user before timing out
      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        // If DM fails, log the error but continue with the timeout
        console.log(`Could not send DM to ${targetUser.tag}: ${dmError}`);
      }
      
      await targetMember.timeout(durationMs, `${reason} - Timed out by ${interaction.user.tag}`);
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('User Timed Out')
        .setDescription(`${targetUser.tag} has been timed out for ${formattedDuration}.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Timed out by', value: interaction.user.tag },
          { name: 'Expires', value: timeUntil }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      await interaction.reply({ embeds: [embed] });
      
      sendLog(
        interaction.client,
        'User Timed Out',
        `${targetUser.tag} (${targetUser.id}) was timed out by ${interaction.user.tag} for ${formattedDuration}.\nReason: ${reason}\nExpires: ${timeUntil}`,
        config.colors.warning
      );
    } catch (error) {
      console.error('Error timing out user:', error);
      await interaction.reply({
        content: 'An error occurred while trying to timeout this user.',
        ephemeral: true
      });
    }
  },
};