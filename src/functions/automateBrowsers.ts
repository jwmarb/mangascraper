import { BrowserEmittedEvents, Page } from 'puppeteer';
import randomUserAgent from 'random-useragent';
import preload from './preload';
import puppeteer from 'puppeteer';
import { AutomatedCallback, ScrapingOptions } from '..';

export default async function automateBrowsers(
  options: ScrapingOptions,
  instances: {
    network?: {
      domains?: {
        method: 'block' | 'unblock';
        value: string[];
      };
      resource?: {
        method: 'block' | 'unblock';
        type: (
          | 'document'
          | 'stylesheet'
          | 'image'
          | 'media'
          | 'font'
          | 'script'
          | 'texttrack'
          | 'xhr'
          | 'fetch'
          | 'eventsource'
          | 'websocket'
          | 'manifest'
          | 'signedexchange'
          | 'ping'
          | 'cspviolationreport'
          | 'preflight'
          | 'other'
        )[];
      };
    };
    callback: AutomatedCallback<any>;
  }[],
): Promise<any> {
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
    '--disable-gpu',
    `--user-agent=${randomUserAgent.getRandom((ua) => ua.osName === 'Windows' && ua.browserName === 'Chrome')}`,
  ].filter((item) => Boolean(item)) as string[];

  try {
    const browser = await puppeteer.launch({ headless: !debug, args: puppeteer_args, ignoreHTTPSErrors: true });
    const pages = await browser.pages();
    return Promise.all(
      instances.map(async ({ network, callback }, index) => {
        const page = pages[index] ? pages[index] : await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.evaluateOnNewDocument(preload);

        await page.setRequestInterception(true);
        await page.on('request', (request) => {
          if (network != null) {
            if (network.resource) {
              switch (network.resource.method) {
                case 'block':
                  if (network.resource.type.indexOf(request.resourceType()) !== -1) return request.abort();
                case 'unblock':
                  if (network.resource.type.indexOf(request.resourceType()) === -1) return request.abort();
              }
            }
            if (network.domains) {
              switch (network.domains.method) {
                case 'unblock':
                  if (!network.domains.value.some((url) => request.url().startsWith(url))) return request.abort();
                case 'block':
                  if (network.domains.value.some((url) => request.url().startsWith(url))) return request.abort();
              }
            }

            return request.continue();
          }
          request.continue();
        });

        return callback(page).finally(async () => {
          await page.close();
        });
      }),
    ).finally(async () => {
      const pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close()));
      await browser.close();
    });
  } catch (e) {
    throw Error(e);
  }
}
