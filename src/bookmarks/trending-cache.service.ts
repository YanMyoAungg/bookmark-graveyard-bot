import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrendingCache } from '../entities/trending-cache.entity';
import { Link } from '../entities/link.entity';
import { UsersService } from './users.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TrendingCacheService {
  private readonly logger = new Logger(TrendingCacheService.name);

  constructor(
    @InjectRepository(TrendingCache)
    private trendingCacheRepository: Repository<TrendingCache>,
    @InjectRepository(Link)
    private linksRepository: Repository<Link>,
    private readonly usersService: UsersService,
    @InjectBot()
    private readonly bot: Telegraf,
  ) {}

  @Cron('30 3,13 * * *') // 03:30 and 13:30 UTC = 10:00 AM and 08:00 PM MMT
  async broadcastTrending() {
    this.logger.log('Broadcasting trending links to all users...');
    const trending = await this.getTrending();
    if (trending.length === 0) return;

    const lines = trending.map((item, i) => {
      const title = item.title || item.url;
      return `${i + 1}. [${title}](${item.url}) (${item.saveCount} saves)`;
    });

    const message =
      `🔥 *Trending Today*\n\n` +
      `${lines.join('\n\n')}\n\n` +
      `_Daily discovery from the Link Keeper community!_`;

    const users = await this.usersService.findAll();
    for (const user of users) {
      try {
        await this.bot.telegram.sendMessage(user.telegramId, message, {
          parse_mode: 'Markdown',
          link_preview_options: { is_disabled: true },
        });
        // Sleep briefly to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        this.logger.warn(
          `Failed to send trending to user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshTrending() {
    const period = 'weekly';
    this.logger.log(`Refreshing trending cache (${period})...`);

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      interface TrendingRaw {
        representativeId: string;
        url: string;
        title: string | null;
        count: string;
      }

      const trending = await this.linksRepository
        .createQueryBuilder('link')
        .leftJoin('link.user', 'user')
        .leftJoin('user.settings', 'settings')
        .select('MIN(link.id)', 'representativeId')
        .addSelect('link.url', 'url')
        .addSelect('link.title', 'title')
        .addSelect('COUNT(*)', 'count')
        .where('link.createdAt >= :since', { since: sevenDaysAgo })
        .andWhere('settings.isPrivate = :isPrivate', { isPrivate: false })
        .groupBy('link.url, link.title')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<TrendingRaw>();

      await this.trendingCacheRepository.delete({ period });

      for (const item of trending) {
        const representativeId = parseInt(item.representativeId, 10);
        if (isNaN(representativeId)) {
          continue;
        }

        const link = await this.linksRepository.findOne({
          where: { id: representativeId },
        });
        if (!link) continue;

        const cache = this.trendingCacheRepository.create({
          link,
          saveCount: parseInt(item.count, 10),
          period,
        });
        await this.trendingCacheRepository.save(cache);
      }

      this.logger.log(`Trending cache refreshed with ${trending.length} items`);
    } catch (error) {
      this.logger.error(
        `Failed to refresh trending cache: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getTrending(): Promise<
    { url: string; title: string | null; saveCount: number }[]
  > {
    const cached = await this.trendingCacheRepository.find({
      where: { period: 'weekly' },
      order: { saveCount: 'DESC' },
      relations: ['link'],
      take: 5,
    });

    return cached.map((c) => ({
      url: c.link.url,
      title: c.link.title || null,
      saveCount: c.saveCount,
    }));
  }
}
