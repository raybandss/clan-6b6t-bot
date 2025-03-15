const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { connect } = require('mongoose');
const config = require('./config.json');
const InviteManager = require('./utils/inviteManager'); // Add this import

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites // Add this intent for invite tracking
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

client.commands = new Collection();

// Initialize the invite manager
client.inviteManager = new InviteManager(client); // Add this line

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Add a default emoji if not set in config
if (!config.reviewEmoji) {
  console.warn("Warning: No reviewEmoji set in config.json. Using ⭐ as default.");
  config.reviewEmoji = "⭐";
}

// Auto reaction system for the reviews channel
client.on('messageCreate', async message => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Check if the message is in the reviews channel
  if (message.channelId === config.reviewsChannel) {
    try {
      // React with the configured emoji
      await message.react(config.reviewEmoji);
      console.log(`Added ${config.reviewEmoji} reaction to a review message`);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }
});

(async () => {
  try {
    await connect(config.mongoURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
})();

client.login(config.token);