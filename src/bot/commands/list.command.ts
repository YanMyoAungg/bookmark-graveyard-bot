import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { LinksService } from '../../bookmarks/links.service';

@Update()
export class ListCommand {
  private getButtonLabel(link: { title?: string; url: string }): string {
    const maxLength = 40;
    let source = link.title?.trim();

    if (!source || source === link.url) {
      try {
        source = new URL(link.url).hostname.replace(/^www\./, '');
      } catch {
        source = link.url;
      }
    }

    const compact = source.replace(/\s+/g, ' ').trim();
    if (compact.length <= maxLength) {
      return compact;
    }
    return `${compact.slice(0, maxLength - 3)}...`;
  }

  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
  ) {}

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

    const keyboardRows = links
      .filter((link) => !link.isRead)
      .map((link) => [
        Markup.button.callback(
          `✅ Read: ${this.getButtonLabel(link)}`,
          `mark_read_${link.id}`,
        ),
      ]);

    if (keyboardRows.length > 0) {
      await ctx.reply(message, Markup.inlineKeyboard(keyboardRows));
    } else {
      await ctx.reply(message);
    }
  }
}
