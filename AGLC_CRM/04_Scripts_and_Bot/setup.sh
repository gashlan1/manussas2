#!/bin/bash

echo "🤖 AGLC CRM Telegram Bot Setup"
echo "=============================="

cd ~/telegram-bot

# Initialize npm project
npm init -y

# Install dependencies
npm install telegraf dotenv

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get bot token from @BotFather on Telegram"
echo "2. Get your chat ID"
echo "3. Create .env file with:"
echo "   TELEGRAM_BOT_TOKEN=your_token"
echo "   TELEGRAM_CHAT_ID=your_chat_id"
echo "4. Run: node bot.js"
