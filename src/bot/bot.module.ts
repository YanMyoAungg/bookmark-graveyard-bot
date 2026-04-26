import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { BotService } from './bot.service';
import { StartCommand } from './commands/start.command';
import { HelpCommand } from './commands/help.command';
import { ListCommand } from './commands/list.command';
import { ReadDeleteCommand } from './commands/read-delete.command';
import { SettingsCommand } from './commands/settings.command';
import { DeduplicateCommand } from './commands/deduplicate.command';
import { SupportCommand } from './commands/support.command';
import { TagsCommand } from './commands/tags.command';
import { LinksTagCommand } from './commands/links-tag.command';
import { StatsCommand } from './commands/stats.command';
import { TrendingCommand } from './commands/trending.command';
import { MarkReadAction } from './actions/mark-read.action';
import { DeleteAction } from './actions/delete.action';
import { SettingsAction } from './actions/settings.action';
import { TextHandler } from './text-handler';
import { BotCommandsService } from './bot-commands.service';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') || '',
      }),
    }),
    BookmarksModule,
  ],
  providers: [
    BotService,
    StartCommand,
    HelpCommand,
    ListCommand,
    ReadDeleteCommand,
    SettingsCommand,
    DeduplicateCommand,
    SupportCommand,
    TagsCommand,
    LinksTagCommand,
    StatsCommand,
    TrendingCommand,
    MarkReadAction,
    DeleteAction,
    SettingsAction,
    TextHandler,
    BotCommandsService,
  ],
  exports: [BotService],
})
export class BotModule {}
