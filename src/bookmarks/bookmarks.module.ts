import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Link } from '../entities/link.entity';
import { UsersService } from './users.service';
import { LinksService } from './links.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Link])],
  providers: [UsersService, LinksService],
  exports: [UsersService, LinksService],
})
export class BookmarksModule {}
