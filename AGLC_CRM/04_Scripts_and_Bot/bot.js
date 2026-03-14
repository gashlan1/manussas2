const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const allowedChatId = parseInt(process.env.TELEGRAM_CHAT_ID);

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function executeCommand(ctx, command) {
  return new Promise((resolve) => {
    log(`Executing: ${command}`);
    const proc = exec(command, { cwd: process.env.HOME, maxBuffer: 1024 * 1024 * 10 });
    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

    proc.on('close', (code) => {
      let msg = `✅ Done (Code: ${code})\n\n`;
      msg += `📝 Command: \`${command}\`\n`;
      if (output) msg += `\n📤 Output:\n\`\`\`\n${output.substring(0, 2000)}\n\`\`\`\n`;
      if (errorOutput) msg += `\n⚠️ Error:\n\`\`\`\n${errorOutput.substring(0, 2000)}\n\`\`\`\n`;
      if (output.length > 2000 || errorOutput.length > 2000) {
        msg += `\n📌 Output truncated (too long)`;
      }
      ctx.reply(msg, { parse_mode: 'Markdown' }).catch(() => {
        // If Markdown fails, send as plain text
        ctx.reply(msg.replace(/`/g, ''));
      });
      resolve();
    });
  });
}

// Security middleware
function authCheck(ctx, next) {
  if (ctx.chat.id !== allowedChatId) {
    ctx.reply('❌ Unauthorized. Your Chat ID: ' + ctx.chat.id);
    return;
  }
  return next();
}

bot.use(authCheck);

// /start command
bot.command('start', (ctx) => {
  ctx.reply(`
🤖 AGLC CRM Terminal Bot
━━━━━━━━━━━━━━━━━━━━━━━━

📋 Commands:
/cmd <command> - Execute any terminal command
/deploy - Run full deployment script
/status - Check system status
/docker <ps|up|down|restart|logs> - Docker commands
/git <status|log|pull> - Git commands
/dev - Start development server
/test - Run tests
/help - Show all commands

💡 Tip: You can also just type any command directly without /cmd

Example: ls -la
  `);
});

// /cmd - Execute any command
bot.command('cmd', (ctx) => {
  const cmd = ctx.message.text.replace('/cmd ', '').trim();
  if (!cmd) return ctx.reply('❌ Usage: /cmd <command>\nExample: /cmd ls -la');
  ctx.reply(`⏳ Executing: \`${cmd}\``, { parse_mode: 'Markdown' });
  executeCommand(ctx, cmd);
});

// /deploy - Run deployment
bot.command('deploy', (ctx) => {
  ctx.reply('⏳ Starting AGLC CRM deployment...');
  executeCommand(ctx, 'bash ~/AGLC_CRM_DEPLOY.sh');
});

// /status - Check system status
bot.command('status', (ctx) => {
  ctx.reply('⏳ Checking system status...');
  const statusCmd = `
    echo "=== System Info ==="
    uname -a
    echo ""
    echo "=== Node.js ==="
    node --version 2>/dev/null || echo "Not installed"
    echo ""
    echo "=== pnpm ==="
    pnpm --version 2>/dev/null || echo "Not installed"
    echo ""
    echo "=== Docker Containers ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not running"
    echo ""
    echo "=== Disk Usage ==="
    df -h / | tail -1
    echo ""
    echo "=== Memory ==="
    free -h | head -2
  `;
  executeCommand(ctx, statusCmd);
});

// /docker - Docker commands
bot.command('docker', (ctx) => {
  const sub = ctx.message.text.replace('/docker', '').trim() || 'ps';
  const cmds = {
    'ps': 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
    'up': 'cd ~/projects/aglc/aglc-crm && docker-compose up -d',
    'down': 'cd ~/projects/aglc/aglc-crm && docker-compose down',
    'restart': 'cd ~/projects/aglc/aglc-crm && docker-compose restart',
    'logs': 'cd ~/projects/aglc/aglc-crm && docker-compose logs --tail=50 postgres'
  };
  const cmd = cmds[sub] || `docker ${sub}`;
  ctx.reply(`⏳ Docker: \`${cmd}\``, { parse_mode: 'Markdown' });
  executeCommand(ctx, cmd);
});

// /git - Git commands
bot.command('git', (ctx) => {
  const sub = ctx.message.text.replace('/git', '').trim() || 'status';
  const cmds = {
    'status': 'cd ~/projects/aglc/aglc-crm && git status',
    'log': 'cd ~/projects/aglc/aglc-crm && git log --oneline -10',
    'pull': 'cd ~/projects/aglc/aglc-crm && git pull origin main',
    'branch': 'cd ~/projects/aglc/aglc-crm && git branch -a',
    'diff': 'cd ~/projects/aglc/aglc-crm && git diff --stat'
  };
  const cmd = cmds[sub] || `cd ~/projects/aglc/aglc-crm && git ${sub}`;
  ctx.reply(`⏳ Git: \`${cmd}\``, { parse_mode: 'Markdown' });
  executeCommand(ctx, cmd);
});

// /dev - Start development server
bot.command('dev', (ctx) => {
  ctx.reply('⏳ Starting development server...');
  executeCommand(ctx, 'cd ~/projects/aglc/aglc-crm && pnpm dev &');
});

// /test - Run tests
bot.command('test', (ctx) => {
  ctx.reply('⏳ Running tests...');
  executeCommand(ctx, 'cd ~/projects/aglc/aglc-crm && pnpm test');
});

// /help - Show help
bot.command('help', (ctx) => {
  ctx.reply(`
📚 AGLC CRM Terminal Bot - Full Command Reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 General:
/cmd <command> - Execute any command
/status - System status
/help - This help menu

🚀 Deployment:
/deploy - Full deployment
/dev - Start dev server
/test - Run tests

🐳 Docker:
/docker ps - Show containers
/docker up - Start containers
/docker down - Stop containers
/docker restart - Restart containers
/docker logs - View logs

📦 Git:
/git status - Git status
/git log - Recent commits
/git pull - Pull latest
/git branch - List branches
/git diff - Show changes

💡 Quick Tip:
Type any command directly without /cmd
Example: ls -la
  `);
});

// Handle plain text as commands
bot.on('text', (ctx) => {
  if (ctx.message.text.startsWith('/')) return;
  const cmd = ctx.message.text.trim();
  ctx.reply(`⏳ Executing: \`${cmd}\``, { parse_mode: 'Markdown' });
  executeCommand(ctx, cmd);
});

// Error handling
bot.catch((err, ctx) => {
  log(`Error: ${err}`);
  ctx.reply(`❌ Error: ${err.message}`);
});

// Launch
bot.launch();
log('🤖 AGLC CRM Telegram Bot started successfully');
log(`Authorized Chat ID: ${allowedChatId}`);

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
