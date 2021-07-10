import { BrowserEmittedEvents, HTTPRequest, Page } from 'puppeteer';
import randomUserAgent from 'random-useragent';
import preload from './preload';
import puppeteer from 'puppeteer';
import { ScrapingOptions, initPuppeteer } from '..';

export type AutomatedCallback<T> = (page: Page) => Promise<T>;

export interface BrowserNetworkOptions {
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
}

let queue = [];

export default async function automateBrowser<T>(
  options: ScrapingOptions,
  callback: AutomatedCallback<T>,
  network?: BrowserNetworkOptions,
) {
  const { proxy, debug = false, puppeteerInstance = { instance: 'default' } } = options;

  const args_proxy_server = proxy != null && `--proxy-server=${proxy.host}:${proxy.port}`;

  const puppeteer_args = [...initPuppeteer.args, args_proxy_server].filter((item) => Boolean(item)) as string[];

  try {
    const browser = await (async () => {
      switch (puppeteerInstance.instance) {
        case 'endpoint':
          return await puppeteer.connect({ browserWSEndpoint: puppeteerInstance.wsEndpoint });
        case 'default':
        default:
          return await puppeteer.launch(
            puppeteerInstance.launch
              ? {
                  ...puppeteerInstance.launch,
                  headless: !debug,
                  args: puppeteerInstance.launch.args
                    ? ([...puppeteerInstance.launch.args, args_proxy_server].filter((item) =>
                        Boolean(item),
                      ) as string[])
                    : ([args_proxy_server].filter((item) => Boolean(item)) as string[]),
                }
              : { ...initPuppeteer, headless: !debug, args: puppeteer_args },
          );
        case 'custom':
          return puppeteerInstance.browser;
      }
    })();

    const page = await (async () => {
      switch (puppeteerInstance.instance) {
        case 'default':
          return (await browser.pages())[0];
        case 'custom':
        default:
          return await browser.newPage();
      }
    })();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluateOnNewDocument(preload);
    await page.setRequestInterception(true);
    page.on('request', (request) => {
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
    return await callback(page).finally(async () => {
      switch (puppeteerInstance.instance) {
        case 'default':
          await Promise.all((await browser.pages()).map((page) => page.close()));
          await browser.close();
          break;
        case 'endpoint':
          await page.close();
          browser.disconnect();
          break;
        case 'custom':
          try {
            await page.close();
          } finally {
            if ((await browser.pages()).length <= 1 && puppeteerInstance.options?.closeAfterOperation)
              await browser.close();
          }
          break;
      }
    });
  } catch (e) {
    throw Error(e);
  }
}
