import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class TitleScraperService {
  private readonly logger = new Logger(TitleScraperService.name);

  async fetchTitle(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        timeout: 5000, // 5 second timeout
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; BookmarkGraveyardBot/1.0; +https://github.com/YanMyoAungg/bookmark-graveyard-bot)',
        },
      });

      const $ = cheerio.load(response.data as string);
      const title = $('title').text().trim();

      if (!title) {
        return null;
      }

      // Clean up title - remove extra whitespace, newlines
      const cleanedTitle = title.replace(/\s+/g, ' ').trim();

      // Limit title length for display
      if (cleanedTitle.length > 200) {
        return cleanedTitle.substring(0, 197) + '...';
      }

      return cleanedTitle;
    } catch (error) {
      const err = error as AxiosError | Error;
      this.logger.warn(`Failed to fetch title for ${url}: ${err.message}`);
      return null;
    }
  }
}
