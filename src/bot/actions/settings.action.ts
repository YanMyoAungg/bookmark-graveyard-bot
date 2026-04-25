import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { UserSettingsService } from '../../bookmarks/user-settings.service';
import { BotService } from '../bot.service';

@Update()
export class SettingsAction {
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
      pendingAction: 'frequency',
    });
    await ctx.reply(
      'Please send the desired frequency. Valid options are:\n' +
        '• `daily`\n' +
        '• `weekly`\n' +
        '• `biweekly`\n' +
        '• `monthly`',
      { parse_mode: 'Markdown' },
    );
    await ctx.answerCbQuery();
  }

  @Action('settings_limit')
  async handleSettingsLimit(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    await this.userSettingsService.updateSettings(user, {
      pendingAction: 'limit',
    });
    await ctx.reply('Please send the number of links per reminder (3-10).');
    await ctx.answerCbQuery();
  }

  @Action('settings_time')
  async handleSettingsTime(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.callbackQuery) return;
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) return;

    await this.userSettingsService.updateSettings(user, {
      pendingAction: 'time',
    });
    await ctx.reply(
      'Please send the reminder time in **Myanmar Time** (24-hour format, HH:MM).\n' +
        'Example: `09:30` for 9:30 AM.',
      { parse_mode: 'Markdown' },
    );
    await ctx.answerCbQuery();
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
