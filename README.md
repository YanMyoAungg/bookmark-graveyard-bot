# Bookmark Graveyard 📚💀

> "The internet is a vast graveyard of links we save but never revisit."

**Bookmark Graveyard** is an open-source Telegram bot designed to solve the "Saved but never read" problem. It acts as your personal **Link Keeper**, ensuring that the useful articles, Facebook posts, and YouTube videos you find actually get consumed instead of disappearing into a digital drawer forever.

[![GitHub stars](https://img.shields.io/github/stars/YanMyoAungg/bookmark-graveyard-bot?style=social)](https://github.com/YanMyoAungg/bookmark-graveyard-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Why This Exists

We all do it: you see a brilliant post on social media or a great tutorial, you click "Save," and you forget about it. **Bookmark Graveyard** brings those links back to life. It’s built for the community, by developers who want to move from "collecting links" to "consuming knowledge."

## ✨ Features

- **📥 Seamless Saving**: Send any URL directly to the bot from your mobile or desktop.
- **⏰ Personalized Reminders**: Configure your own schedule (`daily`, `weekly`, etc.) and time in **Myanmar Time (MMT)**.
- **🔥 Daily Discovery**: Curated **Trending Links** broadcasted twice daily (10:00 AM & 08:00 PM MMT).
- **🔒 Privacy First**: All links are **Private by default**. You choose whether to share your knowledge with the community trending list.
- **🛡️ Security**: Built-in protection against malicious links, phishing, and inappropriate content.
- **🏷️ Smart Organization**: Automatic domain-based tagging and manual tag management.
- **📊 Reading Stats**: Track your personal reading progress and graveyard activity.

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bot Engine**: [Telegraf](https://telegraf.js.org/) / `nestjs-telegraf`
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [TypeORM](https://typeorm.io/)
- **Scheduling**: `@nestjs/schedule` (Cron jobs)
- **Deployment**: Configured for [Render](https://render.com/) with Blueprint support.

## 🚀 Quick Start

### 1) Prerequisites

- Node.js (v20+)
- PostgreSQL
- pnpm

### 2) Create your Telegram Bot

1. Open [@BotFather](https://t.me/botfather) on Telegram.
2. Run `/newbot` and follow the instructions.
3. Copy your **API Token**.

### 3) Environment Configuration

```bash
cp .env.example .env
```

Required values in `.env`:

- `TELEGRAM_BOT_TOKEN`: Your bot token.
- `DATABASE_URL`: Your PostgreSQL connection string.

### 4) Installation & Development

```bash
pnpm install
pnpm run start:dev
```

## 📖 Commands

- `/start` - Launch the bot and run the interactive setup.
- `/help` - Show the comprehensive user guide.
- `/list` - View your saved links (with quick action buttons).
- `/settings` - Configure frequency, time, limit, and privacy.
- `/trending` - Discover the most saved links in the community.
- `/tags` - Browse your bookmarks by domain/tag.
- `/stats` - View your personal reading activity.
- `/deduplicate` - Clean up your graveyard by removing identical links.

## 🤝 Contributing & Support

This project is open-source and free forever!

- **Give us a ⭐**: If you find this bot useful, please star the repository! It helps more people discover the project.
- **Pull Requests**: PRs are welcome! Whether it's a bug fix, a new feature, or a documentation improvement.
- **Support**: Check out the developer's portfolio via the `/support` command in the bot.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ for the community. [Try the bot on Telegram!](https://t.me/bookmark_graveyard_bot)
