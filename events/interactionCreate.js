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
          await TicketSetup.deleteOne({ guildId: interaction.guild.id });
          
          const setup = new TicketSetup({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: message.id,
            title,
            description,
            buttonLabel
          });
          
          await setup.save();
          
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
    
    else if (interaction.isButton()) {
      if (interaction.customId === 'create_ticket') {
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
        
        const ticketNumber = await getNextTicketNumber(interaction.guild.id);
        
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
        
        const newTicket = new Ticket({
          channelId: ticketChannel.id,
          userId: interaction.user.id,
          guildId: interaction.guild.id,
          ticketNumber: ticketNumber
        });
        
        await newTicket.save();
        
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
        
        sendLog(
          interaction.client,
          'Ticket Created',
          `Ticket #${ticketNumber} created by ${interaction.user.tag}`,
          config.colors.info
        );
      }
      
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
        
        try {
          const transcriptPath = await createTicketTranscript(interaction.channel, ticket.userId);
          const transcriptChannel = interaction.client.channels.cache.get(config.ticketTranscriptsChannel);
          
          if (transcriptChannel) {
            await transcriptChannel.send({
              content: `Ticket #${ticket.ticketNumber} | Created by <@${ticket.userId}> | Closed by ${interaction.user}`,
              files: [transcriptPath]
            });
            
            fs.unlinkSync(transcriptPath);
          }
        } catch (error) {
          console.error('Error creating transcript:', error);
        }
        
        ticket.closed = true;
        await ticket.save();
        
        await interaction.reply({
          content: 'This ticket will be closed in 5 seconds...'
        });
        
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
