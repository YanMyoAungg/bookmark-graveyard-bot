import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';

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
  providers: [BotUpdate, BotService],
})
export class BotModule {}
