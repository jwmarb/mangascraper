import { ScrapingOptions } from '..';
import automateBrowser from '../functions/automateBrowser';

export default class MangaSee {
  private options: ScrapingOptions = {};

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  public async search(query: string): Promise<any> {
    return await automateBrowser(this.options, async (page) => {
      await page.goto('https://mangasee123.com/search/', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(5000);
    });
  }
}
