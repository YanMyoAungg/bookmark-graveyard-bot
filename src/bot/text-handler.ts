import { Update, On, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../bookmarks/users.service';
import { LinksService } from '../bookmarks/links.service';
import { UserSettingsService } from '../bookmarks/user-settings.service';
import { BotService } from './bot.service';
import { TagsService } from '../bookmarks/tags.service';
import { InlineKeyboardButton } from 'telegraf/types';

@Update()
export class TextHandler {
  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
    private readonly userSettingsService: UserSettingsService,
    private readonly botService: BotService,
    private readonly tagsService: TagsService,
  ) {}

  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const user = await this.usersService.findOrCreate(
      ctx.from.id,
      ctx.from.username,
      ctx.from.first_name,
      ctx.from.last_name,
    );
    const settings = await this.userSettingsService.getSettingsForUser(user);

    if (settings.pendingAction) {
      try {
        if (settings.pendingAction === 'frequency') {
          await this.userSettingsService.updateSettings(user, {
            pendingAction: null,
          });
          await ctx.reply('Please use /settings and tap "Change Frequency".');
        } else if (settings.pendingAction === 'time') {
          await this.userSettingsService.updateSettings(user, {
            pendingAction: null,
          });
          await ctx.reply('Please use /settings and tap "Change Time".');
        } else if (settings.pendingAction === 'limit') {
          await this.userSettingsService.updateSettings(user, {
            pendingAction: null,
          });
          await ctx.reply('Please use /settings and tap "Change Links Limit".');
        }
        await this.botService.showSettings(ctx, user);
        return;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        await ctx.reply(`Error: ${errorMessage}`);
        return;
      }
    }

    const text = ctx.message.text;
    const url = this.botService.extractUrl(text);
    if (!url) {
      return;
    }

    try {
      const { link, isNew, restored } = await this.linksService.create(
        url,
        user,
      );

      if (isNew || restored) {
        await this.tagsService.autoTagLink(user, link, url);
      }

      let emoji = '🔖';
      let action = 'saved';

      if (!isNew && !restored) {
        if (link.isRead) {
          emoji = '✅';
          action = 'already saved and read';
        } else {
          emoji = '📌';
          action = 'already saved';
        }
      }

      const message = `Link ${action}! ${emoji}`;

      const buttons: InlineKeyboardButton[] = [];
      if (!link.isRead) {
        buttons.push(
          Markup.button.callback('✅ Mark as Read', `mark_read_${link.id}`),
        );
      }
      buttons.push(Markup.button.callback('🗑️ Delete', `delete_${link.id}`));
      const keyboard = Markup.inlineKeyboard([buttons]);
      await ctx.reply(message, keyboard);
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_UNREAD_LINK') {
        await ctx.reply(
          `You already have this link saved and unread! Use /list to see your saved links.`,
        );
      } else {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error('Failed to save link:', errorMessage);
        await ctx.reply(`Failed to save link. Please try again later.`);
      }
    }
  }
}
