import { Injectable } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { User } from '../entities/user.entity';
import { UserSettingsService } from '../bookmarks/user-settings.service';

@Injectable()
export class BotService {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  async showSettings(ctx: Context, user: User) {
    const settings = await this.userSettingsService.getSettingsForUser(user);

    const frequencyText = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly (every 2 weeks)',
      monthly: 'Monthly',
    }[settings.reminderFrequency];

    const mmtTime = this.userSettingsService.convertUTCToMMT(
      settings.reminderTime,
    );

    let message = '';
    if (!settings.isSetupComplete) {
      message =
        `⚙️ **First-time Setup**\n\n` +
        `Please configure your reminder preferences:\n\n` +
        `**Frequency:** ${frequencyText}\n` +
        `**Time (Myanmar Time):** ${mmtTime}\n` +
        `**Links per reminder:** ${settings.reminderLimit}\n\n` +
        `Click a button to change a setting. Time selection uses guided hour/minute buttons.`;
    } else {
      message =
        `⚙️ **Your Reminder Settings**\n\n` +
        `**Frequency:** ${frequencyText}\n` +
        `**Time (Myanmar Time):** ${mmtTime}\n` +
        `**Links per reminder:** ${settings.reminderLimit}\n\n` +
        `Click a button to change a setting. Time selection uses guided hour/minute buttons.`;
    }

    const keyboardRows = [
      [Markup.button.callback('🔄 Change Frequency', 'settings_frequency')],
      [Markup.button.callback('⏰ Change Time', 'settings_time')],
      [Markup.button.callback('🔢 Change Links Limit', 'settings_limit')],
    ];

    if (!settings.isSetupComplete) {
      keyboardRows.push([
        Markup.button.callback('✅ Finish Setup', 'settings_setup_complete'),
      ]);
    }

    const keyboard = Markup.inlineKeyboard(keyboardRows);

    if (ctx.callbackQuery && ctx.callbackQuery.message) {
      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
    } else {
      await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
    }
  }

  extractUrl(text: string): string | null {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const match = text.match(urlRegex);
    if (!match) return null;

    const url = match[0];
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }
}
