import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class HelpCommand {
  @Command('help')
  async help(@Ctx() ctx: Context) {
    await ctx.reply(
      `📖 **How to use Bookmark Graveyard**\n\n` +
        `The internet is a vast graveyard of links we save but never revisit. I'm here to bring those forgotten bookmarks back to life.\n\n` +
        `**1. Saving Links**\n` +
        `Send me any URL. I'll fetch the title and store it safely.\n\n` +
        `**2. Reminders**\n` +
        `I'll send you periodic reminders of your unread links based on your /settings. Revisit them to keep your knowledge fresh!\n\n` +
        `**3. Core Actions**\n` +
        `✅ **Mark as Read**: Moves the link to your archive. No more reminders, but still searchable.\n` +
        `🗑️ **Delete**: Removes the link from your account permanently.\n\n` +
        `**Commands:**\n` +
        `/list - Show your saved links (use /list unread for filter)\n` +
        `/tags - View links organized by domain\n` +
        `/settings - Configure reminder frequency & time\n` +
        `/support - View developer portfolio\n` +
        `/help - Show this guide`,
      { parse_mode: 'Markdown' },
    );
  }
}
