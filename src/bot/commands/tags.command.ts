import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { TagsService } from '../../bookmarks/tags.service';

@Update()
export class TagsCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,
  ) {}

  @Command('tags')
  async tags(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('User not found. Please send /start first.');
      return;
    }

    const tags = await this.tagsService.getTagsWithCounts(user);

    if (tags.length === 0) {
      await ctx.reply(
        'No tags yet. Save some links and they will be auto-tagged based on the domain!',
      );
      return;
    }

    const tagLines = tags.map(
      (t, i) =>
        `${i + 1}. #${t.name} (${t.count} link${t.count !== 1 ? 's' : ''})`,
    );

    const message =
      `🏷️ **Your Tags**\n\n${tagLines.join('\n')}\n\n` +
      `Use /links <tag> to view links in a tag.`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }
}
