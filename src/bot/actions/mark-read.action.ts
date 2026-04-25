import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { LinksService } from '../../bookmarks/links.service';
import { LinkInteractionsService } from '../../bookmarks/link-interactions.service';

@Update()
export class MarkReadAction {
  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
    private readonly linkInteractionsService: LinkInteractionsService,
  ) {}

  @Action(/^mark_read_(\d+)$/)
  async handleMarkRead(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery || !('data' in ctx.callbackQuery))
      return;
    const match = ctx.callbackQuery.data.match(/^mark_read_(\d+)$/);
    if (!match) return;
    const linkId = parseInt(match[1], 10);

    const link = await this.linksService.findById(linkId);
    if (!link) {
      await ctx.answerCbQuery('Link not found.');
      return;
    }

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user || link.user.id !== user.id) {
      await ctx.answerCbQuery('You cannot mark this link as read.');
      return;
    }

    await this.linksService.markAsRead(linkId);
    await this.linkInteractionsService.log(user, link, 'read');
    await ctx.answerCbQuery('Link marked as read! ✅');

    if (ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message) {
      const newText =
        ctx.callbackQuery.message.text.replace('📌', '✅') +
        '\n\n✅ Marked as read!';
      await ctx.editMessageText(newText, {
        ...Markup.inlineKeyboard([]),
      });
    }
  }
}
