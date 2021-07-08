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

export default async function automateBrowser<T>(
  options: ScrapingOptions,
  callback: AutomatedCallback<T>,
  network?: BrowserNetworkOptions,
) {
  const { proxy, debug = false, puppeteerInstance = { instance: 'default' } } = options;

  const args_proxy_server = typeof proxy !== 'undefined' && `--proxy-server=${proxy.host}:${proxy.port}`;

  const puppeteer_args = [...initPuppeteer.args, args_proxy_server].filter((item) => Boolean(item)) as string[];

  try {
    const browser =
      puppeteerInstance.instance === 'default'
        ? await puppeteer.launch(
            puppeteerInstance.launch
              ? puppeteerInstance.launch
              : { ...initPuppeteer, headless: !debug, args: puppeteer_args },
          )
        : await puppeteer.connect({ browserWSEndpoint: puppeteerInstance.wsEndpoint });
    const page = (await browser.pages())[0];
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
    return await callback(page).finally(async () => {
      if (puppeteerInstance.instance === 'default') await browser.close();
      else browser.disconnect();
    });
  } catch (e) {
    throw Error(e);
  }
}
