import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrendingCache } from '../entities/trending-cache.entity';
import { Link } from '../entities/link.entity';

@Injectable()
export class TrendingCacheService {
  private readonly logger = new Logger(TrendingCacheService.name);

  constructor(
    @InjectRepository(TrendingCache)
    private trendingCacheRepository: Repository<TrendingCache>,
    @InjectRepository(Link)
    private linksRepository: Repository<Link>,
  ) {}

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
        .select('MIN(link.id)', 'representativeId')
        .addSelect('link.url', 'url')
        .addSelect('link.title', 'title')
        .addSelect('COUNT(*)', 'count')
        .where('link.createdAt >= :since', { since: sevenDaysAgo })
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
      take: 10,
    });

    return cached.map((c) => ({
      url: c.link.url,
      title: c.link.title || null,
      saveCount: c.saveCount,
    }));
  }
}
