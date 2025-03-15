const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const UserStatus = require('../../models/UserStatus');
const { sendLog } = require('../../utils/logUtils');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Set your status to online or offline')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Your availability status')
        .setRequired(true)
        .addChoices(
          { name: 'Online', value: 'online' },
          { name: 'Offline', value: 'offline' }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  async execute(interaction) {
    const member = interaction.member;
    const staffRole = interaction.guild.roles.cache.get(config.staffRole);
    
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages) && 
        !(staffRole && member.roles.cache.has(staffRole.id))) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const status = interaction.options.getString('status');
    const user = interaction.user;
    
    await UserStatus.findOneAndUpdate(
      { userId: user.id },
      { userId: user.id, status, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    
    let description;
    if (status === 'online') {
      description = `${user} is currently online! Make orders now.`;
    } else {
      description = `${user} is currently offline, they are not answering tickets.`;
    }
    
    const embed = new EmbedBuilder()
      .setColor(status === 'online' ? config.colors.success : config.colors.error)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: config.embedFooter });
    
    await interaction.reply({ embeds: [embed] });
    
    sendLog(
      interaction.client,
      'Status Update',
      `${user.tag} set their status to ${status}`,
      status === 'online' ? config.colors.success : config.colors.error
    );
  },
};