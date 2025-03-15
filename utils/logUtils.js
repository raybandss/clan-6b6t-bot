const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');


async function sendLog(client, title, description, color) {
  const logsChannel = client.channels.cache.get(config.logsChannel);
  
  if (!logsChannel) {
    console.error(`Logs channel with ID ${config.logsChannel} not found`);
    return;
  }
  
  const embed = new EmbedBuilder()
    .setColor(color || config.colors.primary)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: config.embedFooter });
  
  try {
    await logsChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error sending log message:', error);
  }
}

module.exports = {
  sendLog
};
