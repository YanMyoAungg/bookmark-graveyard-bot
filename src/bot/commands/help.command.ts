import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class HelpCommand {
  @Command('help')
  async help(@Ctx() ctx: Context) {
    await ctx.reply(
      `📖 **How to use Bookmark Graveyard**\n\n` +
        `1. Send me any URL (Facebook, article, video, etc.)\n` +
        `2. I'll fetch the page title automatically and save it with the link\n` +
        `3. I'll show you the link ID with buttons to mark as read or delete\n` +
        `4. I'll send you reminders based on your preferences (customizable via /settings)\n` +
        `5. Send a previously read link again to restore it to your reminders\n` +
        `6. Use /list to see all saved links with inline buttons\n` +
        `7. Use /read <id> to mark a link as read (or click inline buttons)\n\n` +
        `Commands:\n` +
        `/start - Welcome message\n` +
        `/list - Show your saved links (add "unread" to filter)\n` +
        `/read <id> - Mark link as read\n` +
        `/delete <id> - Delete a link permanently\n` +
        `/settings - Configure reminder frequency, time, and links per reminder\n` +
        `/support - Support me\n` +
        `/help - helps`,
      { parse_mode: 'Markdown' },
    );
  }
}
