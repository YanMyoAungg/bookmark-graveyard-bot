import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { UsersService } from './users.service';
import { LinksService } from './links.service';
import { TitleScraperService } from './title-scraper.service';
import { UserSettingsService } from './user-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Link, UserSettings])],
  providers: [
    UsersService,
    LinksService,
    TitleScraperService,
    UserSettingsService,
  ],
  exports: [
    UsersService,
    LinksService,
    TitleScraperService,
    UserSettingsService,
  ],
})
export class BookmarksModule {}
