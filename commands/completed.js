const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../models/Ticket');
const { sendLog } = require('../utils/logUtils');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('completed')
    .setDescription('Mark a ticket as completed')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user who made the order')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  async execute(interaction) {
    // Check if command is used in a ticket channel
    const ticket = await Ticket.findOne({ channelId: interaction.channelId });
    if (!ticket) {
      return interaction.reply({
        content: 'This command can only be used in ticket channels.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('user');
    const reviewsChannel = interaction.client.channels.cache.get(config.reviewsChannel);
    
    // Assign the claimed role
    try {
      const member = await interaction.guild.members.fetch(targetUser.id);
      const claimedRole = interaction.guild.roles.cache.get(config.claimedRole);
      
      if (claimedRole) {
        await member.roles.add(claimedRole);
      } else {
        console.error(`Claimed role with ID ${config.claimedRole} not found`);
      }
    } catch (error) {
      console.error('Error assigning claimed role:', error);
    }
    
    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('Order Completed')
      .setDescription(`<@${targetUser.id}>, your order has been completed. Please leave a review in <#${reviewsChannel.id}>`)
      .setTimestamp()
      .setFooter({ text: config.embedFooter });
    
    await interaction.reply({ embeds: [embed] });
    
    // Log the completion
    sendLog(
      interaction.client,
      'Ticket Completed',
      `Ticket #${ticket.ticketNumber} marked as completed for ${targetUser.tag} by ${interaction.user.tag}`,
      config.colors.success
    );
  },
};