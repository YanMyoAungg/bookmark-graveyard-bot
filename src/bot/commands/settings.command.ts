import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../bookmarks/users.service';
import { BotService } from '../bot.service';

@Update()
export class SettingsCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly botService: BotService,
  ) {}

  @Command('settings')
  async settings(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    const user = await this.usersService.findByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply('User not found. Please send /start first.');
      return;
    }
    await this.botService.showSettings(ctx, user);
  }
}
