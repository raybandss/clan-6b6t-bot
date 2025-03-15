const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const TicketSetup = require('../../models/TicketSetup');
const { sendLog } = require('../../utils/logUtils');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Setup the ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const member = interaction.member;
    const staffRole = interaction.guild.roles.cache.get(config.staffRole);
    
    if (!member.permissions.has(PermissionFlagsBits.Administrator) && 
        !(staffRole && member.roles.cache.has(staffRole.id))) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const modal = new ModalBuilder()
      .setCustomId('ticket_setup_modal')
      .setTitle('Ticket System Setup');
    
    const titleInput = new TextInputBuilder()
      .setCustomId('ticketTitle')
      .setLabel('Embed Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Support Tickets')
      .setRequired(true);
    
    const descriptionInput = new TextInputBuilder()
      .setCustomId('ticketDescription')
      .setLabel('Embed Description')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Click the button below to create a support ticket')
      .setRequired(true);
    
    const buttonLabelInput = new TextInputBuilder()
      .setCustomId('buttonLabel')
      .setLabel('Button Text')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Create Ticket')
      .setRequired(true);
    
    const firstRow = new ActionRowBuilder().addComponents(titleInput);
    const secondRow = new ActionRowBuilder().addComponents(descriptionInput);
    const thirdRow = new ActionRowBuilder().addComponents(buttonLabelInput);
    
    modal.addComponents(firstRow, secondRow, thirdRow);
    
    await interaction.showModal(modal);
  },
};