import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { Tag } from '../entities/tag.entity';
import { LinkInteraction } from '../entities/link-interaction.entity';
import { ReadingPattern } from '../entities/reading-pattern.entity';
import { TrendingCache } from '../entities/trending-cache.entity';
import { UsersService } from './users.service';
import { LinksService } from './links.service';
import { TitleScraperService } from './title-scraper.service';
import { UserSettingsService } from './user-settings.service';
import { TagsService } from './tags.service';
import { LinkInteractionsService } from './link-interactions.service';
import { ReadingPatternService } from './reading-pattern.service';
import { TrendingCacheService } from './trending-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Link,
      UserSettings,
      Tag,
      LinkInteraction,
      ReadingPattern,
      TrendingCache,
    ]),
  ],
  providers: [
    UsersService,
    LinksService,
    TitleScraperService,
    UserSettingsService,
    TagsService,
    LinkInteractionsService,
    ReadingPatternService,
    TrendingCacheService,
  ],
  exports: [
    UsersService,
    LinksService,
    TitleScraperService,
    UserSettingsService,
    TagsService,
    LinkInteractionsService,
    ReadingPatternService,
    TrendingCacheService,
  ],
})
export class BookmarksModule {}
