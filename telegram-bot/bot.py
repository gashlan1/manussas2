

import os
from dotenv import load_dotenv, set_key
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv()

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

# ─── Config ───────────────────────────────────────────────────────────
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")

gh = None
notion = None


def load_github():
    global gh
    token = os.getenv("GITHUB_TOKEN")
    if token and "PASTE" not in token and "your_" not in token:
        try:
            from github import Github
            gh = Github(token)
            return True
        except Exception:
            pass
    return False


def load_notion():
    global notion
    token = os.getenv("NOTION_TOKEN")
    if token and "PASTE" not in token and "your_" not in token:
        try:
            from notion_client import Client as NotionClient
            notion = NotionClient(auth=token)
            return True
        except Exception:
            pass
    return False


load_github()
load_notion()


# ══════════════════════════════════════════════════════════════════════
#  SETUP — configure tokens via Telegram chat
# ══════════════════════════════════════════════════════════════════════

async def setup(update: Update, context: ContextTypes.DEFAULT_TYPE):
    gh_status = "✅" if gh else "❌ not set"
    notion_status = "✅" if notion else "❌ not set"
    db_id = os.getenv("NOTION_DATABASE_ID", "")
    db_status = "✅" if db_id and "PASTE" not in db_id and "your_" not in db_id else "❌ not set"
    repo = os.getenv("GITHUB_REPO", "")
    repo_status = f"✅ `{repo}`" if repo and "your_" not in repo else "❌ not set"

    await update.message.reply_text(
        "⚙️ *Setup Status:*\n\n"
        f"Telegram: ✅ connected\n"
        f"GitHub: {gh_status}\n"
        f"GitHub Repo: {repo_status}\n"
        f"Notion: {notion_status}\n"
        f"Notion DB: {db_status}\n\n"
        "*To configure, send:*\n"
        "`/set github <your_token>`\n"
        "`/set repo gashlan1/manussas2`\n"
        "`/set notion <your_token>`\n"
        "`/set notiondb <your_database_id>`\n\n"
        "⚡ Your message with the token will be auto-deleted for security.",
        parse_mode="Markdown",
    )


async def set_config(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if len(context.args) < 2:
        await update.message.reply_text(
            "Usage:\n"
            "`/set github <token>`\n"
            "`/set repo <owner/repo>`\n"
            "`/set notion <token>`\n"
            "`/set notiondb <database_id>`",
            parse_mode="Markdown",
        )
        return

    key = context.args[0].lower()
    value = context.args[1]
    chat_id = update.message.chat_id

    # Delete the message containing the token for security
    try:
        await update.message.delete()
    except Exception:
        pass

    if key == "github":
        set_key(ENV_PATH, "GITHUB_TOKEN", value)
        os.environ["GITHUB_TOKEN"] = value
        if load_github():
            try:
                user = gh.get_user()
                await context.bot.send_message(chat_id, f"✅ GitHub connected as `{user.login}`", parse_mode="Markdown")
            except Exception as e:
                await context.bot.send_message(chat_id, f"❌ GitHub token saved but failed to connect: {e}")
        else:
            await context.bot.send_message(chat_id, "❌ GitHub token invalid. Try again.")

    elif key == "notion":
        set_key(ENV_PATH, "NOTION_TOKEN", value)
        os.environ["NOTION_TOKEN"] = value
        if load_notion():
            await context.bot.send_message(chat_id, "✅ Notion connected!")
        else:
            await context.bot.send_message(chat_id, "❌ Notion token invalid. Try again.")

    elif key == "notiondb":
        set_key(ENV_PATH, "NOTION_DATABASE_ID", value)
        os.environ["NOTION_DATABASE_ID"] = value
        await context.bot.send_message(chat_id, "✅ Notion Database ID saved!")

    elif key == "repo":
        set_key(ENV_PATH, "GITHUB_REPO", value)
        os.environ["GITHUB_REPO"] = value
        await context.bot.send_message(chat_id, f"✅ GitHub repo set to `{value}`", parse_mode="Markdown")

    else:
        await context.bot.send_message(chat_id, "Unknown key. Use: github, notion, notiondb, repo")


# ══════════════════════════════════════════════════════════════════════
#  MAIN COMMANDS
# ══════════════════════════════════════════════════════════════════════

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Hello Mo 👋 Bot is working!\n\n"
        "⚙️ /setup — check & configure connections\n\n"
        "── GitHub ──\n"
        "/repos — list your repos\n"
        "/issues — list open issues\n"
        "/create_issue <title> | <body>\n\n"
        "── Notion ──\n"
        "/tasks — list tasks from Notion DB\n"
        "/add_task <title> — add a task\n"
        "/search <query> — search Notion pages\n\n"
        "/help — show this menu"
    )


async def help_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await start(update, context)


# ──────────────────────────────────────────────────────────────────────
#  GITHUB COMMANDS
# ──────────────────────────────────────────────────────────────────────

async def repos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not gh:
        await update.message.reply_text("❌ GitHub not connected. Run /setup")
        return
    try:
        user = gh.get_user()
        repo_list = list(user.get_repos(sort="updated"))[:10]
        if not repo_list:
            await update.message.reply_text("No repos found.")
            return
        msg = "📂 *Your Repos (latest 10):*\n\n"
        for r in repo_list:
            stars = f"⭐ {r.stargazers_count}" if r.stargazers_count else ""
            msg += f"• `{r.full_name}` {stars}\n"
        await update.message.reply_text(msg, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ GitHub error: {e}")


async def issues(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not gh:
        await update.message.reply_text("❌ GitHub not connected. Run /setup")
        return
    repo_name = os.getenv("GITHUB_REPO", "")
    if not repo_name or "your_" in repo_name:
        await update.message.reply_text("❌ No repo set. Use `/set repo owner/name`", parse_mode="Markdown")
        return
    try:
        repo = gh.get_repo(repo_name)
        open_issues = list(repo.get_issues(state="open"))[:10]
        if not open_issues:
            await update.message.reply_text("✅ No open issues!")
            return
        msg = f"🐛 *Open Issues — {repo_name}:*\n\n"
        for i in open_issues:
            labels = " ".join([f"`{l.name}`" for l in i.labels])
            msg += f"• #{i.number} — {i.title} {labels}\n"
        await update.message.reply_text(msg, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ GitHub error: {e}")


async def create_issue(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not gh:
        await update.message.reply_text("❌ GitHub not connected. Run /setup")
        return
    repo_name = os.getenv("GITHUB_REPO", "")
    if not repo_name or "your_" in repo_name:
        await update.message.reply_text("❌ No repo set. Use `/set repo owner/name`", parse_mode="Markdown")
        return
    try:
        raw = " ".join(context.args)
        if not raw:
            await update.message.reply_text("Usage: /create_issue <title> | <body>")
            return
        parts = raw.split("|", 1)
        title = parts[0].strip()
        body = parts[1].strip() if len(parts) > 1 else ""
        repo = gh.get_repo(repo_name)
        issue = repo.create_issue(title=title, body=body)
        await update.message.reply_text(f"✅ Issue created: #{issue.number}\n{issue.html_url}")
    except Exception as e:
        await update.message.reply_text(f"❌ GitHub error: {e}")


# ──────────────────────────────────────────────────────────────────────
#  NOTION COMMANDS
# ──────────────────────────────────────────────────────────────────────

async def tasks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not notion:
        await update.message.reply_text("❌ Notion not connected. Run /setup")
        return
    db_id = os.getenv("NOTION_DATABASE_ID", "")
    if not db_id or "PASTE" in db_id or "your_" in db_id:
        await update.message.reply_text("❌ No database set. Use `/set notiondb <id>`", parse_mode="Markdown")
        return
    try:
        results = notion.databases.query(database_id=db_id)
        pages = results.get("results", [])
        if not pages:
            await update.message.reply_text("📋 No tasks found.")
            return
        msg = "📋 *Notion Tasks:*\n\n"
        for p in pages[:15]:
            title = _get_page_title(p)
            status = _get_status(p)
            emoji = "✅" if status and "done" in status.lower() else "📌"
            msg += f"{emoji} {title}"
            if status:
                msg += f" — `{status}`"
            msg += "\n"
        await update.message.reply_text(msg, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Notion error: {e}")


async def add_task(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not notion:
        await update.message.reply_text("❌ Notion not connected. Run /setup")
        return
    db_id = os.getenv("NOTION_DATABASE_ID", "")
    if not db_id or "PASTE" in db_id or "your_" in db_id:
        await update.message.reply_text("❌ No database set. Use `/set notiondb <id>`", parse_mode="Markdown")
        return
    try:
        title = " ".join(context.args)
        if not title:
            await update.message.reply_text("Usage: /add_task <task title>")
            return
        new_page = notion.pages.create(
            parent={"database_id": db_id},
            properties={"Task name": {"title": [{"text": {"content": title}}]}},
        )
        url = new_page.get("url", "")
        await update.message.reply_text(f"✅ Task added: {title}\n{url}")
    except Exception as e:
        await update.message.reply_text(f"❌ Notion error: {e}")


async def search_notion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not notion:
        await update.message.reply_text("❌ Notion not connected. Run /setup")
        return
    try:
        query = " ".join(context.args)
        if not query:
            await update.message.reply_text("Usage: /search <query>")
            return
        results = notion.search(query=query)
        pages = results.get("results", [])
        if not pages:
            await update.message.reply_text(f"🔍 No results for '{query}'")
            return
        msg = f"🔍 *Results for '{query}':*\n\n"
        for p in pages[:10]:
            title = _get_page_title(p)
            url = p.get("url", "")
            msg += f"• [{title}]({url})\n"
        await update.message.reply_text(msg, parse_mode="Markdown", disable_web_page_preview=True)
    except Exception as e:
        await update.message.reply_text(f"❌ Notion error: {e}")


# ──────────────────────────────────────────────────────────────────────
#  ECHO FALLBACK
# ──────────────────────────────────────────────────────────────────────

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(f"You said: {update.message.text}\n\nType /help for commands.")


# ──────────────────────────────────────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────────────────────────────────────

def _get_page_title(page: dict) -> str:
    props = page.get("properties", {})
    for key, val in props.items():
        if val.get("type") == "title":
            title_arr = val.get("title", [])
            if title_arr:
                return title_arr[0].get("plain_text", "Untitled")
    return "Untitled"


def _get_status(page: dict) -> str | None:
    props = page.get("properties", {})
    for key, val in props.items():
        if val.get("type") == "status":
            status = val.get("status")
            if status:
                return status.get("name")
        elif val.get("type") == "select" and key.lower() in ("status", "state"):
            sel = val.get("select")
            if sel:
                return sel.get("name")
    return None


# ══════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════

def main():
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    # Setup
    app.add_handler(CommandHandler("setup", setup))
    app.add_handler(CommandHandler("set", set_config))

    # General
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))

    # GitHub
    app.add_handler(CommandHandler("repos", repos))
    app.add_handler(CommandHandler("issues", issues))
    app.add_handler(CommandHandler("create_issue", create_issue))

    # Notion
    app.add_handler(CommandHandler("tasks", tasks))
    app.add_handler(CommandHandler("add_task", add_task))
    app.add_handler(CommandHandler("search", search_notion))

    # Fallback
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    print("🤖 Bot started... Send /setup in Telegram to configure.")
    app.run_polling()


if __name__ == "__main__":
    main()
