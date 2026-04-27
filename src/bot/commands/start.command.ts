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
        `The internet is a vast graveyard of links we save but never revisit. I'm here to act as your **Link Keeper**—bringing those forgotten bookmarks back to life.\n\n` +
        `**How it works:**\n` +
        `1. Send me any link you want to remember.\n` +
        `2. I'll store it safely in your graveyard.\n` +
        `3. I'll send you periodic reminders to revisit them.\n\n` +
        `Before we begin, let's set up your reminder preferences:`;
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
          `✅ **Mark as Read**: Link moves to your archive. No more reminders, but still in your history.\n` +
          `🗑️ **Delete**: Link is removed from the graveyard permanently.\n\n` +
          `**Commands:**\n` +
          `/list - View your saved links\n` +
          `/tags - View links organized by domain\n` +
          `/settings - Change reminder frequency\n` +
          `/help - Detailed guide`,
        { parse_mode: 'Markdown' },
      );
    }
  }
}
