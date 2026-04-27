import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import type { InlineKeyboardButton, Message } from 'telegraf/types';
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
    const callbackData = ctx.callbackQuery.data;
    const match = callbackData.match(/^mark_read_(\d+)$/);
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

    const message = ctx.callbackQuery.message as Message.TextMessage;
    if (
      message &&
      message.reply_markup &&
      'inline_keyboard' in message.reply_markup
    ) {
      const inlineKeyboard = message.reply_markup.inline_keyboard;

      // Filter out the button that was clicked
      const newKeyboard = inlineKeyboard
        .map((row) =>
          row.filter(
            (button: InlineKeyboardButton) =>
              'callback_data' in button &&
              button.callback_data !== callbackData,
          ),
        )
        .filter((row) => row.length > 0);

      const messageText = message.text || '';

      if (newKeyboard.length > 0) {
        // Multi-link message (e.g. reminder)
        // Just remove the button and keep the message as is
        await ctx.editMessageReplyMarkup({
          inline_keyboard: newKeyboard,
        });
      } else {
        // Single-link message
        const newText =
          messageText.replace('📌', '✅') + '\n\n✅ Marked as read!';
        await ctx.editMessageText(newText, {
          ...Markup.inlineKeyboard([]),
        });
      }
    }
  }
}
