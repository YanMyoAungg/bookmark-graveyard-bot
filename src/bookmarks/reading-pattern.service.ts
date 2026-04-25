import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingPattern } from '../entities/reading-pattern.entity';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';
import { LinkInteractionsService } from './link-interactions.service';

@Injectable()
export class ReadingPatternService {
  private readonly logger = new Logger(ReadingPatternService.name);

  constructor(
    @InjectRepository(ReadingPattern)
    private readingPatternRepository: Repository<ReadingPattern>,
    private readonly usersService: UsersService,
    private readonly linkInteractionsService: LinkInteractionsService,
  ) {}

  async getOrCreate(user: User): Promise<ReadingPattern> {
    let pattern = await this.readingPatternRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!pattern) {
      pattern = this.readingPatternRepository.create({ user });
      pattern = await this.readingPatternRepository.save(pattern);
    }
    return pattern;
  }

  async derive(user: User): Promise<ReadingPattern> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const interactions =
      await this.linkInteractionsService.getInteractionsSince(
        user,
        sevenDaysAgo,
      );

    const pattern = await this.getOrCreate(user);

    if (interactions.length === 0) {
      pattern.preferredUtcHour = null;
      pattern.bestDayOfWeek = null;
      pattern.lastDerivedAt = new Date();
      return this.readingPatternRepository.save(pattern);
    }

    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};

    for (const interaction of interactions) {
      const hour = interaction.createdAt.getUTCHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      const day = interaction.createdAt.getUTCDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    let bestHour = -1;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxHourCount) {
        maxHourCount = count;
        bestHour = parseInt(hour, 10);
      }
    }

    let bestDay = -1;
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > maxDayCount) {
        maxDayCount = count;
        bestDay = parseInt(day, 10);
      }
    }

    pattern.preferredUtcHour = bestHour >= 0 ? bestHour : null;
    pattern.bestDayOfWeek = bestDay >= 0 ? bestDay : null;
    pattern.lastDerivedAt = new Date();

    return this.readingPatternRepository.save(pattern);
  }

  async getStats(user: User): Promise<string> {
    const pattern = await this.derive(user);

    if (pattern.preferredUtcHour === null && pattern.bestDayOfWeek === null) {
      return (
        `📊 **Your Reading Stats**\n\n` +
        `Not enough data yet. Keep saving and reading links to unlock insights!`
      );
    }

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const utcHour = pattern.preferredUtcHour;
    const mmtHour = utcHour !== null ? (utcHour + 6 + 30 / 60) % 24 : null;
    const mmtHourStr =
      mmtHour !== null
        ? `${Math.floor(mmtHour).toString().padStart(2, '0')}:${Math.round(
            (mmtHour % 1) * 60,
          )
            .toString()
            .padStart(2, '0')}`
        : 'N/A';

    const dayName =
      pattern.bestDayOfWeek !== null ? dayNames[pattern.bestDayOfWeek] : 'N/A';

    return (
      `📊 **Your Reading Stats**\n\n` +
      `**Most active reading hour (MMT):** ${mmtHourStr}\n` +
      `**Most active day:** ${dayName}\n` +
      `**Last updated:** ${pattern.lastDerivedAt?.toLocaleDateString() || 'Never'}\n\n` +
      `_Based on your activity in the past 7 days_`
    );
  }

  @Cron(CronExpression.EVERY_WEEK)
  async deriveAll() {
    this.logger.log('Deriving reading patterns for all users...');
    try {
      const users = await this.usersService.findAll();
      for (const user of users) {
        try {
          await this.derive(user);
        } catch (error) {
          this.logger.error(
            `Error deriving pattern for user ${user.telegramId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      this.logger.log('Reading pattern derivation completed');
    } catch (error) {
      this.logger.error(
        `Failed to derive reading patterns: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
