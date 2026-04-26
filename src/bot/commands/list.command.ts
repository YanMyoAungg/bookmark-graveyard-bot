import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { LinksService } from '../../bookmarks/links.service';

@Update()
export class ListCommand {
  private readonly unextractableTitleText = 'Title is not extractable';

  private normalizeComparableText(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private isGenericOrUnhelpfulTitle(title: string, url: string): boolean {
    const normalizedTitle = title.trim().toLowerCase();
    if (!normalizedTitle) {
      return true;
    }

    const genericTitles = new Set([
      'home',
      'homepage',
      'login',
      'log in',
      'sign in',
      'dashboard',
      'website',
      'untitled',
      'just a moment...',
      'facebook',
      'فيسبوك',
    ]);

    if (genericTitles.has(normalizedTitle)) {
      return true;
    }

    try {
      const hostname = new URL(url).hostname
        .replace(/^www\./, '')
        .toLowerCase();

      const hostnameComparable = this.normalizeComparableText(hostname);
      const titleComparable = this.normalizeComparableText(normalizedTitle);

      // If the title is effectively just the site/domain name, it is not useful.
      if (titleComparable && titleComparable === hostnameComparable) {
        return true;
      }

      const hostnameParts = hostname.split('.');
      if (hostnameParts.length >= 2) {
        const domainLabel = hostnameParts[hostnameParts.length - 2];
        const domainComparable = this.normalizeComparableText(domainLabel);
        if (domainComparable && titleComparable === domainComparable) {
          return true;
        }
      }

      // Very short titles are often placeholders and not useful to users.
      if (normalizedTitle.length < 3) {
        return true;
      }
    } catch {
      // Ignore parse errors and keep the title.
    }

    return false;
  }

  private getDisplayTitle(link: { title?: string; url: string }): string {
    if (!link.title || link.title === link.url) {
      return this.unextractableTitleText;
    }

    if (this.isGenericOrUnhelpfulTitle(link.title, link.url)) {
      return this.unextractableTitleText;
    }

    return link.title;
  }

  private getButtonLabel(link: { title?: string; url: string }): string {
    const maxLength = 40;
    let source = this.getDisplayTitle(link);

    if (source === this.unextractableTitleText) {
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
      const title = this.getDisplayTitle(link);
      const url = link.url;

      return `${seq}. (ID: ${link.id}) ${title}\n   ${url} ${status}`;
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
