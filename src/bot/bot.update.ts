import { Update, Command, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../bookmarks/users.service';
import { LinksService } from '../bookmarks/links.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
  ) {}

  @Command('start')
  async start(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    const { id, username, first_name, last_name } = ctx.from;
    await this.usersService.findOrCreate(id, username, first_name, last_name);
    await ctx.reply(
      `Welcome to Bookmark Graveyard! 📚\n\n` +
        `I'll help you revisit saved content instead of forgetting it.\n\n` +
        `Send me any link (Facebook post, article, etc.) and I'll save it.\n` +
        `I'll send you daily reminders to revisit your saved links.\n\n` +
        `Commands:\n` +
        `/list - Show your saved links\n` +
        `/read <id> - Mark a link as read\n` +
        `/delete <id> - Delete a link permanently\n` +
        `/support - Support the project\n` +
        `/help - Show this help message`,
    );
  }

  @Command('help')
  async help(@Ctx() ctx: Context) {
    await ctx.reply(
      `📖 **How to use Bookmark Graveyard**\n\n` +
        `1. Send me any URL (Facebook, article, video, etc.)\n` +
        `2. I'll save it and store it in your list\n` +
        `3. I'll send you daily reminders with 3-5 unread links\n` +
        `4. Use /list to see all saved links\n` +
        `5. Use /read <id> to mark a link as read (so it won't be reminded)\n\n` +
        `Commands:\n` +
        `/start - Welcome message\n` +
        `/list - Show your saved links (add "unread" to filter)\n` +
        `/read <id> - Mark link as read\n` +
        `/delete <id> - Delete a link permanently\n` +
        `/support - Support the project (donation options)\n` +
        `/help - This message`,
      { parse_mode: 'Markdown' },
    );
  }

  @Command('list')
  async list(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Unable to process command.');
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('User not found. Please send /start first.');
      return;
    }

    const text = ctx.message.text;
    const unreadOnly = text.includes('unread');
    const links = await this.linksService.findByUser(user, {
      unreadOnly,
      take: 10,
    });

    if (links.length === 0) {
      await ctx.reply(unreadOnly ? 'No unread links.' : 'No saved links yet.');
      return;
    }

    const message = links
      .map(
        (link) =>
          `${link.id}. ${link.title || link.url} ${link.isRead ? '✅' : '📌'}`,
      )
      .join('\n');

    await ctx.reply(`Saved links (${links.length}):\n\n${message}`);
  }

  @Command('read')
  async read(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Unable to process command.');
      return;
    }
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      await ctx.reply('Please provide link ID: /read <id>');
      return;
    }
    const id = parseInt(args[0], 10);
    if (isNaN(id)) {
      await ctx.reply('Invalid ID. Please provide a number.');
      return;
    }

    const link = await this.linksService.findById(id);
    if (!link) {
      await ctx.reply('Link not found.');
      return;
    }

    // Check if link belongs to user
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user || link.user.id !== user.id) {
      await ctx.reply('You cannot mark this link as read.');
      return;
    }

    await this.linksService.markAsRead(id);
    await ctx.reply(`Link ${id} marked as read ✅`);
  }

  @Command('delete')
  async delete(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Unable to process command.');
      return;
    }
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      await ctx.reply('Please provide link ID: /delete <id>');
      return;
    }
    const id = parseInt(args[0], 10);
    if (isNaN(id)) {
      await ctx.reply('Invalid ID. Please provide a number.');
      return;
    }

    const link = await this.linksService.findById(id);
    if (!link) {
      await ctx.reply('Link not found.');
      return;
    }

    // Check if link belongs to user
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user || link.user.id !== user.id) {
      await ctx.reply('You cannot delete this link.');
      return;
    }

    const deleted = await this.linksService.delete(id);
    if (deleted) {
      await ctx.reply(`Link ${id} deleted permanently. 🗑️`);
    } else {
      await ctx.reply('Failed to delete link.');
    }
  }

  @Command('support')
  async support(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    await ctx.reply(
      `If you find Bookmark Graveyard useful and want to support its development, you can donate via local payment methods:\n\n` +
        `**KPay**\n` +
        `Number: 09963530189\n` +
        `Name: Yan Myo Aung\n\n` +
        `**AYA Pay**\n` +
        `Number: 09963530189\n` +
        `Name: Yan Myo Aung\n\n` +
        `Your support helps keep this project free and open source for everyone. Thank you! 🙏`,
      { parse_mode: 'Markdown' },
    );
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text;
    const url = this.extractUrl(text);
    if (!url) {
      // Not a URL, ignore
      return;
    }

    try {
      const user = await this.usersService.findOrCreate(
        ctx.from.id,
        ctx.from.username,
        ctx.from.first_name,
        ctx.from.last_name,
      );
      await this.linksService.create(url, user);
      await ctx.reply(`Link saved! I'll remind you about it later. 🔖`);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_LINK') {
        await ctx.reply(
          `You've already saved this link! I'll remind you about it later. 📌`,
        );
      } else {
        console.error('Failed to save link:', error);
        await ctx.reply(`Failed to save link. Please try again later.`);
      }
    }
  }

  private extractUrl(text: string): string | null {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const match = text.match(urlRegex);
    if (!match) return null;

    const url = match[0];
    // Basic validation
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }
}
