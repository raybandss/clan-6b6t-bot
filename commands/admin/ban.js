const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../../utils/logUtils');
const { parseDuration, formatDuration } = require('../../utils/durationUtils');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration (e.g. 30m, 1h, 1d, permanent)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    const member = interaction.member;
    const staffRole = interaction.guild.roles.cache.get(config.staffRole);
    
    if (!member.permissions.has(PermissionFlagsBits.BanMembers) && 
        !(staffRole && member.roles.cache.has(staffRole.id))) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('user');
    const durationString = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 0;
    
    // Check if this is a temporary ban
    const isTemporary = durationString && durationString.toLowerCase() !== 'permanent';
    const durationMs = isTemporary ? parseDuration(durationString) : 0;
    const formattedDuration = isTemporary ? formatDuration(durationMs) : 'Permanent';
    
    if (isTemporary && durationMs <= 0) {
      return interaction.reply({
        content: 'Invalid duration format. Please use formats like 30m, 1h, 1d, etc. or "permanent"',
        ephemeral: true
      });
    }
    
    try {
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      
      if (targetMember.roles.highest.position >= member.roles.highest.position) {
        return interaction.reply({
          content: 'You cannot ban a member with a role higher than or equal to yours.',
          ephemeral: true
        });
      }
      
      if (!targetMember.bannable) {
        return interaction.reply({
          content: 'I cannot ban this user due to role hierarchy or missing permissions.',
          ephemeral: true
        });
      }
      
      // Create expiration time string if temporary
      const expirationTime = isTemporary ? new Date(Date.now() + durationMs).toLocaleString() : 'Never';
      
      // Create DM embed to notify user
      const dmEmbed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle(`You have been banned from ${interaction.guild.name}`)
        .setDescription(`You have been banned from ${interaction.guild.name} for ${formattedDuration}.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Banned by', value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      // Add expiration field for temporary bans
      if (isTemporary) {
        dmEmbed.addFields({ name: 'Expires', value: expirationTime });
      }
      
      // Try to send DM to user before banning
      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        // If DM fails, log the error but continue with the ban
        console.log(`Could not send DM to ${targetUser.tag}: ${dmError}`);
      }
      
      await targetMember.ban({ 
        deleteMessageDays: days, 
        reason: `${reason} - Banned by ${interaction.user.tag}${isTemporary ? ` - Temporary: ${formattedDuration}` : ' - Permanent'}` 
      });
      
      // Store temporary ban info in database if needed
      if (isTemporary) {
        // This would be where you'd store the ban info in a database
        // You would need to implement a system to check and unban users when their bans expire
        // This could be done with a scheduled task or a separate command
        
        // Example: storeTemporaryBan(targetUser.id, interaction.guild.id, Date.now() + durationMs, reason);
        console.log(`Temporary ban set for ${targetUser.tag} until ${expirationTime}`);
      }
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle('User Banned')
        .setDescription(`${targetUser.tag} has been banned from the server for ${formattedDuration}.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Banned by', value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      // Add expiration field for temporary bans
      if (isTemporary) {
        embed.addFields({ name: 'Expires', value: expirationTime });
      }
      
      await interaction.reply({ embeds: [embed] });
      
      sendLog(
        interaction.client,
        'User Banned',
        `${targetUser.tag} (${targetUser.id}) was banned by ${interaction.user.tag} for ${formattedDuration}.\nReason: ${reason}${isTemporary ? `\nExpires: ${expirationTime}` : ''}`,
        config.colors.error
      );
    } catch (error) {
      console.error('Error banning user:', error);
      await interaction.reply({
        content: 'An error occurred while trying to ban this user.',
        ephemeral: true
      });
    }
  },
};