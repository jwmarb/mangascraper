import { ScrapingOptions } from '..';
import automateBrowser from '../functions/automateBrowser';
import jquery from 'jquery';

type WindowJquery = typeof window & { $: typeof jquery };

export default class MangaSee {
  private options: ScrapingOptions = {};

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  public async search(query: string) {
    return await automateBrowser(this.options, async (page) => {
      await page.goto('https://mangasee123.com/search/', { waitUntil: 'networkidle0' });
      await page.addScriptTag({ path: require.resolve('jquery') });
      const titles = await page.evaluate(() => {
        const { $ } = window as WindowJquery;
        const eval_titles: string[] = [];
        $('a.SeriesName').each((_, el) => {
          const title = $(el).text();
          eval_titles.push(title.trim());
        });

        return eval_titles;
      });
      return titles;
    });
  }
}
