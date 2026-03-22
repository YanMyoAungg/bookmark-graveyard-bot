import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../entities/link.entity';
import { User } from '../entities/user.entity';
import { TitleScraperService } from './title-scraper.service';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link)
    private linksRepository: Repository<Link>,
    private readonly titleScraperService: TitleScraperService,
  ) {}

  async create(
    url: string,
    user: User,
    title?: string,
  ): Promise<{ link: Link; isNew: boolean }> {
    // Check if user already has this URL (case-insensitive, ignoring trailing slash)
    const existing = await this.findByUserAndUrl(user, url);
    if (existing) {
      return { link: existing, isNew: false };
    }

    // Fetch title if not provided
    let finalTitle = title;
    if (!finalTitle) {
      const fetchedTitle = await this.titleScraperService.fetchTitle(url);
      finalTitle = fetchedTitle || undefined;
    }

    const link = this.linksRepository.create({
      url,
      user,
      title: finalTitle,
      isRead: false,
    });
    const savedLink = await this.linksRepository.save(link);
    return { link: savedLink, isNew: true };
  }

  async findByUserAndUrl(user: User, url: string): Promise<Link | null> {
    // Normalize URL for comparison: lowercase, trim, remove trailing slash
    const normalizedUrl = url.toLowerCase().trim().replace(/\/$/, '');
    return this.linksRepository
      .createQueryBuilder('link')
      .where('link.userId = :userId', { userId: user.id })
      .andWhere('LOWER(TRIM(link.url)) = :url', { url: normalizedUrl })
      .getOne();
  }

  async findByUser(
    user: User,
    options?: { skip?: number; take?: number; unreadOnly?: boolean },
  ): Promise<Link[]> {
    const { skip = 0, take = 50, unreadOnly = false } = options || {};
    const query = this.linksRepository
      .createQueryBuilder('link')
      .where('link.userId = :userId', { userId: user.id })
      .orderBy('link.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (unreadOnly) {
      query.andWhere('link.isRead = false');
    }

    return query.getMany();
  }

  async findById(id: number): Promise<Link | null> {
    return this.linksRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async markAsRead(id: number): Promise<Link | null> {
    const link = await this.linksRepository.findOne({ where: { id } });
    if (!link) {
      return null;
    }
    link.isRead = true;
    return this.linksRepository.save(link);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.linksRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async getUnreadLinksForUser(user: User, limit: number): Promise<Link[]> {
    return this.linksRepository.find({
      where: {
        user: { id: user.id },
        isRead: false,
      },
      order: { createdAt: 'ASC' }, // oldest first
      take: limit,
    });
  }
}
