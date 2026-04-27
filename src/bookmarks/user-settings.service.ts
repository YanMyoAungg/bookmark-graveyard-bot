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
      isPrivate: boolean;
      pendingAction: 'frequency' | 'time' | 'limit' | null;
    }>,
  ): Promise<UserSettings> {
    const settings = await this.getSettingsForUser(user);

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

    // Check frequency
    if (currentHour !== targetHour || currentMinute !== targetMinute) {
      return false;
    }

    if (!settings.lastReminderSent) {
      return true;
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
        return daysDiff >= 30;
      default:
        return false;
    }
  }

  // Helper to convert Myanmar Time (MMT) string to UTC string
  convertMMTToUTC(mmtTime: string): string {
    const [h, m] = mmtTime.split(':').map(Number);
    // MMT is UTC + 6:30
    // UTC = MMT - 6:30
    let utcMinutes = m - 30;
    let utcHours = h - 6;

    if (utcMinutes < 0) {
      utcMinutes += 60;
      utcHours -= 1;
    }
    if (utcHours < 0) {
      utcHours += 24;
    }

    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
  }

  // Helper to convert UTC string to Myanmar Time (MMT) string
  convertUTCToMMT(utcTime: string): string {
    const [h, m] = utcTime.split(':').map(Number);
    // MMT = UTC + 6:30
    let mmtMinutes = m + 30;
    let mmtHours = h + 6;

    if (mmtMinutes >= 60) {
      mmtMinutes -= 60;
      mmtHours += 1;
    }
    if (mmtHours >= 24) {
      mmtHours -= 24;
    }

    return `${mmtHours.toString().padStart(2, '0')}:${mmtMinutes.toString().padStart(2, '0')}`;
  }
}
