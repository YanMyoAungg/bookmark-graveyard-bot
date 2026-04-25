import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { ReadingPatternService } from '../../bookmarks/reading-pattern.service';

@Update()
export class StatsCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly readingPatternService: ReadingPatternService,
  ) {}

  @Command('stats')
  async stats(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('User not found. Please send /start first.');
      return;
    }

    const message = await this.readingPatternService.getStats(user);
    await ctx.reply(message, { parse_mode: 'Markdown' });
  }
}
