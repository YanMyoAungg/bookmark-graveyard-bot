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
      `Thanks for using Bookmark Graveyard! 🚀\n\n` +
        `If you find this tool useful and are looking for a developer for your next project, I'm currently available for hire! You can check out my portfolio/CV here:\n\n` +
        `🔗 [My Portfolio](https://drive.google.com/file/d/1NjPDU77feiiTgCA6ISbpzPg7qfhqneQZ/view)\n\n` +
        `Feel free to reach out to me for collaborations or job opportunities. Your interest means a lot! 🙏`,
      { parse_mode: 'Markdown' },
    );
  }
}
