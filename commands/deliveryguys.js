const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deliveryguys')
    .setDescription('Display all delivery guys'),
  
  async execute(interaction) {
    const deliveryGuys = config.deliveryGuys;
    
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('Delivery Team')
      .setDescription('Here are all our delivery team members:')
      .addFields(
        { name: 'Delivery Team', value: deliveryGuys.join('\n') }
      )
      .setTimestamp()
      .setFooter({ text: config.embedFooter });
    
    await interaction.reply({ embeds: [embed] });
  },
};