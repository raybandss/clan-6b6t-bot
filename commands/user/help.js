const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays help information for all commands or a specific command')
        .addStringOption(option => 
            option.setName('command')
                .setDescription('Specific command to get help for')
                .setRequired(false)),
    
    async execute(interaction) {
        // Add debug logging
        console.log('Help command executed by', interaction.user.tag);
        
        const commandName = interaction.options.getString('command');
        
        if (commandName) {
            await showSpecificCommandHelp(interaction, commandName);
        } else {
            await showAllCommandsHelp(interaction);
        }
    }
};

/**
 * Get all commands from the commands folder structure
 * @returns {Object} Object with commands grouped by category
 */
function getAllCommands() {
    const commands = {};
    
    // Determine correct path - assume we're in commands/admin/help.js
    // So we need to go up two levels to reach the base directory
    const currentFilePath = __filename;
    const basePath = path.resolve(path.dirname(currentFilePath), '..', '..');
    const commandsPath = path.join(basePath, 'commands');
    
    console.log('Current file path:', currentFilePath);
    console.log('Base path:', basePath);
    console.log('Resolved commands path:', commandsPath);
    
    try {
        // Check if commands directory exists
        if (!fs.existsSync(commandsPath)) {
            console.error('Commands directory not found:', commandsPath);
            
            // Try alternative location
            const altCommandsPath = path.join(basePath);
            console.log('Trying alternative path:', altCommandsPath);
            
            if (!fs.existsSync(altCommandsPath)) {
                console.error('Alternative commands directory not found either');
                return commands;
            }
            
            // Use alternative path if found
            return loadCommandsFromPath(altCommandsPath, commands);
        }
        
        return loadCommandsFromPath(commandsPath, commands);
    } catch (error) {
        console.error('Error loading commands:', error);
        return commands;
    }
}

/**
 * Load commands from a specific directory path
 * @param {string} commandsPath - Path to commands directory
 * @param {Object} commands - Command object to populate
 * @returns {Object} Updated commands object
 */
function loadCommandsFromPath(commandsPath, commands) {
    try {
        const items = fs.readdirSync(commandsPath, { withFileTypes: true });
        
        console.log(`Found ${items.length} items in ${commandsPath}`);
        
        // First pass: identify directories (potential command categories)
        for (const item of items) {
            if (item.isDirectory()) {
                const categoryPath = path.join(commandsPath, item.name);
                const category = item.name.toLowerCase();
                
                console.log(`Processing category: ${category} at ${categoryPath}`);
                
                try {
                    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
                    console.log(`Found ${commandFiles.length} JS files in ${category}`);
                    
                    if (commandFiles.length > 0) {
                        commands[category] = [];
                        
                        for (const file of commandFiles) {
                            const filePath = path.join(categoryPath, file);
                            
                            try {
                                const command = require(filePath);
                                
                                if (command.data) {
                                    commands[category].push({
                                        name: command.data.name,
                                        description: command.data.description,
                                        options: command.data.options,
                                    });
                                    console.log(`Loaded command: ${category}/${command.data.name}`);
                                } else {
                                    console.log(`Command ${file} has no data property`);
                                }
                            } catch (error) {
                                console.error(`Error loading command ${file}:`, error);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error processing category ${category}:`, error);
                }
            } else if (item.isFile() && item.name.endsWith('.js')) {
                // Handle commands directly in the commands folder (not in a category)
                const category = 'general';
                if (!commands[category]) {
                    commands[category] = [];
                }
                
                try {
                    const command = require(path.join(commandsPath, item.name));
                    
                    if (command.data) {
                        commands[category].push({
                            name: command.data.name,
                            description: command.data.description,
                            options: command.data.options,
                        });
                        console.log(`Loaded command: ${category}/${command.data.name}`);
                    }
                } catch (error) {
                    console.error(`Error loading command ${item.name}:`, error);
                }
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${commandsPath}:`, error);
    }
    
    console.log('Finished loading commands. Categories found:', Object.keys(commands));
    return commands;
}

/**
 * Display help for a specific command
 * @param {Object} interaction - Discord interaction object
 * @param {string} commandName - Name of command to get help for
 */
async function showSpecificCommandHelp(interaction, commandName) {
    const commands = getAllCommands();
    let targetCommand = null;
    let category = '';
    
    // Search for the command in all categories
    for (const [folder, cmds] of Object.entries(commands)) {
        const found = cmds.find(cmd => cmd.name === commandName);
        if (found) {
            targetCommand = found;
            category = folder;
            break;
        }
    }
    
    if (!targetCommand) {
        return await interaction.reply({ 
            content: `Command \`/${commandName}\` not found. Use \`/help\` to see all available commands.`,
            ephemeral: true
        });
    }
    
    const isAdminCommand = category.toLowerCase().includes('admin');
    const isUserCommand = category.toLowerCase().includes('user');
    
    // Create embed for specific command
    const embed = new EmbedBuilder()
        .setColor(isAdminCommand ? '#e74c3c' : isUserCommand ? '#3498db' : '#2ecc71')
        .setTitle(`Command: /${targetCommand.name}`)
        .setDescription(targetCommand.description)
        .addFields({ name: 'Category', value: category, inline: true });
    
    // Add options if available
    if (targetCommand.options && targetCommand.options.length > 0) {
        const optionsText = targetCommand.options
            .map(opt => `\`${opt.name}\` - ${opt.description}${opt.required ? ' (Required)' : ''}`)
            .join('\n');
        embed.addFields({ name: 'Options', value: optionsText });
    }
    
    await interaction.reply({ embeds: [embed] });
}

/**
 * Display help for all commands, organized by category
 * @param {Object} interaction - Discord interaction object
 */
async function showAllCommandsHelp(interaction) {
    const commands = getAllCommands();
    
    console.log('Commands found for help display:', Object.keys(commands).map(cat => 
        `${cat}: ${commands[cat].map(cmd => cmd.name).join(', ')}`
    ));
    
    // Create main help embed
    const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('Command Help')
        .setDescription('Below is a list of all available commands organized by category. Use `/help [command]` for detailed information about a specific command.');
    
    // Get user's permissions to filter commands appropriately
    const member = interaction.member;
    const isAdmin = member.permissions.has('Administrator');
    
    // Order categories: user commands first, then others, admin commands last
    const orderedCategories = Object.keys(commands).sort((a, b) => {
        // User commands first
        if (a.toLowerCase().includes('user') && !b.toLowerCase().includes('user')) return -1;
        if (!a.toLowerCase().includes('user') && b.toLowerCase().includes('user')) return 1;
        
        // Admin commands last
        if (a.toLowerCase().includes('admin') && !b.toLowerCase().includes('admin')) return 1;
        if (!a.toLowerCase().includes('admin') && b.toLowerCase().includes('admin')) return -1;
        
        // Otherwise alphabetical
        return a.localeCompare(b);
    });
    
    // Add fields for each category
    for (const category of orderedCategories) {
        const cmds = commands[category];
        if (cmds.length === 0) continue;
        
        // Skip admin commands for non-admin users
        if (category.toLowerCase().includes('admin') && !isAdmin) {
            continue;
        }
        
        const commandList = cmds
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(cmd => `\`/${cmd.name}\` - ${cmd.description.split('.')[0]}`)
            .join('\n');
        
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        const displayName = category.toLowerCase() === 'user' ? 'User Commands' : 
                           category.toLowerCase() === 'admin' ? 'Admin Commands' : 
                           `${categoryName} Commands`;
        
        embed.addFields({ 
            name: displayName, 
            value: commandList 
        });
    }
    
    // Add footer
    embed.setFooter({ text: 'For more details on a command, use /help [command]' });
    
    await interaction.reply({ embeds: [embed] });
}