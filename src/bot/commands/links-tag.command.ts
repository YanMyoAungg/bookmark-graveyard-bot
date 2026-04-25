import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { TagsService } from '../../bookmarks/tags.service';

@Update()
export class LinksTagCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,
  ) {}

  @Command('links')
  async linksByTag(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Unable to process command.');
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('User not found. Please send /start first.');
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length === 0) {
      await ctx.reply(
        'Please provide a tag name: /links <tag>\n' +
          'Use /tags to see your available tags.',
      );
      return;
    }

    const tagName = args.join(' ').toLowerCase().trim();
    const links = await this.tagsService.findLinksByTag(user, tagName);

    if (links.length === 0) {
      await ctx.reply(`No links found with tag "#${tagName}".`);
      return;
    }

    const messageLines = links.map((link, index) => {
      const seq = index + 1;
      const status = link.isRead ? '✅' : '📌';
      const title = link.title || link.url;
      if (link.title && link.title !== link.url) {
        return `${seq}. (ID: ${link.id}) ${title}\n   ${link.url} ${status}`;
      }
      return `${seq}. (ID: ${link.id}) ${title} ${status}`;
    });

    const message = `Links tagged #${tagName} (${links.length}):\n\n${messageLines.join('\n\n')}`;
    await ctx.reply(message);
  }
}
