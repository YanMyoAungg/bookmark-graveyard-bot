import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { LinksService } from '../../bookmarks/links.service';

@Update()
export class DeduplicateCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
  ) {}

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
}
