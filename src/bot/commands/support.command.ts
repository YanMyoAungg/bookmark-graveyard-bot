import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class SupportCommand {
  @Command('support')
  async support(@Ctx() ctx: Context) {
    if (!ctx.from) {
      await ctx.reply('Unable to identify user.');
      return;
    }
    await ctx.reply(
      `If you find Bookmark Graveyard useful and want to support its development, you can donate via local payment methods:\n\n` +
        `**KPay**\n` +
        `Number: 09963530189\n` +
        `Name: Yan Myo Aung\n\n` +
        `**AYA Pay**\n` +
        `Number: 09963530189\n` +
        `Name: Yan Myo Aung\n\n` +
        `Your support helps keep this project free and open source for everyone. Thank you! 🙏`,
      { parse_mode: 'Markdown' },
    );
  }
}
