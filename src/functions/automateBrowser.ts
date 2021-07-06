import { Page } from 'puppeteer';
import randomUserAgent from 'random-useragent';

import puppeteer from 'puppeteer';
import { AutomatedCallback, ScrapingOptions } from '..';

export default async function automateBrowser<T>(options: ScrapingOptions, callback: AutomatedCallback<T>): Promise<T> {
  const { proxy, debug = false } = options;

  const args_proxy_server = typeof proxy !== 'undefined' && `--proxy-server=${proxy.host}:${proxy.port}`;

  const puppeteer_args = [
    args_proxy_server,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    `--user-agent="${randomUserAgent.getRandom()}"`,
  ].filter((item) => Boolean(item)) as string[];

  try {
    const browser = await puppeteer.launch({ headless: !debug, args: puppeteer_args });
    return await callback(browser).finally(async () => await browser.close());
  } catch (e) {
    throw Error(e);
  }
}
