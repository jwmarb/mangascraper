import puppeteer, { BrowserEmittedEvents, HTTPRequest, Page } from 'puppeteer-core';
import randomUserAgent from 'random-useragent';
import preload from './preload';
import { ScrapingOptions } from '..';

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
  const { debug = false, puppeteerInstance } = options;

  try {
    const browser = await (async () => {
      switch (puppeteerInstance.instance) {
        case 'endpoint':
          return await puppeteer.connect({ browserWSEndpoint: puppeteerInstance.wsEndpoint });
        case 'custom':
        default:
          return puppeteerInstance.browser;
      }
    })();

    const page = await (async () => {
      switch (puppeteerInstance.instance) {
        case 'custom':
        default:
          return browser.newPage();
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
