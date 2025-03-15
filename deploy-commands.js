const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');

const commands = [];

/**
 * Recursively load commands from a directory and its subdirectories
 * @param {string} dir - Directory to search for commands
 */
function loadCommandsRecursive(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Recursively process subdirectories
      loadCommandsRecursive(itemPath);
    } else if (item.isFile() && item.name.endsWith('.js')) {
      // Process JS files as potential commands
      try {
        const command = require(itemPath);
        
        if ('data' in command) {
          console.log(`Loading command: ${path.relative(path.join(__dirname, 'commands'), itemPath)}`);
          commands.push(command.data.toJSON());
        } else {
          console.log(`[WARNING] The command at ${itemPath} is missing a required "data" property.`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to load command at ${itemPath}:`, error);
      }
    }
  }
}

// Start loading commands from the main commands directory
const commandsDir = path.join(__dirname, 'commands');
loadCommandsRecursive(commandsDir);

console.log(`Found ${commands.length} commands to register.`);

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    
    // Print the names of all registered commands
    console.log('Registered commands:');
    data.forEach(cmd => console.log(`- /${cmd.name}`));
  } catch (error) {
    console.error(error);
  }
})();