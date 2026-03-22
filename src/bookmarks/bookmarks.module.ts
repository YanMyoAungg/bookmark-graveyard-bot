import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';
import { UsersService } from './users.service';
import { LinksService } from './links.service';
import { TitleScraperService } from './title-scraper.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Link])],
  providers: [UsersService, LinksService, TitleScraperService],
  exports: [UsersService, LinksService, TitleScraperService],
})
export class BookmarksModule {}
