import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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
        const synchronizeEnv = configService.get<string>('DB_SYNCHRONIZE');
        const synchronize =
          synchronizeEnv !== undefined
            ? synchronizeEnv === 'true'
            : configService.get<string>('NODE_ENV') !== 'production';

        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize,
          extra: {
            ssl: {
              rejectUnauthorized: false, // Required for cloud providers like Supabase/Neon/Aiven
            },
          },
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
