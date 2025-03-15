const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../../utils/logUtils');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The user ID to unban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the unban')
        .setRequired(false))
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
    
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
      // Check if the user ID is valid
      if (!/^\d{17,19}$/.test(userId)) {
        return interaction.reply({
          content: 'Invalid user ID. Please provide a valid Discord user ID.',
          ephemeral: true
        });
      }
      
      // Check if the user is actually banned
      const banList = await interaction.guild.bans.fetch();
      const banInfo = banList.find(ban => ban.user.id === userId);
      
      if (!banInfo) {
        return interaction.reply({
          content: 'This user is not banned.',
          ephemeral: true
        });
      }
      
      // Unban the user
      await interaction.guild.members.unban(userId, `${reason} - Unbanned by ${interaction.user.tag}`);
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('User Unbanned')
        .setDescription(`<@${userId}> (${userId}) has been unbanned from the server.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Unbanned by', value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      await interaction.reply({ embeds: [embed] });
      
      // Try to notify the user they've been unbanned
      try {
        const user = await interaction.client.users.fetch(userId);
        const dmEmbed = new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle(`You have been unbanned from ${interaction.guild.name}`)
          .setDescription(`You have been unbanned from ${interaction.guild.name}.`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Unbanned by', value: interaction.user.tag }
          )
          .setTimestamp()
          .setFooter({ text: config.embedFooter });
        
        await user.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        // If DM fails, simply log it
        console.log(`Could not send unban notification to user: ${dmError}`);
      }
      
      sendLog(
        interaction.client,
        'User Unbanned',
        `<@${userId}> (${userId}) was unbanned by ${interaction.user.tag}\nReason: ${reason}`,
        config.colors.success
      );
    } catch (error) {
      console.error('Error unbanning user:', error);
      await interaction.reply({
        content: 'An error occurred while trying to unban this user.',
        ephemeral: true
      });
    }
  },
};