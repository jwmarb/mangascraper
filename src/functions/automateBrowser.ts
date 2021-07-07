import { BrowserEmittedEvents, Page } from 'puppeteer';
import randomUserAgent from 'random-useragent';
import preload from './preload';

import puppeteer from 'puppeteer';
import { AutomatedCallback, ScrapingOptions } from '..';

export default async function automateBrowser<T>(
  options: ScrapingOptions,
  callback: AutomatedCallback<T>,
  requestURLs?: string[],
) {
  const { proxy, debug = false } = options;

  const args_proxy_server = typeof proxy !== 'undefined' && `--proxy-server=${proxy.host}:${proxy.port}`;

  const puppeteer_args = [
    args_proxy_server,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-accelerated-2d-canvas',
    '--no-zygote',
    '--renderer-process-limit=1',
    '--no-first-run',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-dev-shm-usage',
    '--disable-infobars',
    '--lang=en-US,en',
    '--window-size=1920x1080',
    '--disable-extensions',
    `--user-agent=${randomUserAgent.getRandom((ua) => ua.osName === 'Windows' && ua.browserName === 'Chrome')}`,
  ].filter((item) => Boolean(item)) as string[];

  try {
    const browser = await puppeteer.launch({ headless: !debug, args: puppeteer_args, ignoreHTTPSErrors: true });
    const page = (await browser.pages())[0];
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluateOnNewDocument(preload);
    if (requestURLs != null) {
      await page.setRequestInterception(true);
      await page.on('request', (request) => {
        if (
          ['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1 ||
          !requestURLs.some((url) => request.url().startsWith(url))
        ) {
          request.abort();
        } else request.continue();
      });
    }
    return await callback(page).finally(async () => {
      const pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close()));
      await browser.close();
    });
  } catch (e) {
    throw Error(e);
  }
}
