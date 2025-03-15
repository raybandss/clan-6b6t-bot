const Ticket = require('../models/Ticket');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { setTimeout } = require('timers/promises');

/**
 * Get the next ticket number for a guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<number>} - The next ticket number
 */
async function getNextTicketNumber(guildId) {
  // Find the highest ticket number in the database
  const latestTicket = await Ticket.findOne({ guildId })
    .sort({ ticketNumber: -1 })
    .limit(1);
  
  // If no tickets exist, start from 1
  if (!latestTicket) {
    return 1;
  }
  
  // Return the next ticket number
  return latestTicket.ticketNumber + 1;
}

/**
 * Create an embed for a new ticket
 * @param {Object} user - The user who created the ticket
 * @returns {EmbedBuilder} - The ticket embed
 */
function createTicketEmbed(user) {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('Support Ticket')
    .setDescription(`Thank you for creating a ticket, ${user}.\nA staff member will be with you shortly.`)
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})` },
      { name: 'Created at', value: new Date().toLocaleString() }
    )
    .setFooter({ text: config.embedFooter })
    .setTimestamp();
}

/**
 * Create a button for closing a ticket
 * @returns {ActionRowBuilder} - The button row
 */
function createCloseButton() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );
}

/**
 * Create a transcript of a ticket
 * @param {Object} channel - The ticket channel
 * @param {string} userId - The user ID who created the ticket
 * @returns {Promise<string>} - The path to the transcript file
 */
async function createTicketTranscript(channel, userId) {
  // Create transcripts directory if it doesn't exist
  const transcriptsDir = path.join(__dirname, '..', 'transcripts');
  if (!fs.existsSync(transcriptsDir)) {
    fs.mkdirSync(transcriptsDir);
  }
  
  const transcriptPath = path.join(transcriptsDir, `ticket-${channel.name}-${Date.now()}.txt`);
  const writeStream = createWriteStream(transcriptPath);
  
  writeStream.write(`Ticket Transcript: ${channel.name}\n`);
  writeStream.write(`Created by: <@${userId}> (${userId})\n`);
  writeStream.write(`Transcript created: ${new Date().toLocaleString()}\n\n`);
  
  try {
    // Get all messages from the channel (limit 100 for simplicity)
    const messages = await channel.messages.fetch({ limit: 100 });
    
    // Write messages to file in chronological order (oldest first)
    const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    
    for (const message of sortedMessages) {
      const content = message.content || '<No text content>';
      writeStream.write(`[${message.createdAt.toLocaleString()}] ${message.author.tag}:\n${content}\n\n`);
      
      // Include attachments if any
      if (message.attachments.size > 0) {
        writeStream.write('Attachments:\n');
        message.attachments.forEach(attachment => {
          writeStream.write(`- ${attachment.name}: ${attachment.url}\n`);
        });
        writeStream.write('\n');
      }
    }
  } catch (error) {
    console.error('Error fetching messages for transcript:', error);
    writeStream.write('Error occurred while generating transcript.');
  }
  
  writeStream.end();
  
  // Wait for the file to be written
  await new Promise(resolve => writeStream.on('finish', resolve));
  
  return transcriptPath;
}

module.exports = {
  getNextTicketNumber,
  createTicketEmbed,
  createCloseButton,
  createTicketTranscript
};