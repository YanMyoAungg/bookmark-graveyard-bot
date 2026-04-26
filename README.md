# Bookmark Graveyard

A Telegram bot that helps you revisit saved links instead of letting them disappear into your "saved for later" pile.

Open source, community-driven, and free forever.

## Why This Exists

Most people save useful content and rarely come back to it. Bookmark Graveyard solves this by:

- saving links directly from chat
- reminding you at your preferred schedule
- giving quick actions to mark links as read or delete them

## Features

- Save any URL by sending it to the bot
- Automatic title extraction for better readability
- Duplicate-aware saving (including restore-from-read behavior)
- Per-user reminder settings (`daily`, `weekly`, `biweekly`, `monthly`)
- Reminder time customization (stored as UTC, configured in Myanmar time UX)
- Smart list UI with inline "Mark as Read" actions
- Optional auto-tagging by domain and tag-based browsing
- Trending command for most-saved links

## Tech Stack

- NestJS + TypeScript
- Telegraf / `nestjs-telegraf`
- TypeORM
- PostgreSQL
- Cron jobs via `@nestjs/schedule`

## Quick Start

### 1) Create your Telegram bot

1. Open [@BotFather](https://t.me/botfather)
2. Run `/newbot`
3. Copy your bot token

### 2) Configure environment

```bash
cp .env.example .env
```

Required values in `.env`:

- `TELEGRAM_BOT_TOKEN`
- `DATABASE_URL`

Optional:

- `DB_SYNCHRONIZE` (defaults to `true` outside production)
- `NODE_ENV`
- `SERVICE_URL` (used by keep-alive ping job)

### 3) Install and run

```bash
pnpm install
pnpm run start:dev
```

Production:

```bash
pnpm run build
pnpm run start:prod
```

## Commands

- `/start` - greet user and run first-time setup
- `/help` - show help
- `/list` - list latest saved links
- `/list unread` - list unread links only
- `/read <id>` - mark one link as read
- `/delete <id>` - delete one link
- `/settings` - configure reminder frequency, time, and reminder size
- `/tags` - show tag usage
- `/linksbytag <tag>` - list links under a tag
- `/stats` - show personal reading activity stats
- `/trending` - show top saved links this week
- `/deduplicate` - remove duplicate links for current user
- `/support` - donation / support info

## Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from BotFather | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DB_SYNCHRONIZE` | TypeORM auto schema sync (`true`/`false`) | No |
| `NODE_ENV` | Runtime environment (`development`/`production`) | No |
| `SERVICE_URL` | Public service URL for scheduled self-ping | No |

Notes:

- Reminder preferences are stored per user and managed via `/settings`.
- Legacy `REMINDER_CRON` and `REMINDER_LIMIT` env vars are no longer used.

## Deployment (Render)

This repo includes `render.yaml` for Blueprint deployments.

Minimum Render env vars:

- `TELEGRAM_BOT_TOKEN`
- `DATABASE_URL`
- `NODE_ENV=production`

After deploy:

- verify `/healthz` endpoint responds
- verify bot can poll and receive updates

## Development

```bash
pnpm run lint
pnpm run test
pnpm run build
```

## Privacy

- Stores Telegram user ID and basic profile fields (username, first/last name)
- Stores links and related metadata (title, read state, tags, interactions)
- No analytics SDKs or ad tracking built into this codebase

## Contributing

PRs are welcome. Good first contributions:

- command UX improvements
- reminder reliability improvements
- tests for command handlers and services
- docs and localization improvements

## License

MIT - see [LICENSE](LICENSE).
