const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const TicketSetup = require('../models/TicketSetup');
const { sendLog } = require('../utils/logUtils');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Setup the ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    // Show modal to collect information
    const modal = new ModalBuilder()
      .setCustomId('ticket_setup_modal')
      .setTitle('Ticket System Setup');
    
    // Add components to modal
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
    
    // Add inputs to the modal
    const firstRow = new ActionRowBuilder().addComponents(titleInput);
    const secondRow = new ActionRowBuilder().addComponents(descriptionInput);
    const thirdRow = new ActionRowBuilder().addComponents(buttonLabelInput);
    
    modal.addComponents(firstRow, secondRow, thirdRow);
    
    // Show the modal
    await interaction.showModal(modal);
  },
};