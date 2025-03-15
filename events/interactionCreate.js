const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketSetup = require('../models/TicketSetup');
const Ticket = require('../models/Ticket');
const { sendLog } = require('../utils/logUtils');
const { getNextTicketNumber, createTicketEmbed, createCloseButton, createTicketTranscript } = require('../utils/ticketUtils');
const config = require('../config.json');
const fs = require('fs');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      
      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }
      
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
      }
    }
    
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'ticket_setup_modal') {
        const title = interaction.fields.getTextInputValue('ticketTitle');
        const description = interaction.fields.getTextInputValue('ticketDescription');
        const buttonLabel = interaction.fields.getTextInputValue('buttonLabel');
        
        const embed = new EmbedBuilder()
          .setColor(config.colors.primary)
          .setTitle(title)
          .setDescription(description)
          .setFooter({ text: config.embedFooter })
          .setTimestamp();
        
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('create_ticket')
              .setLabel(buttonLabel)
              .setStyle(ButtonStyle.Primary)
          );
        
        const message = await interaction.reply({
          embeds: [embed],
          components: [row],
          fetchReply: true
        });
        
        try {
          // Delete any existing document first
          await TicketSetup.deleteOne({ guildId: interaction.guild.id });
          
          // Create a new document
          const setup = new TicketSetup({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: message.id,
            title,
            description,
            buttonLabel
          });
          
          await setup.save();
          
          // Log ticket setup
          sendLog(
            interaction.client,
            'Ticket System Setup',
            `Ticket system was set up by ${interaction.user.tag}`,
            config.colors.success
          );
        } catch (error) {
          console.error('Error saving ticket setup:', error);
          await interaction.followUp({
            content: 'There was an error setting up the ticket system. Please check the console for details.',
            ephemeral: true
          });
        }
      }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      // Create Ticket Button
      if (interaction.customId === 'create_ticket') {
        // Check if user already has an open ticket
        const existingTicket = await Ticket.findOne({
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          closed: false
        });
        
        if (existingTicket) {
          const channel = interaction.guild.channels.cache.get(existingTicket.channelId);
          if (channel) {
            return interaction.reply({
              content: `You already have an open ticket: <#${existingTicket.channelId}>`,
              ephemeral: true
            });
          }
        }
        
        // Get next ticket number
        const ticketNumber = await getNextTicketNumber(interaction.guild.id);
        
        // Create ticket channel
        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${ticketNumber}`,
          type: 0, // Text channel
          parent: config.ticketCategory,
          permissionOverwrites: [
            {
              id: interaction.guild.id, // @everyone role
              deny: ['ViewChannel']
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            }
          ]
        });
        
        // Create ticket in database
        const newTicket = new Ticket({
          channelId: ticketChannel.id,
          userId: interaction.user.id,
          guildId: interaction.guild.id,
          ticketNumber: ticketNumber
        });
        
        await newTicket.save();
        
        // Send initial message in ticket channel
        const ticketEmbed = createTicketEmbed(interaction.user);
        const closeButton = createCloseButton();
        
        await ticketChannel.send({
          content: `<@${interaction.user.id}>`,
          embeds: [ticketEmbed],
          components: [closeButton]
        });
        
        await interaction.reply({
          content: `Your ticket has been created: <#${ticketChannel.id}>`,
          ephemeral: true
        });
        
        // Log ticket creation
        sendLog(
          interaction.client,
          'Ticket Created',
          `Ticket #${ticketNumber} created by ${interaction.user.tag}`,
          config.colors.info
        );
      }
      
      // Close Ticket Button
      else if (interaction.customId === 'close_ticket') {
        const ticket = await Ticket.findOne({
          channelId: interaction.channel.id,
          closed: false
        });
        
        if (!ticket) {
          return interaction.reply({
            content: 'This ticket is already closed or does not exist in our database.',
            ephemeral: true
          });
        }
        
        // Create transcript
        try {
          const transcriptPath = await createTicketTranscript(interaction.channel, ticket.userId);
          const transcriptChannel = interaction.client.channels.cache.get(config.ticketTranscriptsChannel);
          
          if (transcriptChannel) {
            await transcriptChannel.send({
              content: `Ticket #${ticket.ticketNumber} | Created by <@${ticket.userId}> | Closed by ${interaction.user}`,
              files: [transcriptPath]
            });
            
            // Clean up transcript file
            fs.unlinkSync(transcriptPath);
          }
        } catch (error) {
          console.error('Error creating transcript:', error);
        }
        
        // Mark ticket as closed
        ticket.closed = true;
        await ticket.save();
        
        await interaction.reply({
          content: 'This ticket will be closed in 5 seconds...'
        });
        
        // Log ticket closure
        sendLog(
          interaction.client,
          'Ticket Closed',
          `Ticket #${ticket.ticketNumber} closed by ${interaction.user.tag}`,
          config.colors.warning
        );
        
        setTimeout(() => {
          interaction.channel.delete().catch(console.error);
        }, 5000);
      }
    }
  },
};