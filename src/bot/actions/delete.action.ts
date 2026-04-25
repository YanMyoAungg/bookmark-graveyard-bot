import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { LinksService } from '../../bookmarks/links.service';
import { LinkInteractionsService } from '../../bookmarks/link-interactions.service';

@Update()
export class DeleteAction {
  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
    private readonly linkInteractionsService: LinkInteractionsService,
  ) {}

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

    await this.linkInteractionsService.log(user, link, 'deleted');
    const deleted = await this.linksService.delete(linkId);
    if (deleted) {
      await ctx.answerCbQuery('Link deleted! 🗑️');

      if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
        const newText = ctx.callbackQuery.message.text + '\n\n🗑️ Deleted!';
        await ctx.editMessageText(newText, {
          ...Markup.inlineKeyboard([]),
        });
      }
    } else {
      await ctx.answerCbQuery('Failed to delete link.');
    }
  }
}
