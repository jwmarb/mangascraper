import cheerio, { CheerioAPI } from 'cheerio';
import axios from 'axios';
import { ScrapingOptions } from '..';
import puppeteer, { Page } from 'puppeteer';

type ScrapeMethod = 'normal' | 'semi-auto';

export default async function readHtml(
  url: string,
  options: ScrapingOptions = {},
  method: ScrapeMethod = 'normal',
): Promise<CheerioAPI> {
  const { proxy, debug = false } = options;

  switch (method) {
    case 'normal':
    default:
      try {
        const { data } = await axios.get(url, { proxy });
        return cheerio.load(data);
      } catch (e) {
        throw Error(e);
      }

    case 'semi-auto': {
      const browser = await puppeteer.launch({ headless: debug });
      const page = await browser.newPage();
      try {
        const { data } = await axios.get(url, { proxy });
        return cheerio.load(data);
      } catch {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const html = await page.evaluate(() => document.querySelector('*'));
        return cheerio.load(html);
      } finally {
        await browser.close();
      }
    }
  }
}
