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
        `Welcome to Bookmark Graveyard! 📚\n\n` +
        `I'll help you revisit saved content instead of forgetting it.\n\n` +
        `Before we begin, let's set up your reminder preferences. ` +
        `You can customize:\n` +
        `• Reminder frequency (daily, weekly, etc.)\n` +
        `• Time in UTC\n` +
        `• Number of links per reminder\n\n` +
        `Click below to configure your reminders:`;
      await ctx.reply(
        welcomeMsg,
        Markup.inlineKeyboard([
          [Markup.button.callback('⚙️ Configure Reminders', 'setup_start')],
        ]),
      );
    } else {
      await ctx.reply(
        `Welcome to Bookmark Graveyard! 📚\n\n` +
          `I'll help you revisit saved content instead of forgetting it.\n\n` +
          `Send me any link (Facebook post, article, etc.) and I'll save it.\n` +
          `I'll fetch the page title automatically for easier recognition.\n` +
          `I'll show the link ID with inline buttons to mark as read or delete.\n` +
          `I'll send you reminders based on your preferences.\n` +
          `Send a previously read link again to restore it to your reminders.\n\n` +
          `Commands:\n` +
          `/list - Show your saved links\n` +
          `/read <id> - Mark a link as read\n` +
          `/delete <id> - Delete a link permanently\n` +
          `/settings - Configure reminder preferences\n` +
          `/support - Support the project\n` +
          `/help - Show this help message`,
      );
    }
  }
}
