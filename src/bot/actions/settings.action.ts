import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { UserSettingsService } from '../../bookmarks/user-settings.service';
import { BotService } from '../bot.service';

@Update()
export class SettingsAction {
  private buildFrequencyKeyboard() {
    const rows = [
      [
        Markup.button.callback('Daily', 'settings_frequency_set_daily'),
        Markup.button.callback('Weekly', 'settings_frequency_set_weekly'),
      ],
      [
        Markup.button.callback('Biweekly', 'settings_frequency_set_biweekly'),
        Markup.button.callback('Monthly', 'settings_frequency_set_monthly'),
      ],
      [Markup.button.callback('⬅️ Back to Settings', 'settings_show')],
    ];

    return Markup.inlineKeyboard(rows);
  }

  private buildLimitKeyboard() {
    const rows = [
      [
        Markup.button.callback('3', 'settings_limit_set_3'),
        Markup.button.callback('4', 'settings_limit_set_4'),
        Markup.button.callback('5', 'settings_limit_set_5'),
        Markup.button.callback('6', 'settings_limit_set_6'),
      ],
      [
        Markup.button.callback('7', 'settings_limit_set_7'),
        Markup.button.callback('8', 'settings_limit_set_8'),
        Markup.button.callback('9', 'settings_limit_set_9'),
        Markup.button.callback('10', 'settings_limit_set_10'),
      ],
      [Markup.button.callback('⬅️ Back to Settings', 'settings_show')],
    ];

    return Markup.inlineKeyboard(rows);
  }

  private buildHourKeyboard() {
    const rows = [];
    for (let hour = 0; hour < 24; hour += 4) {
      rows.push(
        Array.from({ length: 4 }, (_, idx) => {
          const value = String(hour + idx).padStart(2, '0');
          return Markup.button.callback(value, `settings_time_hour_${value}`);
        }),
      );
    }

    rows.push([Markup.button.callback('⬅️ Back to Settings', 'settings_back')]);
    return Markup.inlineKeyboard(rows);
  }

  private buildMinuteTensKeyboard(hour: string) {
    const rows = [
      [
        Markup.button.callback('00-09', `settings_time_tens_${hour}_0`),
        Markup.button.callback('10-19', `settings_time_tens_${hour}_1`),
      ],
      [
        Markup.button.callback('20-29', `settings_time_tens_${hour}_2`),
        Markup.button.callback('30-39', `settings_time_tens_${hour}_3`),
      ],
      [
        Markup.button.callback('40-49', `settings_time_tens_${hour}_4`),
        Markup.button.callback('50-59', `settings_time_tens_${hour}_5`),
      ],
      [
        Markup.button.callback(
          '⬅️ Change Hour',
          'settings_time_select_hour_again',
        ),
      ],
    ];

    return Markup.inlineKeyboard(rows);
  }

  private buildMinuteOnesKeyboard(hour: string, tens: string) {
    const rows = [];
    for (let start = 0; start < 10; start += 5) {
      rows.push(
        Array.from({ length: 5 }, (_, idx) => {
          const ones = String(start + idx);
          const minute = `${tens}${ones}`;
          return Markup.button.callback(
            minute,
            `settings_time_set_${hour}_${minute}`,
          );
        }),
      );
    }

    rows.push([
      Markup.button.callback(
        '⬅️ Change Minute Range',
        `settings_time_hour_${hour}`,
      ),
    ]);

    return Markup.inlineKeyboard(rows);
  }

  constructor(
    private readonly usersService: UsersService,
    private readonly userSettingsService: UserSettingsService,
    private readonly botService: BotService,
  ) {}

  @Action('settings_frequency')
  async handleSettingsFrequency(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    await this.userSettingsService.updateSettings(user, {
      pendingAction: null,
    });

    await ctx.editMessageText('Select reminder frequency.', {
      ...this.buildFrequencyKeyboard(),
    });
    await ctx.answerCbQuery();
  }

  @Action('settings_limit')
  async handleSettingsLimit(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    await this.userSettingsService.updateSettings(user, {
      pendingAction: null,
    });

    await ctx.editMessageText('Select links per reminder.', {
      ...this.buildLimitKeyboard(),
    });
    await ctx.answerCbQuery();
  }

  @Action('settings_time')
  async handleSettingsTime(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    await this.userSettingsService.updateSettings(user, {
      pendingAction: null,
    });

    await ctx.editMessageText(
      'Select reminder hour in **Myanmar Time** (24-hour format).',
      {
        parse_mode: 'Markdown',
        ...this.buildHourKeyboard(),
      },
    );
    await ctx.answerCbQuery();
  }

  @Action('settings_time_select_hour_again')
  async handleBackToTimeHour(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery) return;
    await ctx.editMessageText(
      'Select reminder hour in **Myanmar Time** (24-hour format).',
      {
        parse_mode: 'Markdown',
        ...this.buildHourKeyboard(),
      },
    );
    await ctx.answerCbQuery();
  }

  @Action('settings_show')
  async handleShowSettings(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;
    await this.botService.showSettings(ctx, user);
    await ctx.answerCbQuery();
  }

  @Action(/settings_frequency_set_(daily|weekly|biweekly|monthly)/)
  async handleFrequencyFinal(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery || !('data' in ctx.callbackQuery))
      return;
    const match = ctx.callbackQuery.data.match(
      /^settings_frequency_set_(daily|weekly|biweekly|monthly)$/,
    );
    if (!match) return;

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    const frequency = match[1] as 'daily' | 'weekly' | 'biweekly' | 'monthly';

    await this.userSettingsService.updateSettings(user, {
      reminderFrequency: frequency,
      pendingAction: null,
    });

    await ctx.answerCbQuery(`Frequency set to ${frequency}`);
    await this.botService.showSettings(ctx, user);
  }

  @Action(/settings_limit_set_(\d+)/)
  async handleLimitFinal(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery || !('data' in ctx.callbackQuery))
      return;
    const match = ctx.callbackQuery.data.match(/^settings_limit_set_(\d+)$/);
    if (!match) return;

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    const limit = Number.parseInt(match[1], 10);
    if (Number.isNaN(limit) || limit < 3 || limit > 10) {
      await ctx.answerCbQuery('Invalid limit', { show_alert: true });
      return;
    }

    await this.userSettingsService.updateSettings(user, {
      reminderLimit: limit,
      pendingAction: null,
    });

    await ctx.answerCbQuery(`Links limit set to ${limit}`);
    await this.botService.showSettings(ctx, user);
  }

  @Action(/settings_time_hour_(\d{2})/)
  async handleTimeHour(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
    const match = ctx.callbackQuery.data.match(/^settings_time_hour_(\d{2})$/);
    if (!match) return;
    const hour = match[1];

    await ctx.editMessageText(
      `Selected hour: **${hour}**\nNow choose minute range.`,
      {
        parse_mode: 'Markdown',
        ...this.buildMinuteTensKeyboard(hour),
      },
    );
    await ctx.answerCbQuery();
  }

  @Action(/settings_time_tens_(\d{2})_([0-5])/)
  async handleTimeMinuteTens(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
    const match = ctx.callbackQuery.data.match(
      /^settings_time_tens_(\d{2})_([0-5])$/,
    );
    if (!match) return;
    const hour = match[1];
    const tens = match[2];

    await ctx.editMessageText(
      `Selected time: **${hour}:${tens}x**\nChoose the final minute.`,
      {
        parse_mode: 'Markdown',
        ...this.buildMinuteOnesKeyboard(hour, tens),
      },
    );
    await ctx.answerCbQuery();
  }

  @Action(/settings_time_set_(\d{2})_(\d{2})/)
  async handleTimeFinal(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery || !('data' in ctx.callbackQuery))
      return;
    const match = ctx.callbackQuery.data.match(
      /^settings_time_set_(\d{2})_(\d{2})$/,
    );
    if (!match) return;

    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    const hour = match[1];
    const minute = match[2];
    const mmtTime = `${hour}:${minute}`;
    const utcTime = this.userSettingsService.convertMMTToUTC(mmtTime);

    await this.userSettingsService.updateSettings(user, {
      reminderTime: utcTime,
      pendingAction: null,
    });

    await ctx.answerCbQuery(`Reminder time set to ${mmtTime}`);
    await this.botService.showSettings(ctx, user);
  }

  @Action('settings_setup_complete')
  async handleSetupComplete(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;
    await this.userSettingsService.updateSettings(user, {
      isSetupComplete: true,
    });
    await ctx.answerCbQuery('Setup marked as complete!');
    await this.botService.showSettings(ctx, user);
  }

  @Action('setup_start')
  async handleSetupStart(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;
    await this.botService.showSettings(ctx, user);
  }
}
