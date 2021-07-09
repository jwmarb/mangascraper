import cheerio, { CheerioAPI } from 'cheerio';
import axios from 'axios';
import { ScrapingOptions } from '..';
import puppeteer, { ElementHandle, Page } from 'puppeteer';
import jqueryImport from 'jquery';
import randomUserAgent from 'random-useragent';
import automateBrowser from './automateBrowser';

export default async function readHtml(url: string, options: ScrapingOptions): Promise<CheerioAPI> {
  const { proxy, debug = false } = options;

  if (debug) console.log(`Fetching HTML from ${url}`);
  try {
    const { data } = await axios.get(url, {
      proxy,
      headers: {
        'User-Agent': randomUserAgent.getRandom((ua) => ua.osName === 'Windows' && ua.browserName === 'Chrome'),
      },
    });
    if (debug) console.log(`Successfully retrieved html without any errors`);
    return cheerio.load(data);
  } catch (e) {
    if (debug) console.log(`Failed to fetch HTML from ${url}. Using puppeteer...`);
    try {
      const html = await automateBrowser(
        options,
        async (page) => {
          await page.goto(url, { waitUntil: 'load' });
          return await page.evaluate(() => document.body.innerHTML);
        },
        { resource: { method: 'unblock', type: ['document'] } },
      );
      if (debug) console.log('Successfully retrieved html after failed GET request');
      return cheerio.load(html);
    } catch (e) {
      throw Error(e);
    }
  }
}
