import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Telegraf, Markup } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { User } from '../entities/user.entity';
import { LinksService } from '../bookmarks/links.service';
import { UsersService } from '../bookmarks/users.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  @Cron(process.env.REMINDER_CRON || CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders() {
    this.logger.log('Starting daily reminders...');

    try {
      const users = await this.usersService.findAll();
      this.logger.log(`Found ${users.length} users to send reminders`);

      for (const user of users) {
        try {
          await this.sendReminderToUser(user);
        } catch (error) {
          this.logger.error(
            `Error sending reminder to user ${user.telegramId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log('Daily reminders completed');
    } catch (error) {
      this.logger.error(
        `Failed to send daily reminders: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Helper method to send reminder to a single user
  private async sendReminderToUser(user: User) {
    const limit = parseInt(process.env.REMINDER_LIMIT || '5', 10);
    const unreadLinks = await this.linksService.getUnreadLinksForUser(
      user,
      limit,
    );

    if (unreadLinks.length === 0) {
      this.logger.debug(`No unread links for user ${user.telegramId}`);
      return;
    }

    const message =
      `📚 Daily reminder: Here are ${unreadLinks.length} saved links to revisit:\n\n` +
      unreadLinks
        .map(
          (link, index) =>
            `${index + 1}. ${link.title || link.url}\n${link.url}`,
        )
        .join('\n\n') +
      `\n\nClick the buttons below to mark as read.`;

    // Create inline buttons: [ ✅ 1 ] [ ✅ 2 ] ...
    const buttons = unreadLinks.map((link, index) =>
      Markup.button.callback(`✅ ${index + 1}`, `mark_read_${link.id}`),
    );

    // Group buttons into rows of up to 3
    const keyboardRows: any[][] = [];
    for (let i = 0; i < buttons.length; i += 3) {
      keyboardRows.push(buttons.slice(i, i + 3) as any[]);
    }

    const keyboard = Markup.inlineKeyboard(keyboardRows);

    try {
      await this.bot.telegram.sendMessage(user.telegramId, message, keyboard);
      this.logger.log(`Reminder sent to user ${user.telegramId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reminder to user ${user.telegramId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
