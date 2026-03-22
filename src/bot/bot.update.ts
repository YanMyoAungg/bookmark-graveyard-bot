import { Update, Command, Ctx, On, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
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
        `I'll fetch the page title automatically for easier recognition.\n` +
        `I'll show the link ID with inline buttons to mark as read or delete.\n` +
        `I'll send you daily reminders with buttons to check off links directly.\n` +
        `Send a previously read link again to restore it to your reminders.\n\n` +
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
        `2. I'll fetch the page title automatically and save it with the link\n` +
        `3. I'll show you the link ID with buttons to mark as read or delete\n` +
        `4. I'll send you daily reminders with buttons to check off links directly\n` +
        `5. Send a previously read link again to restore it to your reminders\n` +
        `6. Use /list to see all saved links with inline buttons\n` +
        `7. Use /read <id> to mark a link as read (or click inline buttons)\n\n` +
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

    const messageLines = links.map((link, index) => {
      const seq = index + 1;
      const status = link.isRead ? '✅' : '📌';
      const title = link.title || link.url;
      const url = link.url;

      if (link.title && link.title !== link.url) {
        return `${seq}. (ID: ${link.id}) ${title}\n   ${url} ${status}`;
      } else {
        return `${seq}. (ID: ${link.id}) ${title} ${status}`;
      }
    });
    const message = `Saved links (${links.length}):\n\n${messageLines.join('\n\n')}`;

    // Create inline keyboard: only show buttons for unread links
    const keyboardRows = links
      .filter((link) => !link.isRead)
      .map((link) => [
        Markup.button.callback(
          `✅ Mark as Read (ID: ${link.id})`,
          `mark_read_${link.id}`,
        ),
      ]);

    if (keyboardRows.length > 0) {
      await ctx.reply(message, Markup.inlineKeyboard(keyboardRows));
    } else {
      await ctx.reply(message);
    }
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

  @Command('deduplicate')
  async deduplicate(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('User not found. Please send /start first.');
      return;
    }
    const removed = await this.linksService.deduplicateForUser(user);
    await ctx.reply(
      `Deduplication complete. Removed ${removed} duplicate link(s).`,
    );
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

  @Action(/^mark_read_(\d+)$/)
  async handleMarkRead(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery || !('data' in ctx.callbackQuery))
      return;
    const match = ctx.callbackQuery.data.match(/^mark_read_(\d+)$/);
    if (!match) return;
    const linkId = parseInt(match[1], 10);

    const link = await this.linksService.findById(linkId);
    if (!link) {
      await ctx.answerCbQuery('Link not found.');
      return;
    }

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user || link.user.id !== user.id) {
      await ctx.answerCbQuery('You cannot mark this link as read.');
      return;
    }

    await this.linksService.markAsRead(linkId);
    await ctx.answerCbQuery('Link marked as read! ✅');

    // Update message text
    if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
      const newText =
        ctx.callbackQuery.message.text.replace('📌', '✅') +
        '\n\n✅ Marked as read!';
      await ctx.editMessageText(newText, {
        ...Markup.inlineKeyboard([]), // Remove buttons
      });
    }
  }

  @Action(/^delete_(\d+)$/)
  async handleDelete(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery || !('data' in ctx.callbackQuery))
      return;
    const match = ctx.callbackQuery.data.match(/^delete_(\d+)$/);
    if (!match) return;
    const linkId = parseInt(match[1], 10);

    const link = await this.linksService.findById(linkId);
    if (!link) {
      await ctx.answerCbQuery('Link not found.');
      return;
    }

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user || link.user.id !== user.id) {
      await ctx.answerCbQuery('You cannot delete this link.');
      return;
    }

    const deleted = await this.linksService.delete(linkId);
    if (deleted) {
      await ctx.answerCbQuery('Link deleted! 🗑️');

      if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
        const newText = ctx.callbackQuery.message.text + '\n\n🗑️ Deleted!';
        await ctx.editMessageText(newText, {
          ...Markup.inlineKeyboard([]), // Remove buttons
        });
      }
    } else {
      await ctx.answerCbQuery('Failed to delete link.');
    }
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
      const { link, isNew, restored } = await this.linksService.create(
        url,
        user,
      );

      let emoji = '🔖';
      let action = 'saved';

      if (!isNew && !restored) {
        if (link.isRead) {
          emoji = '✅';
          action = 'already saved and read';
        } else {
          emoji = '📌';
          action = 'already saved';
        }
      }

      // If restored, treat as new from user perspective (silently unmarked)

      const displayText = link.title || link.url;
      const message = `Link ${action} (ID: ${link.id})! ${emoji}\n${displayText}`;

      // Build buttons based on link state
      type ButtonType = ReturnType<typeof Markup.button.callback>;
      const buttons: ButtonType[] = [];

      // Only show "Mark as Read" button if link is unread
      if (!link.isRead) {
        buttons.push(
          Markup.button.callback('✅ Mark as Read', `mark_read_${link.id}`),
        );
      }

      // Always show Delete button
      buttons.push(Markup.button.callback('🗑️ Delete', `delete_${link.id}`));

      // Create keyboard with buttons in a row (or multiple rows if needed)
      const keyboard = Markup.inlineKeyboard([buttons]);

      await ctx.reply(message, keyboard);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_UNREAD_LINK') {
        await ctx.reply(
          `You already have this link saved and unread! Use /list to see your saved links.`,
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
