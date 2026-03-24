import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Telegraf, Markup } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { User } from '../entities/user.entity';
import { LinksService } from '../bookmarks/links.service';
import { UsersService } from '../bookmarks/users.service';
import { UserSettingsService } from '../bookmarks/user-settings.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly linksService: LinksService,
    private readonly userSettingsService: UserSettingsService,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    this.logger.log('Checking reminders...');

    try {
      const users = await this.usersService.findAll();
      this.logger.log(`Found ${users.length} users to check`);

      const now = new Date();

      for (const user of users) {
        try {
          const shouldSend = await this.userSettingsService.shouldSendReminder(
            user,
            now,
          );
          if (!shouldSend) {
            this.logger.debug(`Skipping reminder for user ${user.telegramId}`);
            continue;
          }

          await this.sendReminderToUser(user);
          await this.userSettingsService.updateLastReminderSent(user, now);
        } catch (error) {
          this.logger.error(
            `Error processing reminder for user ${user.telegramId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log('Reminder check completed');
    } catch (error) {
      this.logger.error(
        `Failed to check reminders: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Helper method to send reminder to a single user
  private async sendReminderToUser(user: User) {
    const settings = await this.userSettingsService.getSettingsForUser(user);
    const unreadLinks = await this.linksService.getUnreadLinksForUser(
      user,
      settings.reminderLimit,
    );

    if (unreadLinks.length === 0) {
      this.logger.debug(`No unread links for user ${user.telegramId}`);
      return;
    }

    const message =
      `📚 Reminder: Here are ${unreadLinks.length} saved links to revisit:\n\n` +
      unreadLinks
        .map((link, index) => {
          const title = link.title || link.url;
          if (link.title && link.title !== link.url) {
            return `${index + 1}. ${title}\n${link.url}`;
          } else {
            return `${index + 1}. ${link.url}`;
          }
        })
        .join('\n\n') +
      `\n\nClick the buttons below to mark as read.`;

    // Create inline buttons: [ ✅ 1 ] [ ✅ 2 ] ...
    type ButtonType = ReturnType<typeof Markup.button.callback>;
    const buttons: ButtonType[] = unreadLinks.map((link, index) =>
      Markup.button.callback(`✅ ${index + 1}`, `mark_read_${link.id}`),
    );

    // Group buttons into rows of up to 3
    const keyboardRows: ButtonType[][] = [];
    for (let i = 0; i < buttons.length; i += 3) {
      keyboardRows.push(buttons.slice(i, i + 3));
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
