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
        `This bot is open-source and developed with passion. If you'd like to collaborate, hire me, or just say hi, feel free to connect with me!\n\n` +
        `🔗 [GitHub Profile](https://github.com/YanMyoAungg)\n` +
        `🔗 [LinkedIn Profile](https://www.linkedin.com/in/yan-myo-aung-3111b830a?utm_source=share_via&utm_content=profile&utm_medium=member_ios)\n\n` +
        `Don't forget to star the repository if you like it! 🙏`,
      { parse_mode: 'Markdown' },
    );
  }
}
