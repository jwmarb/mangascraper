import preload from './preload';
import puppeteer from 'puppeteer';
import { initPuppeteer, ScrapingOptions } from '..';
import { AutomatedCallback, BrowserNetworkOptions } from './automateBrowser';

type Instances<T> = {
  network?: BrowserNetworkOptions;
  callback: AutomatedCallback<T>;
};

export default async function automateBrowsers(options: ScrapingOptions, instances: Instances<any>[]): Promise<any> {
  const { puppeteerInstance = { instance: 'default' } } = options;

  try {
    const browser = await (async () => {
      switch (puppeteerInstance.instance) {
        case 'default':
          return await puppeteer.launch({
            ...initPuppeteer,
            args: options.proxy
              ? [...initPuppeteer.args, `--proxy-server=${options.proxy.host}:${options.proxy.port}`]
              : initPuppeteer.args,
            headless: !options.debug,
            ...puppeteerInstance.launch,
          });
        case 'endpoint':
          return await puppeteer.connect({ browserWSEndpoint: puppeteerInstance.wsEndpoint });
        case 'custom':
        default:
          return puppeteerInstance.browser;
      }
    })();

    return Promise.all(
      instances.map(async ({ network, callback }, index) => {
        const page = await (async () => {
          switch (puppeteerInstance.instance) {
            case 'default':
              if (index === 0) return (await browser.pages())[0];
              return await browser.newPage();
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
            case 'endpoint':
            case 'default':
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
