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
      `🔔 **Time to revisit your graveyard!**\n\n` +
      `Here are ${unreadLinks.length} links waiting for you. Revisit them to keep your knowledge alive, or mark them as read to archive them.\n\n` +
      unreadLinks
        .map((link, index) => {
          const title = link.title || link.url;
          const displayTitle =
            link.title && link.title !== link.url
              ? `**${title}**`
              : `🔗 Link #${link.id}`;
          return `${index + 1}. ${displayTitle}\n${link.url}`;
        })
        .join('\n\n') +
      `\n\n✅ **Mark as Read**: Moves to archive, stops reminders.\n` +
      `🗑️ **Delete**: Use /delete <id> to remove permanently.`;

    // Create inline buttons: [ ✅ 1 ] [ ✅ 2 ] ...
    const buttons = unreadLinks.map((link, index) =>
      Markup.button.callback(`✅ ${index + 1}`, `mark_read_${link.id}`),
    );

    // Group buttons into rows of up to 5 (reminders can have up to 10 links)
    const keyboardRows: any[][] = [];
    for (let i = 0; i < buttons.length; i += 5) {
      keyboardRows.push(buttons.slice(i, i + 5));
    }

    const keyboard = Markup.inlineKeyboard(keyboardRows);

    try {
      await this.bot.telegram.sendMessage(user.telegramId, message, {
        parse_mode: 'Markdown',
        ...keyboard,
      });
      this.logger.log(`Reminder sent to user ${user.telegramId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reminder to user ${user.telegramId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
