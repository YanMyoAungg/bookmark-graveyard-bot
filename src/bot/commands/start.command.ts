import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { UserSettingsService } from '../../bookmarks/user-settings.service';

@Update()
export class StartCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly userSettingsService: UserSettingsService,
  ) {}

  @Command('start')
  async start(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    const { id, username, first_name, last_name } = ctx.from;
    const user = await this.usersService.findOrCreate(
      id,
      username,
      first_name,
      last_name,
    );
    const settings = await this.userSettingsService.getSettingsForUser(user);

    if (!settings.isSetupComplete) {
      const welcomeMsg =
        `Welcome to **Bookmark Graveyard**! 📚💀\n\n` +
        `We all do it: we see a useful post on Facebook or a great article, we click "Save", and then... we never look at it again. Our saved lists become a graveyard of forgotten knowledge.\n\n` +
        `I'm here to act as your **Link Keeper**. Instead of just saving a link and forgetting it, send it to me. I'll make sure it comes back to life by reminding you to read it later.\n\n` +
        `**How it works:**\n` +
        `1. When you see a post you want to read later, **copy the link** and paste it here.\n` +
        `2. I'll store it safely in your graveyard.\n` +
        `3. I'll send you periodic reminders so you actually **finish reading** what you saved.\n\n` +
        `🔥 **Bonus:** Every day at **10:00 AM** and **08:00 PM** (MMT), I'll broadcast the top trending links saved by the community!\n\n` +
        `You can use /help to see all commands and /settings at any time to change your frequency, reminder time, or link limit.\n\n` +
        `Before we begin, let's set up your initial reminder preferences:`;
      await ctx.reply(welcomeMsg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⚙️ Configure Reminders', 'setup_start')],
        ]),
      });
    } else {
      await ctx.reply(
        `Welcome back to your **Bookmark Graveyard**! 📚\n\n` +
          `Your graveyard is ready. Send me any link (Facebook post, article, video) and I'll keep it safe until it's time for a reminder.\n\n` +
          `**Core Actions:**\n` +
          `✅ **Mark as Read**: Link moves to your archive.\n` +
          `🗑️ **Delete**: Link is removed permanently.\n\n` +
          `**Commands:**\n` +
          `/list - Show your saved links\n` +
          `/tags - View links by domain\n` +
          `/links <tag> - View links in a tag (e.g., /links youtube)\n` +
          `/read <id> - Mark as read (e.g., /read 1)\n` +
          `/delete <id> - Delete link (e.g., /delete 1)\n` +
          `/settings - Configure reminder frequency, time and limit\n` +
          `/support - View developer portfolio\n` +
          `/help - Show this guide`,
        { parse_mode: 'Markdown' },
      );
    }
  }
}
