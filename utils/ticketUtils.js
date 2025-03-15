 const Ticket = require('../models/Ticket');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { setTimeout } = require('timers/promises');


async function getNextTicketNumber(guildId) {
  const latestTicket = await Ticket.findOne({ guildId })
    .sort({ ticketNumber: -1 })
    .limit(1);
  
  if (!latestTicket) {
    return 1;
  }
  
  return latestTicket.ticketNumber + 1;
}


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


function createCloseButton() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );
}


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
    const messages = await channel.messages.fetch({ limit: 100 });
    
    const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    
    for (const message of sortedMessages) {
      const content = message.content || '<No text content>';
      writeStream.write(`[${message.createdAt.toLocaleString()}] ${message.author.tag}:\n${content}\n\n`);
      
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
  
  await new Promise(resolve => writeStream.on('finish', resolve));
  
  return transcriptPath;
}

module.exports = {
  getNextTicketNumber,
  createTicketEmbed,
  createCloseButton,
  createTicketTranscript
};
