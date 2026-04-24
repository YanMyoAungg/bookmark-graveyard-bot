import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as sqlite3 from 'sqlite3';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { BotModule } from './bot/bot.module';
import { ReminderModule } from './reminder/reminder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Determine synchronize setting: allow override via DB_SYNCHRONIZE, otherwise based on NODE_ENV
        const synchronizeEnv = configService.get<string>('DB_SYNCHRONIZE');
        const synchronize =
          synchronizeEnv !== undefined
            ? synchronizeEnv === 'true'
            : configService.get<string>('NODE_ENV') !== 'production';

        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize,
            ssl: {
              rejectUnauthorized: false, // Required for cloud providers like Supabase/Neon
            },
          };
        }

        // SQLite configuration (for local dev)
        return {
          type: 'sqlite',
          driver: sqlite3,
          database: configService.get<string>('DB_PATH', 'database.sqlite'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize,
        };
      },
    }),
    ScheduleModule.forRoot(),
    BookmarksModule,
    BotModule,
    ReminderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
