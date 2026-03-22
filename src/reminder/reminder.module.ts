import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { ReminderService } from './reminder.service';

@Module({
  imports: [TelegrafModule, BookmarksModule],
  providers: [ReminderService],
})
export class ReminderModule {}
