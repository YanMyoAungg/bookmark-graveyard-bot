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
        const dbType = configService.get<string>('DB_TYPE', 'sqlite');

        // Determine synchronize setting: allow override via DB_SYNCHRONIZE, otherwise based on NODE_ENV
        const synchronizeEnv = configService.get<string>('DB_SYNCHRONIZE');
        const synchronize =
          synchronizeEnv !== undefined
            ? synchronizeEnv === 'true'
            : configService.get<string>('NODE_ENV') !== 'production';

        if (dbType === 'postgres') {
          // PostgreSQL configuration (for Render, Supabase, etc.)
          const databaseUrl = configService.get<string>('DATABASE_URL');
          if (!databaseUrl) {
            throw new Error('DATABASE_URL is required for PostgreSQL');
          }

          // Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
          const url = new URL(databaseUrl);
          return {
            type: 'postgres',
            host: url.hostname,
            port: parseInt(url.port || '5432', 10),
            username: url.username,
            password: url.password,
            database: url.pathname.slice(1), // remove leading '/'
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize,
            ssl: configService.get<string>('DB_SSL') !== 'false',
            extra: {
              ssl:
                configService.get<string>('DB_SSL') !== 'false'
                  ? {
                      rejectUnauthorized: false,
                    }
                  : undefined,
            },
          };
        }

        // Default SQLite configuration (for local development)
        return {
          type: 'sqlite',
          database: configService.get<string>('DB_DATABASE', 'bookmarks.db'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // Always synchronize for SQLite (local dev)
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
