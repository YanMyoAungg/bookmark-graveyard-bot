import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { TrendingCacheService } from '../../bookmarks/trending-cache.service';

@Update()
export class TrendingCommand {
  constructor(private readonly trendingCacheService: TrendingCacheService) {}

  private escapeMarkdownV2(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
  }

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

    const lines = trending.map((item, i) => {
      const safeTitle = this.escapeMarkdownV2(item.title || item.url);
      const safeUrl = this.escapeMarkdownV2(item.url);
      const savedLabel = this.escapeMarkdownV2(
        `Saved ${item.saveCount} time${item.saveCount !== 1 ? 's' : ''}`,
      );
      return `${i + 1}\\. ${safeTitle}\n   ${safeUrl}\n   _${savedLabel}_`;
    });

    const message =
      `🔥 *Trending This Week*\n\n${lines.join('\n\n')}\n\n` +
      `_Updated daily based on most\\-saved links\\._`;

    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
  }
}
