import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class HelpCommand {
  @Command('help')
  async help(@Ctx() ctx: Context) {
    await ctx.reply(
      `📖 **How to use Bookmark Graveyard**\n\n` +
        `Welcome to **Bookmark Graveyard**! 📚💀\n\n` +
        `I am your Link Keeper. I help you finish reading the links you save instead of letting them die in a "Saved" list.\n\n` +
        `🔥 **Daily Discovery:** I send a list of top trending links to everyone at **10:00 AM** and **08:00 PM** (MMT). Your links only appear here if you set your privacy to Public in /settings.\n\n` +
        `**How to use:**\n` +
        `Simply send me any link (Facebook post, article, YouTube video), and I will add it to your graveyard. I will then remind you to read it based on your settings.\n\n` +
        `**3. Core Actions**\n` +
        `✅ **Mark as Read**: Moves the link to your archive. No more reminders, but still searchable.\n` +
        `🗑️ **Delete**: Removes the link from your account permanently.\n\n` +
        `**Commands:**\n` +
        `/list - Show your saved links\n` +
        `/tags - View links by domain\n` +
        `/links <tag> - View links in a tag (e.g., /links youtube)\n` +
        `/read <id> - Mark as read (e.g., /read 1)\n` +
        `/delete <id> - Delete link (e.g., /delete 1)\n` +
        `/settings - Configure reminder frequency, time, limit and privacy\n` +
        `/support - View developer portfolio\n` +
        `/help - Show this guide`,
      { parse_mode: 'Markdown' },
    );
  }
}
