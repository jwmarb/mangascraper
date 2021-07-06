import { ScrapingOptions } from '..';
import automateBrowser from '../functions/automateBrowser';

export default class MangaSee {
  private options: ScrapingOptions = {};

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  public async search(query: string) {
    return await automateBrowser(this.options, async (page) => {
      await page.goto('https://mangasee123.com/search/', { waitUntil: 'networkidle2' });
      const html = await page.evaluate(() => document.querySelector('*')?.outerHTML);
      return html;
    });
  }
}
