[![npm package](https://img.shields.io/npm/v/@specify_/mangascraper)](https://www.npmjs.com/package/@specify_/mangascraper) [![license](https://img.shields.io/npm/l/@specify_/mangascraper)](https://github.com/EGGaming/mangascraper/blob/main/LICENSE)

Mangascraper is a package used to scrape mangas. It is a solution to retrieving mangas that do not offer an API. Mangascraper can run either **asynchronously**, returning a `Promise`, or **synchronously** if a `callback` function is provided.

---

#### Table of Contents

1. [Installation](#installation)
   - [npm](#npm)
2. [Sources](#manga-sources)
3. [Usage](#usage)
4. [Configuring puppeteer](#configuring-puppeteer)
   - [Connecting to an endpoint](#connecting-to-an-endpoint)
   - [Using an existing puppeteer package](#using-an-existing-browser-installation)
   - [Overriding mangascraper's puppeteer launch arguments](#overriding-mangascrapers-puppeteer-launch-arguments)
5. [Examples](#examples)
6. [API Reference](#api-reference)
7. [License](#license)

---

## Installation

### npm

```sh
npm install @specify_/mangascraper
```

---

## Sources

Currently, mangascraper **supports 5 sources**, but will support more in the future.

| Source                                    | Supported? | Uses **puppeteer**? | Uses **axios**? |
| ----------------------------------------- | ---------- | ------------------- | --------------- |
| [Mangakakalot](https://mangakakalot.com/) | ✔️         | ---                 | ✔️              |
| [Manganato](https://manganato.com/)       | ✔️         | ---                 | ✔️              |
| [Mangahasu](https://mangahasu.se/)        | ✔️         | ---                 | ✔️              |
| [Mangaparkv2](https://v2.mangapark.net)   | ✔️         | ✔️                  | ❌              |
| [Mangasee](https://mangasee123.com/)      | ✔️         | ✔️                  | ❌              |
| [Readmng](https://www.readmng.com/)       | ✔️         | ✔️                  | ✔️              |
| [Kissmanga](https://kissmanga.org)        | ❌         | ---                 | ---             |
| [Mangafreak](https://w11.mangafreak.net/) | ❌         | ---                 | ---             |

If a supported source uses [axios](https://github.com/axios/axios), mangascraper will try to use axios as much as possible to save computer resources. If the network request is blocked by Cloudflare, mangascraper **will resort to using puppeteer**.

If a supported source uses both [axios](https://github.com/axios/axios) and [puppeteer](https://github.com/puppeteer/puppeteer), it means one or more methods use either. For example, `Readmng` uses puppeteer for `search()`, but uses axios for `getMangaMeta()` and `getPages`

---

## Usage

To start using the package, import a class such as `Mangakakalot` from the package and use the methods to get mangas from that source.

Here's an example:

```js
import { Manganato } from '@specify_/mangascraper';

const manganato = new Manganato();

(async () => {
  const mangas = await manganato.search('One Piece');
  const meta = await manganato.getMangaMeta(mangas[0].url);
  console.log(meta.chapters);
})();
```

which outputs...

```js
[
  {
    name: 'Chapter 1007',
    url: 'https://readmanganato.com/manga-aa951409/chapter-1007',
    views: '730,899',
    uploadDate: 2021-03-12T07:00:00.000Z
  },
  {
    name: 'Chapter 1006',
    url: 'https://readmanganato.com/manga-aa951409/chapter-1006',
    views: '364,964',
    uploadDate: 2021-03-05T07:00:00.000Z
  },
  ... and more items
]
```

---

## Configuring puppeteer

### Connecting to an endpoint

If you already have an existing [puppeteer](https://github.com/puppeteer/puppeteer) endpoint, mangascraper can connect to that endpoint instead and perform faster concurrent operations.

Mangascraper also includes its own puppeteer launch arguments, and it is **recommended to use them** for scraping to go smoothly.

```js
import puppeteer from 'puppeteer';
import { initPuppeteer, MangaSee } from '@specify_/mangascraper';

(async () => {
  const browser = await puppeteer.launch({ ...initPuppeteer });
  const endpoint = browser.wsEndpoint();
  browser.disconnect();

  const mangasee = new MangaSee({ puppeteerInstance: { instance: 'endpoint', wsEndpoint: endpoint } });

  const mangas = await mangasee.search('Haikyu!');
})();
```

Since you are using your own puppeteer package, mangascraper cannot make any modificatins to the browser such as including a proxy.

```js
const browser = await puppeteer.launch();
const mangapark = new MangaPark({
  proxy: { host: '127.0.0.1', port: 8080 },
  puppeteerInstance: { instance: 'custom', browser },
}); // ❌ Mangascraper cannot include proxy

const browser = await puppeteer.launch({ args: ['--proxy-server=127.0.0.1:8080'] });
const mangapark = new MangaPark({ puppeteerInstance: { instance: 'custom', browser } }); // ✔️ Our own browser instance will launch with a proxy
```

Because mangascraper is connecting to an existing endpoint, you must do all your browser arguments outside of mangascraper. See [this](#using-an-existing-puppeteer-package) for more on this.

### Overriding mangascraper's puppeteer launch arguments

If you want to **override the launch arguments** mangascraper uses, you can add this to any manga class such as MangaSee as long as you are using the default instance. Any other instance will require you to implement your own or inherit mangascraper's puppeteer options with `initPuppeteer`

```js
const mangasee = new MangaSee({ puppeteerInstance: { instance: 'default', launch: { ...myCustomLaunchOptions } } });
```

If you want to include a proxy, mangascraper will automatically put it into the launch arguments.

```js
const manganato = new Mangahasu({
  proxy: { host: 'proxy_host', port: 8080 },
  puppeteerInstance: { instance: 'default' },
});
```

### Using an existing puppeteer package

By using an existing puppeteer package in your app, this will enable mangascraper to use one browser instead of opening new browsers per operation. In addition, mangascraper will be able to scrape manga **concurrently**. With this approach, **resources will be less intensive on chromium**, and it can save you a lot of time if you are handling a lot of scraping operations. This is the best approach if you do not want to connect to an existing endpoint.

However, you must have [puppeteer](https://github.com/puppeteer/puppeteer) already installed.

This is the most basic setup:

```js
import puppeteer from 'puppeteer';
import { MangaPark, initPuppeteer } from '@specify_/mangascraper';

(async () => {
  const browser = await puppeteer.launch(initPuppeteer);
  const mangapark = new MangaPark({ puppeteerInstance: { instance: 'custom', browser } });
})();
```

Since you are using your own puppeteer package, mangascraper cannot add any modifications to the browser such as including a proxy.

```js
const browser = await puppeteer.launch();
const mangapark = new MangaPark({
  proxy: { host: '127.0.0.1', port: 8080 },
  puppeteerInstance: { instance: 'custom', browser },
}); // ❌ Mangascraper cannot include a proxy

const browser = await puppeteer.launch({ args: ['--proxy-server=127.0.0.1:8080'] });
const mangapark = new MangaPark({ puppeteerInstance: { instance: 'custom', browser } }); // ✔️ Our own browser instance will launch with a proxy
```

By default, mangascraper does not close the browser after the end of operation. If by any means you want to close the browser after an operation has finished. You can add the following to `puppeteerInstance`

```js
puppeteerInstance: {
  instance: 'custom',
  browser: browser,
  options: {
    closeAfterOperation: true // After an operation is finished, close the browser
  }
}
```

However, this will prevent mangascraper from proceeding to another operation after one is finished such as this example:

```js
const mangapark = new MangaPark({ puppeteerInstance: 'custom', browser, options: { closeAfterOperation: true } });
await mangapark
  .search('Naruto', { orderBy: 'latest_updates' })
  .then(async (mangas) => await Promise.all(mangas.map((manga) => mangapark.getMangaMeta(manga.url)))); // ❌ Browser will close after gathering results of mangas that match the title Naruto and will not gather metadata from each source.
```

---

## Examples

<details>

<summary><strong>Running asynchronously</strong></summary>

```js
const mangas = await mangahasu.search('Fairytail');
console.log(mangas);
```

</details>

<details>

<summary><strong>Running synchronously</strong></summary>

```js
mangahasu.search('Fairytail', null, (err, mangas) => {
  if (err) return console.error(err);
  console.log(mangas);
});
```

</details>

<details>

<summary><strong>Mangakakalot</strong></summary>

Get a list of manga that match the title **Black Clover**

```js
import { Mangakakalot } from '@specify_/mangascraper';

const mangakakalot = new Mangakakalot();

mangakakalot.search('Black Clover', function (err, mangas) {
  console.log(mangas);
});
```

Get a list of manga from the **Isekai** genre

```js
import { Mangakakalot } from '@specify_/mangascraper';

const mangakakalot = new Mangakakalot();

mangakakalot.getMangas({ genre: 'Isekai' }, function (err, mangas) {
  console.log(mangas);
});
```

Get the metadata of the **Jaryuu Tensei** manga

```js
import { Mangakakalot } from '@specify_/mangascraper';

const mangakakalot = new Mangakakalot();

mangakakalot.getMangaMeta('https://mangakakalot.com/read-qt9nz158504844280', function (err, meta) {
  console.log(meta);
});
```

</details>

<details>

<summary><strong>Manganato</strong></summary>

Get a list of manga that match the title **Naruto**

```js
import { MangaNato } from '@specify_/mangascraper';

const manganato = new Manganato();

manganato.search('Naruto', null, function (err, mangas) {
  console.log(mangas);
});
```

Get a list of manga from the **Romance** genre that do not have the **Drama** genre

```js
import { MangaNato } from '@specify_/mangascraper';

const manganato = new Manganato();

manganato.search(null, { genre: { include: ['Romance'], exclude: ['Drama'] } }, function (err, mangas) {
  console.log(mangas);
});
```

Get the metadata of the **Solo Leveling** manhwa

```js
import { MangaNato } from '@specify_/mangascraper';

const manganato = new Manganato();

manganato.getMangaMeta('https://readmanganato.com/manga-dr980474', function (err, meta) {
  console.log(meta);
});
```

Simple search for manga that match the genre, which uses less compute power compared to `getMangas()`

```js
import { MangaNato } from '@specify_/mangascraper';

const manganato = new MangaNato();

manganato.getMangasFromGenre('Comedy', {}, (err, mangas) => {
  console.log(mangas);
});
```

</details>

<details>

<summary><strong>Mangahasu</strong></summary>

Get a list of manga

```js
import { Mangahasu } from '@specify_/mangascraper';

const mangahasu = new Mangahasu();

mangahasu.search(null, null, (err, mangas) => {
  console.log(mangas);
});
```

Get the metadata of **Attack on Titan** manga

```js
import { Mangahasu } from '@specify_/mangascraper';

const mangahasu = new Mangahasu();

mangahasu.getMangaMeta('https://mangahasu.se/shingeki-no-kyojin-v6-p27286.html', (err, meta) => {
  console.log(meta);
});
```

Get pages of the chapter that is in the 1st index of the **Attack on Titan** chapters array.

```js
import { Mangahasu } from '@specify_/mangascraper';

const mangahasu = new Mangahasu();

(async () => {
  const mangas = await mangahasu.search('Attack on Titan');
  const meta = await mangahasu.getMangaMeta(mangas[0].url);
  const pages = await mangahasu.getPages(meta.chapters[0].url);

  console.log(pages);
})();
```

</details>

<details>
<summary><strong>MangaSee</strong></summary>

Get a list of manga that match the title **the melancholy of haruhi suzumiya**, and as well open puppeteer in headful mode (useful for debugging);

```js
import { MangaSee } from '@specify_/mangascraper';

const mangasee = new MangaSee({ debug: true }); // Opens puppeteer in headful mode

(async () => {
  const mangas = await mangasee.search('the melancholy of haruhi suzumiya');
  console.log(mangas);
})();
```

Get all mangas from the MangaSee directory.

```js
import { MangaSee } from '@specify_/mangascraper';

const mangasee = new MangaSee();

(async () => {
  const mangas = await mangasee.directory();
  console.log(mangas);
})();
```

Get the metadata of the **Berserk** manga

```js
import { MangaSee } from '@specify_/mangascraper';

const mangasee = new MangaSee();

(async () => {
  const berserk = await mangasee.getMangaMeta('https://mangasee123.com/manga/Berserk');
  console.log(berserk);
})();
```

Get the Chapter 363 pages of the **Berserk** manga

```js
import { MangaSee } from '@specify_/mangascraper';

const mangasee = new MangaSee();

(async () => {
  const chapter363 = await mangasee.getPages('https://mangasee123.com/read-online/Berserk-chapter-363-index-2.html');
  console.log(chapter363);
})();
```

</details>

<details>

<summary><strong>MangaPark v2</strong></summary>

Search for a manga that matches the title **noragami**.

Get the first result and get the meta

Then get the pages of the latest chapter

```js
import { MangaPark, initPuppeteer } from '@specify_/mangascraper';

(async () => {
  const browser = await puppeteer.launch(initPuppeteer);
  const mangapark = new MangaPark({ puppeteerInstance: { instance: 'custom', browser } });

  const mangas = await mangapark.search('noragami');
  const meta = await mangapark.getMangaMeta(mangas[0].url);
  const pages = await mangapark.getPages(meta.chapters[meta.chapters.recentlyUpdated][0].pages);

  console.log(pages);
})();
```

</details>

---

## API Reference

- [Mangakakalot](/docs/Mangakakalot.md)

- [Manganato](/docs/Manganato.md)

- [MangaSee](/docs/MangaSee.md)

- [Mangahasu](/docs/Mangahasu.md)

- [MangaPark](/docs/MangaParkv2.md)

---

## License

Distributed under [MIT © Joseph Marbella](https://github.com/EGGaming/mangascraper/blob/main/LICENSE)
