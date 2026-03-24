import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserSettings,
  ReminderFrequency,
} from '../entities/user-settings.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UserSettingsService {
  private readonly logger = new Logger(UserSettingsService.name);

  constructor(
    @InjectRepository(UserSettings)
    private userSettingsRepository: Repository<UserSettings>,
  ) {}

  async createDefaultSettings(user: User): Promise<UserSettings> {
    const settings = this.userSettingsRepository.create({
      user,
      reminderFrequency: 'daily',
      reminderTime: '02:30',
      reminderLimit: 5,
    });
    return this.userSettingsRepository.save(settings);
  }

  async getSettingsForUser(user: User): Promise<UserSettings> {
    let settings = await this.userSettingsRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!settings) {
      this.logger.log(`Creating default settings for user ${user.id}`);
      settings = await this.createDefaultSettings(user);
    }

    return settings;
  }

  async updateSettings(
    user: User,
    updates: Partial<{
      reminderFrequency: ReminderFrequency;
      reminderTime: string;
      reminderLimit: number;
      isSetupComplete: boolean;
    }>,
  ): Promise<UserSettings> {
    const settings = await this.getSettingsForUser(user);

    // Validate time format (HH:MM)
    if (updates.reminderTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(updates.reminderTime)) {
        throw new Error(
          'Invalid time format. Use HH:MM (24-hour format, UTC).',
        );
      }
    }

    // Validate limit (3-10)
    if (updates.reminderLimit !== undefined) {
      if (updates.reminderLimit < 3 || updates.reminderLimit > 10) {
        throw new Error('Reminder limit must be between 3 and 10.');
      }
    }

    Object.assign(settings, updates);
    return this.userSettingsRepository.save(settings);
  }

  async updateLastReminderSent(user: User, date: Date): Promise<void> {
    const settings = await this.getSettingsForUser(user);
    settings.lastReminderSent = date;
    await this.userSettingsRepository.save(settings);
  }

  async shouldSendReminder(user: User, currentDate: Date): Promise<boolean> {
    const settings = await this.getSettingsForUser(user);

    // Check if current time matches reminder time (within the hour)
    const [targetHour, targetMinute] = settings.reminderTime
      .split(':')
      .map(Number);
    const currentHour = currentDate.getUTCHours();
    const currentMinute = currentDate.getUTCMinutes();

    // Only send if we're at the exact hour and minute (simple check)
    // In production, you might want to allow a window (e.g., within 5 minutes)
    if (currentHour !== targetHour || currentMinute !== targetMinute) {
      return false;
    }

    // Check frequency
    if (!settings.lastReminderSent) {
      return true; // Never sent before
    }

    const lastSent = settings.lastReminderSent;
    const daysDiff = Math.floor(
      (currentDate.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24),
    );

    switch (settings.reminderFrequency) {
      case 'daily':
        return daysDiff >= 1;
      case 'weekly':
        return daysDiff >= 7;
      case 'biweekly':
        return daysDiff >= 14;
      case 'monthly':
        // Approximate month as 30 days
        return daysDiff >= 30;
      default:
        return false;
    }
  }
}
