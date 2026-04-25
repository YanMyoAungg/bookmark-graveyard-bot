import { Update, On, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../bookmarks/users.service';
import { LinksService } from '../bookmarks/links.service';
import { UserSettingsService } from '../bookmarks/user-settings.service';
import { ReminderFrequency } from '../entities/user-settings.entity';
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
      const text = ctx.message.text.trim().toLowerCase();
      try {
        if (settings.pendingAction === 'frequency') {
          const valid = ['daily', 'weekly', 'biweekly', 'monthly'];
          if (!valid.includes(text)) {
            await ctx.reply(
              'Invalid frequency. Please send daily, weekly, biweekly, or monthly.',
            );
            return;
          }
          await this.userSettingsService.updateSettings(user, {
            reminderFrequency: text as ReminderFrequency,
            pendingAction: null,
          });
          await ctx.reply(`Frequency updated to ${text} ✅`);
        } else if (settings.pendingAction === 'time') {
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timeRegex.test(text)) {
            await ctx.reply(
              'Invalid time format. Please use HH:MM (24-hour format). Example: 09:30',
            );
            return;
          }
          const utcTime = this.userSettingsService.convertMMTToUTC(text);
          await this.userSettingsService.updateSettings(user, {
            reminderTime: utcTime,
            pendingAction: null,
          });
          await ctx.reply(`Reminder time updated to ${text} (Myanmar Time) ✅`);
        } else if (settings.pendingAction === 'limit') {
          const limit = parseInt(text, 10);
          if (isNaN(limit) || limit < 3 || limit > 10) {
            await ctx.reply(
              'Invalid number. Please send a number between 3 and 10.',
            );
            return;
          }
          await this.userSettingsService.updateSettings(user, {
            reminderLimit: limit,
            pendingAction: null,
          });
          await ctx.reply(`Reminder limit updated to ${limit} ✅`);
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

      const displayText = link.title || link.url;
      const message = `Link ${action} (ID: ${link.id})! ${emoji}\n${displayText}`;

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
