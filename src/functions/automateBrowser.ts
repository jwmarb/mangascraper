import { Page } from 'puppeteer';

import puppeteer from 'puppeteer';
import { AutomatedCallback, ScrapingOptions } from '..';

export default async function automateBrowser<T>(options: ScrapingOptions, callback: AutomatedCallback<T>): Promise<T> {
  const { proxy, debug = false } = options;

  const args_proxy_server = typeof proxy !== 'undefined' && `--proxy-server=${proxy.host}:${proxy.port}`;

  const puppeteer_args = [args_proxy_server].filter((item) => Boolean(item)) as string[];

  try {
    const browser = await puppeteer.launch({ headless: debug, args: puppeteer_args });
    const page = await browser.newPage();
    return await callback(page).finally(async () => await browser.close());
  } catch (e) {
    throw Error(e);
  }
}
