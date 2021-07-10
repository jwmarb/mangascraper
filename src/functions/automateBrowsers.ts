import { BrowserEmittedEvents, Page } from 'puppeteer';
import randomUserAgent from 'random-useragent';
import preload from './preload';
import puppeteer from 'puppeteer';
import { initPuppeteer, ScrapingOptions } from '..';
import { AutomatedCallback, BrowserNetworkOptions } from './automateBrowser';

type Instances<T> = {
  network?: BrowserNetworkOptions;
  callback: AutomatedCallback<T>;
};

export default async function automateBrowsers(options: ScrapingOptions, instances: Instances<any>[]): Promise<any> {
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

    return Promise.all(
      instances.map(async ({ network, callback }, index) => {
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

        return callback(page).finally(async () => {
          switch (puppeteerInstance.instance) {
            case 'default':
              await page.close();
              break;
            case 'endpoint':
              await page.close();
              break;
            case 'custom':
              if (puppeteerInstance.options?.closeAfterOperation) await page.close();
              else if ((await browser.pages()).length > 1) await page.close();
          }
        });
      }),
    ).finally(async () => {
      switch (puppeteerInstance.instance) {
        case 'default':
          await Promise.all((await browser.pages()).map((page) => page.close()));
          await browser.close();
          break;
        case 'endpoint':
          browser.disconnect();
          break;
        case 'custom':
          if ((await browser.pages()).length <= 1 && puppeteerInstance.options?.closeAfterOperation) {
            await Promise.all((await browser.pages()).map((page) => page.close()));
            await browser.close();
          }
          break;
      }
    });
  } catch (e) {
    throw Error(e);
  }
}
