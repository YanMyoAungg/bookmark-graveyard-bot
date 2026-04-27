import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from '../entities/link.entity';
import { User } from '../entities/user.entity';
import { TitleScraperService } from './title-scraper.service';

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(
    @InjectRepository(Link)
    private linksRepository: Repository<Link>,
    private readonly titleScraperService: TitleScraperService,
  ) {}

  private normalizeUrl(url: string): string {
    try {
      // Parse URL to handle encoding and components consistently
      const parsed = new URL(url);

      // Lowercase protocol and host
      parsed.protocol = parsed.protocol.toLowerCase();
      parsed.hostname = parsed.hostname.toLowerCase();

      // Remove default ports
      if (parsed.port === '80' && parsed.protocol === 'http:') {
        parsed.port = '';
      }
      if (parsed.port === '443' && parsed.protocol === 'https:') {
        parsed.port = '';
      }

      // Remove www. prefix (optional)
      if (parsed.hostname.startsWith('www.')) {
        parsed.hostname = parsed.hostname.substring(4);
      }

      // Remove trailing slash from pathname
      parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';

      // Sort query parameters? Not for now - different queries may mean different pages
      // But we can normalize by removing empty query values
      if (parsed.search) {
        const params = new URLSearchParams(parsed.search);
        // URLSearchParams automatically sorts? Not in spec but some impls do
        parsed.search = params.toString();
      }

      // Remove fragment
      parsed.hash = '';

      const normalized = parsed.toString();

      // Additional cleanup: trim whitespace
      return normalized.trim();
    } catch (error) {
      // If URL parsing fails, fall back to basic normalization
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to parse URL ${url}: ${errorMessage}`);
      return url.toLowerCase().trim().replace(/\/+$/, '');
    }
  }

  private basicNormalizeUrl(url: string): string {
    return url.toLowerCase().trim().replace(/\/+$/, '');
  }

  private async fetchAllLinksForUser(
    user: User,
    options?: { unreadOnly?: boolean; batchSize?: number },
  ): Promise<Link[]> {
    const unreadOnly = options?.unreadOnly ?? false;
    const batchSize = options?.batchSize ?? 200;
    let skip = 0;
    const allLinks: Link[] = [];

    while (true) {
      const batch = await this.findByUser(user, {
        skip,
        take: batchSize,
        unreadOnly,
      });
      if (batch.length === 0) {
        break;
      }

      allLinks.push(...batch);
      skip += batch.length;
    }

    return allLinks;
  }

  private readonly BANNED_DOMAINS = new Set([
    'bit.ly', // Often used for malicious redirects if unknown
    'tinyurl.com',
    'goo.gl',
    'ow.ly',
    't.co',
    // Add known malicious domains here
  ]);

  private isMalicious(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (this.BANNED_DOMAINS.has(hostname)) {
        return true;
      }
      // Check for suspicious patterns (malicious or adult content)
      const suspiciousPatterns = [
        /phishing/i,
        /malware/i,
        /scam/i,
        /porn/i,
        /sex/i,
        /xvid/i,
        /pornhub/i,
        /hentai/i,
        /nudity/i,
      ];
      if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
        return true;
      }
      return false;
    } catch {
      return true; // If we can't parse it, consider it unsafe
    }
  }

  async create(
    url: string,
    user: User,
    title?: string,
  ): Promise<{ link: Link; isNew: boolean; restored: boolean }> {
    // Check for malicious links
    if (this.isMalicious(url)) {
      throw new Error('MALICIOUS_LINK');
    }

    // Normalize the URL once at the very top of the create method
    const normalizedUrl = this.basicNormalizeUrl(url);
    this.logger.log(
      `Creating link for user ${user.id}: ${url} (normalized: ${normalizedUrl})`,
    );
    // Check if user already has this URL (case-insensitive, ignoring trailing slash)
    const existing = await this.findByUserAndUrl(user, normalizedUrl);
    if (existing) {
      this.logger.log(
        `Found existing link ${existing.id}, isRead: ${existing.isRead}`,
      );
      // If link exists and is marked as read, restore it (mark as unread)
      if (existing.isRead) {
        existing.isRead = false;

        // Optionally update title if missing and we can fetch one now
        if (!existing.title && !title) {
          const fetchedTitle =
            await this.titleScraperService.fetchTitle(normalizedUrl);
          if (fetchedTitle) {
            existing.title = fetchedTitle;
          }
        }

        const restoredLink = await this.linksRepository.save(existing);
        this.logger.log(
          `Restored link ${restoredLink.id} for user ${user.id} (marked as unread)`,
        );
        return { link: restoredLink, isNew: false, restored: true };
      }

      // Link exists and is already unread - throw error to prevent duplicate
      throw new Error('DUPLICATE_UNREAD_LINK');
    }

    // Fetch title if not provided
    let finalTitle = title;
    if (!finalTitle) {
      const fetchedTitle =
        await this.titleScraperService.fetchTitle(normalizedUrl);
      finalTitle = fetchedTitle || undefined;
    }

    const link = this.linksRepository.create({
      url: normalizedUrl,
      user,
      title: finalTitle,
      isRead: false,
    });
    const savedLink = await this.linksRepository.save(link);
    this.logger.log(`Created new link ${savedLink.id} for user ${user.id}`);
    return { link: savedLink, isNew: true, restored: false };
  }

  async findByUserAndUrl(user: User, url: string): Promise<Link | null> {
    // Normalize input URL with basic normalization (same as stored URLs)
    const normalizedInput = this.basicNormalizeUrl(url);

    // First try exact match on normalized URL (since we now store normalized URLs)
    const exactMatch = await this.linksRepository
      .createQueryBuilder('link')
      .where('link.userId = :userId', { userId: user.id })
      .andWhere('link.url = :url', { url: normalizedInput })
      .getOne();

    if (exactMatch) {
      this.logger.debug(
        `Found existing link via exact match: ${exactMatch.id}`,
      );
      return exactMatch;
    }

    // If exact match fails, try legacy normalization (LOWER(TRIM)) for backward compatibility
    const legacyMatch = await this.linksRepository
      .createQueryBuilder('link')
      .where('link.userId = :userId', { userId: user.id })
      .andWhere('LOWER(TRIM(link.url)) = :url', { url: normalizedInput })
      .getOne();

    if (legacyMatch) {
      this.logger.debug(
        `Found existing link via legacy normalization: ${legacyMatch.id}`,
      );
      return legacyMatch;
    }

    // If both fast queries fail, fetch all user links and compare with full normalization
    // (handles www, default ports, fragments, query parameter ordering, etc.)
    this.logger.debug(
      `Fast queries failed, performing full normalization check for: ${url}`,
    );
    const userLinks = await this.fetchAllLinksForUser(user, { batchSize: 200 });
    const fullyNormalizedInput = this.normalizeUrl(url);

    for (const link of userLinks) {
      const fullyNormalizedLinkUrl = this.normalizeUrl(link.url);
      if (fullyNormalizedLinkUrl === fullyNormalizedInput) {
        this.logger.debug(
          `Found existing link via full normalization: ${link.id} (normalized: ${fullyNormalizedLinkUrl})`,
        );
        return link;
      }
    }

    this.logger.debug(`No existing link found for: ${url}`);
    return null;
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

  async deduplicateForUser(user: User): Promise<number> {
    this.logger.log(`Starting deduplication for user ${user.id}`);
    const userLinks = await this.fetchAllLinksForUser(user, { batchSize: 200 });

    if (userLinks.length <= 1) {
      this.logger.log(
        `No duplicates possible for user ${user.id} (${userLinks.length} links)`,
      );
      return 0;
    }

    // Group links by normalized URL
    const groups = new Map<string, Link[]>();
    for (const link of userLinks) {
      const normalized = this.normalizeUrl(link.url);
      const group = groups.get(normalized) || [];
      group.push(link);
      groups.set(normalized, group);
    }

    let removedCount = 0;

    // Process each group
    for (const [normalizedUrl, links] of groups) {
      if (links.length <= 1) {
        continue; // No duplicates
      }

      this.logger.log(
        `Found ${links.length} duplicates for URL: ${normalizedUrl}`,
      );

      // Sort by createdAt (oldest first)
      links.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Keep the oldest link
      const keepLink = links[0];
      const deleteLinks = links.slice(1);

      // Merge data: if kept link is read but any deleted link is unread, keep as unread
      const hasUnread =
        deleteLinks.some((link) => !link.isRead) || !keepLink.isRead;
      if (hasUnread && keepLink.isRead) {
        keepLink.isRead = false;
        await this.linksRepository.save(keepLink);
        this.logger.log(
          `Marked kept link ${keepLink.id} as unread (had unread duplicates)`,
        );
      }

      // Merge title: if kept link has no title but a deleted link has title, use it
      if (!keepLink.title) {
        const titleLink = deleteLinks.find((link) => link.title);
        if (titleLink) {
          keepLink.title = titleLink.title;
          await this.linksRepository.save(keepLink);
          this.logger.log(
            `Updated title for kept link ${keepLink.id} from duplicate`,
          );
        }
      }

      // Delete duplicates
      for (const link of deleteLinks) {
        await this.linksRepository.delete(link.id);
        removedCount++;
        this.logger.log(`Deleted duplicate link ${link.id}`);
      }
    }

    this.logger.log(
      `Deduplication complete for user ${user.id}: removed ${removedCount} duplicates`,
    );
    return removedCount;
  }
}
