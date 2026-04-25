import { Controller, Get, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  /**
   * Public health-check endpoint.
   * Returns 200 OK so load balancers / uptime monitors can verify the service is up.
   */
  @Get('healthz')
  health() {
    return { status: 'ok' };
  }

  /**
   * Self-ping cron job — runs every 14 minutes so the Render free-tier service
   * never crosses the 15-minute idle threshold and gets spun down.
   *
   * This is completely free: it runs inside the existing Node process with no
   * extra Render services or third-party accounts required.
   */
  @Cron('0 */14 * * * *') // every 14 minutes (seconds field included)
  async keepAlive() {
    const url = process.env.SERVICE_URL;
    if (!url) {
      // SERVICE_URL not set — skip silently so local dev isn't noisy
      return;
    }

    try {
      const res = await fetch(`${url}/healthz`);
      this.logger.log(`Keep-alive ping → ${res.status}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Keep-alive ping failed: ${message}`);
    }
  }
}
