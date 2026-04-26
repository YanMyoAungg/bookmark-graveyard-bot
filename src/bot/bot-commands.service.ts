import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotCommandsService implements OnModuleInit {
  private readonly logger = new Logger(BotCommandsService.name);

  constructor(@InjectBot() private readonly bot: Telegraf) {}

  async onModuleInit() {
    try {
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show help' },
        { command: 'settings', description: 'Configure reminder settings' },
        { command: 'list', description: 'Show saved links' },
        { command: 'stats', description: 'Show bookmark stats' },
        { command: 'tags', description: 'List your tags' },
        { command: 'linkstag', description: 'Filter links by tag' },
        { command: 'read', description: 'Mark a link as read' },
        { command: 'delete', description: 'Delete a saved link' },
        { command: 'deduplicate', description: 'Remove duplicate links' },
        { command: 'trending', description: 'Show trending links' },
        { command: 'support', description: 'Get support information' },
      ]);

      this.logger.log('Telegram slash commands registered.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to register Telegram slash commands: ${message}`,
      );
    }
  }
}
