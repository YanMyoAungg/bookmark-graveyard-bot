# Bookmark Graveyard

A Telegram bot that helps you revisit saved content instead of forgetting it.

**Open source, community-driven, and free forever.** Built for developers who want to actually learn from saved content.

## Open Source & Community

This project is **100% open source** under the MIT license. The community owns it—feel free to:

- Use it for personal or commercial projects
- Modify, extend, or redistribute the code
- Host your own instance
- Submit improvements via pull requests
- Fork and create your own version
- Translate, document, or create tutorials

No restrictions. No warranties. Just code that belongs to everyone.

## Problem

People save useful content (Facebook posts, articles, videos) but rarely revisit them. This bot solves that by storing links and sending daily reminders to actually read them.

## Features

- **Save links**: Send any URL to the bot (Facebook, articles, etc.)
- **Customizable reminders**: Set frequency (daily/weekly/bi-weekly/monthly), time (UTC), and links per reminder (3-10)
- **Manage links**: List saved links, mark as read
- **Simple**: No accounts, just Telegram
- **First-time setup**: Interactive configuration of reminder preferences

## Tech Stack

- NestJS (TypeScript)
- SQLite
- Telegraf (Telegram bot framework)
- TypeORM

## Setup

### 1. Create a Telegram bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions
3. Copy the bot token (looks like `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and add your bot token
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run the bot

Development (auto-restart on changes):

```bash
pnpm run start:dev
```

Production:

```bash
pnpm run build
pnpm run start:prod
```

## Deployment on Render (Free Tier)

Render's free tier is suitable for hosting this bot. The bot uses SQLite for data storage.

**Important**: SQLite files are ephemeral on Render - your data will be lost when the service restarts or redeploys. This is acceptable for testing or if you don't need persistent data.

### 1. Create a Render account

- Sign up at [render.com](https://render.com) (GitHub login recommended)

### 2. Deploy the bot as a Web Service

- In Render Dashboard, click "New +" → "Web Service"
- Connect your GitHub repository
- Configure:
  - **Name**: `bookmark‑graveyard‑bot`
  - **Environment**: `Node`
  - **Region**: Choose nearest
  - **Branch**: `main`
  - **Build Command**: `pnpm install && pnpm run build`
  - **Start Command**: `pnpm run start:prod`
- Add environment variables:
  - `TELEGRAM_BOT_TOKEN`: Your bot token (required)
  - `NODE_ENV`: `production`
  - `DB_PATH`: `database.sqlite` (SQLite database file path)
  - Note: Reminder settings are now per-user and configurable via `/settings` command
- Click "Create Web Service"

### 3. Wait for deployment

- Render will build and deploy your bot
- Check logs for any errors
- The bot will start polling Telegram

### 4. Keep the service awake (Free tier)

Render's free tier services sleep after 15 minutes of inactivity. To keep your bot awake:

1. Get your Render service URL (e.g., `https://bookmark-graveyard-bot.onrender.com`)
2. Use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping the root endpoint (`GET /`) every 5 minutes
3. This will prevent the service from sleeping and ensure the bot can poll Telegram continuously

Alternatively, upgrade to Render's "Always On" paid plan.

### Option 2: Blueprint deployment (automated)

This repository includes a `render.yaml` blueprint file that automates deployment:

1. Fork or push this repository to your GitHub account
2. In Render Dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will detect the `render.yaml` and create the web service automatically
5. Set `TELEGRAM_BOT_TOKEN` environment variable in the web service settings after creation

## Usage

1. Find your bot on Telegram and start a chat
2. Send `/start` to begin (first-time users will configure reminder preferences)
3. Send any URL to save it
4. The bot will send reminders based on your configured frequency and time
5. Use `/list` to see saved links, `/read <id>` to mark as read
6. Use `/settings` to customize reminder frequency, time, and links per reminder

## Commands

- `/start` - Welcome message and first-time setup
- `/help` - Show help
- `/list` - Show saved links (add "unread" to filter)
- `/read <id>` - Mark a link as read
- `/delete <id>` - Delete a link permanently
- `/settings` - Configure reminder frequency, time, and links per reminder
- `/support` - Support the project (optional donation)

## Configuration

Environment variables (in `.env`):

| Variable             | Description                                      | Default                     |
| -------------------- | ------------------------------------------------ | --------------------------- |
| `TELEGRAM_BOT_TOKEN` | Your bot token from BotFather                    | (required)                  |
| `DB_PATH`            | SQLite database file path                        | `database.sqlite`           |
| `DB_SYNCHRONIZE`     | Auto-create tables (`true` or `false`)           | `NODE_ENV !== 'production'` |
| `NODE_ENV`           | Node environment (`development` or `production`) | `development`               |

**Note:** Reminder settings (frequency, time, links per reminder) are now per-user and configurable via `/settings` command. The previous `REMINDER_CRON` and `REMINDER_LIMIT` environment variables are no longer used. Default reminder time is 09:00 AM Myanmar time (02:30 UTC).

Reminders are checked every minute to ensure precise delivery according to each user's configured time (UTC).

## Data Privacy

- Stores only Telegram user ID and optional username
- Stores only links you send
- No personal data collected
- Open source - inspect the code

## Development

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format

# Build
pnpm run build
```

## Support

This project is free and open source, maintained by the community. If you find it useful and want to support its development, you can:

- Use the `/support` command in the bot to donate via local payment methods (KPay, AYA Pay)
- Contribute code, documentation, or translations on GitHub
- Share it with others who might benefit

Your support helps keep the project alive and free for everyone.

## License

MIT License – see [LICENSE](LICENSE) for full text.

**You are free to:**

- Use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
- Use for any purpose (personal, commercial, educational, etc.)
- Change the code and release your own version

**No restrictions.** The only requirement is to include the original copyright notice.

This project is **free as in freedom** – the community owns it, not a corporation.
