# 6b6t Clan Bot

A Discord bot designed for 6b6t clans to manage tickets, track delivery staff, display staff status, and handle role assignments.

## ✨ Features

- **Ticket System** - Create and manage support tickets efficiently
- **Delivery Personnel Tracking** - Keep track of who handles deliveries
- **Staff Status** - Allow staff to update their availability status
- **Role Management** - Automatic role assignment for completed tickets

## 📋 Admin Commands

| Command | Description |
|---------|-------------|
| `/ticketsetup` | Creates an embed with a button that users can click to open support tickets |
| `/status` | Allows admins to set their status as online or offline |
| `/completed` | Assigns a special role to users (typically for leaving reviews) |
| `/ban` | Bans the mentioned user permanently or for a certain duration |
| `/unban` | Unbans the mentioned user |
| `/kick` | Kicks the mentioned user |
| `/roleadd` | Assigns a role to the mentioned user |

## 📋 User Commands

| Command | Description |
|---------|-------------|
| `/deliveryguys` | Sends all the registered staff |
| `/emojiriddle` | Creates a fun emoji guessing game |
| `/invites` | Checks how many invites you or a mentioned user has |
| `/help` | Displays all commands |
| `/tictactoe` | Starts a tic tac toe game between you and the mentioned user |
| `/typerace` | Starts a type race game that users are able to join in on |
| `/pixelpainter` | Sends a painting that all users are able to paint on |
| `/meme` | Makes a custom meme with text of your choosing |

## 🛠️ Installation

1. Clone this repository
```bash
git clone https://github.com/raybandss/clan-6b6t-bot.git
cd clan-6b6t-bot
```

2. Install dependencies
```bash
npm i discord.js fs mongoose path canvas
```

3. Configure your bot information in the `config.json` file
```
{
  "token": "YOUR_TOKEN",
  "clientId": "YOUR_CLIENT_ID",
  "guildId": "YOUR_GUILD_ID",
  "mongoURI": "YOUR_MONGO_URI",
  "ticketCategory": "YOUR_TICKET_CATEGORY",
  "ticketTranscriptsChannel": "TICKET_TRANSCRIPTS_ID",
  "logsChannel": "LOGS_ID",
  "reviewsChannel": "REVIEWS_ID",
  "claimedRole": "COMPLETED_ROLE_ID",
  "staffRole": "STAFF_ID",
  "reviewEmoji": "⭐",
  "welcomeChannel": "WELCOME_CHANNEL_ID",
  "welcomeMessage": "Welcome {user} to RDevelopment! You were invited by {inviter} who now has {inviteCount} invites. Enjoy your stay!",
  "deliveryGuys": [
    "<@ID>", 
    "<@ID>",
    "<@ID>"
  ],
  "colors": {
    "primary": "#3498db",
    "success": "#2ecc71",
    "error": "#e74c3c",
    "warning": "#f39c12",
    "info": "#9b59b6"
  },
  "embedFooter": "Made by raybandsss | RDEV"
}
```
4. Deploy commands
```bash
node deploy-commands.js
```
5. Start the bot
```bash
node index.js
```

## 📊 MongoDB Setup Guide

### Setting Up MongoDB Atlas

1. **Create an Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account or log in

2. **Create a New Project**
   - Click on "Projects" in the top navigation
   - Select "New Project"
   - Name your project (e.g., "6b6t Bot") and click "Create Project"

3. **Build a Database**
   - Click "Build a Database"
   - Select the "FREE" tier option
   - Choose your preferred provider (AWS, Google Cloud, Azure) and region
   - Click "Create Cluster"

4. **Create Database User**
   - In the left sidebar, click "Database Access"
   - Click "Add New Database User"
   - Create a username and secure password
   - Select "Read and write to any database" under privileges
   - Click "Add User"

5. **Set Network Access**
   - In the left sidebar, click "Network Access"
   - Click "Add IP Address"
   - To allow access from anywhere, click "Allow Access from Anywhere" (or specify your IP)
   - Click "Confirm"

6. **Get Your Connection String**
   - Return to the "Database" page
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - Replace `<dbname>` with your preferred database name (e.g., "6b6tBot")

7. **Use the URI in Your Project**
   - Add the URI to your `config.json` file as `mongoURI`

## 🔧 Configuration

Edit all the information in the config.json to your liking


## 🔄 Planned Features

- [X] User-friendly commands
- [X] Automatic review reactions
- [X] Welcome channel setup
- [X] Moderation commands
- [ ] More ticket based commands
- [ ] Minecraft based commands

## 🐛 Troubleshooting

### Common Issues

**Bot not responding to commands**
- Ensure you ran `node deploy-commands.js` before starting the bot
- If it's still not working, run `node diagnose-commands.js` then send the output in the support Discord.

**MongoDB Connection Issues**
- Check that your MongoDB URI is correct
- Verify your IP is whitelisted in the MongoDB Atlas Network Access settings
- Ensure your database user has the correct permissions

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! You can leave suggestions in our [Discord](https://discord.gg/XUCwtuRn69)


## 📚 Resources

- [MongoDB Documentation](https://docs.mongodb.com/)

## 📞 Support

Having issues with the bot? Join our support server:
[Join Discord](https://discord.gg/XUCwtuRn69)

---

Made with ❤️ by raybandsss 
