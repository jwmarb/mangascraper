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
    return await automateBrowser(this.options, async (browser) => {
      //   const page = await browser.newPage();
      //   await page.goto('https://mangasee123.com/directory/', { waitUntil: 'networkidle2' });
      //   await page.addScriptTag({ path: require.resolve('jquery') });
      //   const links = await page.evaluate(() => {
      //     const { $ } = window as WindowJquery;
      //     const links: string[] = [];
      //     $('a.ttip.ng-binding').each((_, el) => {
      //       const params = $(el).attr('href');
      //       if (typeof params !== 'undefined') links.push(params);
      //     });

      //     return links;
      //   });
      //   const chapters: Array<{ title: string; chapters: any }> = [];

      //     for (let i = 0; i < 6; i++) {
      //       const page = await browser.newPage();
      //       await page.goto(`https://mangasee123.com${links[i]}`, { waitUntil: 'domcontentloaded' });
      //       await page.addScriptTag({ path: require.resolve('jquery') });
      //       const titleChapters = await page.evaluate(() => {
      //         const { $: $$ } = window as WindowJquery;
      //         const title = $$('h1').text();
      //         const chapters = $$()
      //           .map((_, el) => {
      //             return $$.trim($$(el).text());
      //           })
      //           .get();
      //         return {
      //           title,
      //           chapters,
      //         };
      //       });
      //       chapters.push(titleChapters);
      //       await page.close();
      //     }
      //   return links;
      const page = await browser.newPage();

      await page.goto('https://mangasee123.com/directory/', { waitUntil: 'networkidle2' });
      const html = await page.evaluate(() => document.querySelector('*')?.outerHTML);

      return html;
    });
  }
}
