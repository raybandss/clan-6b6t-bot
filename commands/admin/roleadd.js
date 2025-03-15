const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('../../utils/logUtils');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleadd')
    .setDescription('Add a role to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to add the role to')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to add')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for adding the role')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction) {
    const member = interaction.member;
    const staffRole = interaction.guild.roles.cache.get(config.staffRole);
    
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles) && 
        !(staffRole && member.roles.cache.has(staffRole.id))) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
      const targetMember = await interaction.guild.members.fetch(targetUser.id);
      
      if (role.position >= member.roles.highest.position) {
        return interaction.reply({
          content: 'You cannot assign a role that is higher than or equal to your highest role.',
          ephemeral: true
        });
      }
      
      if (role.managed) {
        return interaction.reply({
          content: 'This role is managed by an integration and cannot be manually assigned.',
          ephemeral: true
        });
      }
      
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'I do not have permission to manage roles.',
          ephemeral: true
        });
      }
      
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: 'I cannot assign a role that is higher than my highest role.',
          ephemeral: true
        });
      }
      
      if (targetMember.roles.cache.has(role.id)) {
        return interaction.reply({
          content: `${targetUser.tag} already has the ${role.name} role.`,
          ephemeral: true
        });
      }
      
      await targetMember.roles.add(role, reason);
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('Role Added')
        .setDescription(`${role} has been added to ${targetUser.tag}.`)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Added by', value: interaction.user.tag }
        )
        .setTimestamp()
        .setFooter({ text: config.embedFooter });
      
      await interaction.reply({ embeds: [embed] });
      
      sendLog(
        interaction.client,
        'Role Added',
        `${role.name} (${role.id}) was added to ${targetUser.tag} (${targetUser.id}) by ${interaction.user.tag}\nReason: ${reason}`,
        config.colors.success
      );
    } catch (error) {
      console.error('Error adding role:', error);
      await interaction.reply({
        content: 'An error occurred while trying to add the role.',
        ephemeral: true
      });
    }
  },
};