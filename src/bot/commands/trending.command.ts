import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { TrendingCacheService } from '../../bookmarks/trending-cache.service';

@Update()
export class TrendingCommand {
  constructor(private readonly trendingCacheService: TrendingCacheService) {}

  @Command('trending')
  async trending(@Ctx() ctx: Context) {
    const trending = await this.trendingCacheService.getTrending();

    if (trending.length === 0) {
      await ctx.reply(
        'No trending links yet. The trending data is updated daily.\n' +
          'Come back later when more users have saved links!',
      );
      return;
    }

    const lines = trending.map(
      (item, i) =>
        `${i + 1}. ${item.title || item.url}\n   ${item.url}\n   _Saved ${item.saveCount} time${item.saveCount !== 1 ? 's' : ''}_`,
    );

    const message =
      `🔥 **Trending This Week**\n\n${lines.join('\n\n')}\n\n` +
      `_Updated daily based on most-saved links._`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }
}
