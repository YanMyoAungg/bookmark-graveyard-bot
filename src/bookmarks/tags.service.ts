import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { Link } from '../entities/link.entity';
import { User } from '../entities/user.entity';

const DOMAIN_TAG_MAP: Record<string, string> = {
  'youtube.com': 'video',
  'youtu.be': 'video',
  'github.com': 'code',
  'facebook.com': 'social',
  'twitter.com': 'social',
  'x.com': 'social',
  'reddit.com': 'social',
  'linkedin.com': 'social',
  'medium.com': 'article',
  'dev.to': 'article',
  'stackoverflow.com': 'code',
  'stackexchange.com': 'code',
  'wikipedia.org': 'article',
  'news.ycombinator.com': 'article',
};

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  private extractDomain(url: string): string | null {
    try {
      const parsed = new URL(url);
      let hostname = parsed.hostname.toLowerCase();
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      return hostname;
    } catch {
      return null;
    }
  }

  private mapDomainToTagName(domain: string): string | null {
    for (const [pattern, tagName] of Object.entries(DOMAIN_TAG_MAP)) {
      if (domain === pattern || domain.endsWith('.' + pattern)) {
        return tagName;
      }
    }
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return null;
  }

  async findOrCreate(user: User, name: string): Promise<Tag> {
    const normalizedName = name.toLowerCase().trim();
    let tag = await this.tagsRepository.findOne({
      where: { user: { id: user.id }, name: normalizedName },
    });
    if (!tag) {
      tag = this.tagsRepository.create({ user, name: normalizedName });
      tag = await this.tagsRepository.save(tag);
    }
    return tag;
  }

  async autoTagLink(user: User, link: Link, url: string): Promise<void> {
    const domain = this.extractDomain(url);
    if (!domain) return;

    const tagName = this.mapDomainToTagName(domain);
    if (!tagName) return;

    const tag = await this.findOrCreate(user, tagName);

    const currentTags = await this.tagsRepository
      .createQueryBuilder('tag')
      .innerJoin('tag.links', 'link', 'link.id = :linkId', { linkId: link.id })
      .where('tag.id = :tagId', { tagId: tag.id })
      .getOne();

    if (currentTags) return;

    await this.tagsRepository
      .createQueryBuilder()
      .relation(Tag, 'links')
      .of(tag)
      .add(link);

    this.logger.log(`Auto-tagged link ${link.id} with tag '${tagName}'`);
  }

  async getTagsWithCounts(
    user: User,
  ): Promise<{ name: string; count: number }[]> {
    interface TagCountRaw {
      name: string;
      count: string;
    }

    const tags = await this.tagsRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.links', 'link')
      .where('tag.userId = :userId', { userId: user.id })
      .groupBy('tag.id, tag.name')
      .select('tag.name', 'name')
      .addSelect('COUNT(link.id)', 'count')
      .orderBy('count', 'DESC')
      .getRawMany<TagCountRaw>();

    return tags.map((t) => ({ name: t.name, count: parseInt(t.count, 10) }));
  }

  async findLinksByTag(user: User, tagName: string): Promise<Link[]> {
    const normalizedName = tagName.toLowerCase().trim();
    const tag = await this.tagsRepository.findOne({
      where: { user: { id: user.id }, name: normalizedName },
      relations: ['links'],
    });
    if (!tag) return [];
    return tag.links || [];
  }
}
