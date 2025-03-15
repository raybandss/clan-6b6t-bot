# 6b6t Discord Bot

A powerful Discord bot designed for 6b6t Minecraft clans to manage tickets, track delivery personnel, display staff status, and handle role assignments.

![6b6t Bot Banner](https://via.placeholder.com/800x200)

## ✨ Features

- **Ticket System** - Create and manage support tickets efficiently
- **Delivery Personnel Tracking** - Keep track of all delivery personnel
- **Staff Status** - Allow admins to update their availability status
- **Role Management** - Automatic role assignment for completed transactions

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/ticketsetup` | Creates an embed with a button that users can click to open support tickets |
| `/deliveryguys` | Displays a list of all registered delivery personnel |
| `/status` | Allows admins to set their status as online or offline |
| `/completed` | Assigns a special role to users (typically for leaving reviews) |

## 🛠️ Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/6b6t-discord-bot.git
cd 6b6t-discord-bot
```

2. Install dependencies
```bash
npm install
```

3. Configure your environment variables in a `.env` file
```
TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
```

4. Start the bot
```bash
npm start
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
   - Add the URI to your `.env` file as `MONGODB_URI`

## 🔧 Configuration

Create a `config.json` file in the root directory with the following structure:

```json
{
  "prefix": "!",
  "adminRoleId": "YOUR_ADMIN_ROLE_ID",
  "completedRoleId": "YOUR_COMPLETED_ROLE_ID",
  "ticketCategory": "YOUR_TICKET_CATEGORY_ID",
  "logChannel": "YOUR_LOG_CHANNEL_ID",
  "colors": {
    "success": "#00FF00",
    "error": "#FF0000",
    "info": "#0099FF"
  }
}
```

## 💬 Usage Examples

### Setting Up Tickets

```
/ticketsetup
```
This will create an embed with a button that users can click to create a new support ticket.

### Checking Available Delivery Personnel

```
/deliveryguys
```
Returns a list of all registered delivery personnel and their current availability status.

### Changing Your Status (Admin Only)

```
/status online
```
or
```
/status offline
```
Updates your availability status for users to see.

### Marking a Transaction as Completed

```
/completed @username
```
Gives the mentioned user the "Completed" role, allowing them to leave reviews.

## 🔄 Planned Features

- [ ] Integration with Minecraft server for real-time player status
- [ ] Automatic delivery tracking system
- [ ] User reputation system
- [ ] Clan management tools
- [ ] Economy and transaction management

## 🐛 Troubleshooting

### Common Issues

**Bot not responding to commands**
- Ensure the bot has proper permissions in your Discord server
- Check that your `.env` file has the correct TOKEN
- Verify the bot is online in the Discord Developer Portal

**MongoDB Connection Issues**
- Check that your MongoDB URI is correct
- Verify your IP is whitelisted in the MongoDB Atlas Network Access settings
- Ensure your database user has the correct permissions

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

### How to Contribute

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Resources

- [Discord.js Documentation](https://discord.js.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [6b6t Server Website](https://example.com)

## 📞 Support

Having issues with the bot? Join our support server:
[Join Discord Server](https://discord.gg/yourdiscordlink)

---

Made with ❤️ for the 6b6t Minecraft community
