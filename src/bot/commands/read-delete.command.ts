import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { LinksService } from '../../bookmarks/links.service';
import { TrendingCacheService } from '../../bookmarks/trending-cache.service';

@Update()
export class ReadDeleteCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
    private readonly trendingCacheService: TrendingCacheService,
  ) {}

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

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user || link.user.id !== user.id) {
      await ctx.reply('You cannot mark this link as read.');
      return;
    }

    await this.linksService.markAsRead(id);
    await ctx.reply(
      `Link #${id} marked as read ✅\n\nIt has been moved to your archive and won't appear in future reminders. You can still find it in your /list.`,
    );
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

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user || link.user.id !== user.id) {
      await ctx.reply('You cannot delete this link.');
      return;
    }

    const deleted = await this.linksService.delete(id);
    if (deleted) {
      await ctx.reply(
        `Link #${id} deleted permanently 🗑️\n\nIt has been completely removed from your graveyard and won't be reminded ever again.`,
      );
      this.trendingCacheService
        .refreshTrending()
        .catch((err) =>
          console.error(
            'Failed to refresh trending cache on delete command:',
            err,
          ),
        );
    } else {
      await ctx.reply('Failed to delete link.');
    }
  }
}
