import cheerio, { CheerioAPI } from 'cheerio';
import axios from 'axios';
import puppeteer from 'puppeteer';
import randomUserAgent from 'random-useragent';
import { ScrapingOptions } from '..';
import automateBrowser, { BrowserNetworkOptions } from './automateBrowser';

export default async function readHtml(
  url: string,
  options: ScrapingOptions,
  network?: BrowserNetworkOptions,
  waitUntil?: puppeteer.PuppeteerLifeCycleEvent | puppeteer.PuppeteerLifeCycleEvent[],
): Promise<CheerioAPI> {
  const { proxy } = options;

  try {
    const { data } = await axios.get(url, {
      proxy,
      headers: {
        'User-Agent': randomUserAgent.getRandom((ua) => ua.osName === 'Windows' && ua.browserName === 'Chrome'),
      },
    });
    return cheerio.load(data);
  } catch (e) {
    try {
      const html = await automateBrowser(
        options,
        async (page) => {
          await page.goto(url, { waitUntil: waitUntil || 'load' });
          return await page.evaluate(() => document.body.innerHTML);
        },
        network || { resource: { method: 'unblock', type: ['document'] } },
      );
      return cheerio.load(html);
    } catch (e) {
      throw Error(e);
    }
  }
}
