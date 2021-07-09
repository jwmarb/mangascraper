[![npm package](https://img.shields.io/npm/v/@specify_/mangascraper)](https://www.npmjs.com/package/@specify_/mangascraper) [![license](https://img.shields.io/npm/l/@specify_/mangascraper)](https://github.com/EGGaming/mangascraper/blob/main/LICENSE)

Mangascraper is a package used to scrape mangas. It is a solution to retrieving mangas that do not offer an API.

---

#### Table of Contents

1. [Installation](#installation)
   - [npm](#npm)
2. [Sources](#manga-sources)
3. [Usage](#usage)
4. [Configuring puppeteer](#configuring-puppeteer)
5. [Examples](#examples)
   - [Mangakakalot](#mangakakalot)
   - [Manganato](#manganato)
   - [Mangahasu](#mangahasu)
   - [MangaSee](#mangasee)
   - [MangaParkv2](#mangapark)

---

## Installation

### npm

```sh
npm install @specify_/mangascraper
```

---

## Sources

Currently, mangascraper **supports 5 sources** as of right now, but will support more in the future.

| Source                                      | Supported? | Uses **puppeteer**? | Uses **axios**? |
| ------------------------------------------- | ---------- | ------------------- | --------------- |
| [Mangakakalot]("https://mangakakalot.com/") | ✔️         | ---                 | ✔️              |
| [Manganato]("https://manganato.com/")       | ✔️         | ---                 | ✔️              |
| [Mangahasu]("https://mangahasu.se/")        | ✔️         | ---                 | ✔️              |
| [Mangaparkv2]("https://v2.mangapark.net")   | ✔️         | ✔️                  | ❌              |
| [Mangasee]("https://mangasee123.com/")      | ✔️         | ✔️                  | ❌              |
| [Readmng]("https://www.readmng.com/")       | ❌         | ---                 | ---             |
| [Kissmanga]("https://kissmanga.org")        | ❌         | ---                 | ---             |
| [Mangafreak]("https://w11.mangafreak.net/") | ❌         | ---                 | ---             |

If a supported source uses [axios]("https://github.com/axios/axios"), mangascraper will try to use axios as much as possible to save computer resources. If the network request is blocked by Cloudflare, mangascraper **will resort to using puppeteer**.

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

If you already have an existing [puppeteer]("https://github.com/puppeteer/puppeteer") endpoint, mangascraper can connect to that endpoint instead.

Mangascraper also includes its own puppeteer launch arguments, and it is **recommended to use them** for scraping to go smoothly.

```js
import puppeteer from 'puppeteer';
import { initPuppeteer, MangaSee } from '@specify_/mangascraper';

(async () => {
  const browser = await puppeteer.launch({ ...initPuppeteer });
  const endpoint = browser.wsEndpoint();

  const mangasee = new MangaSee({ puppeteerInstance: { instance: 'server', wsEndpoint: endpoint } });

  const mangas = await mangasee.search('Haikyu!');
})();
```

However, if you want to **override the launch options**, you can add this to any manga class such as MangaSee.

```js
const mangasee = new MangaSee({ puppeteerInstance: { instance: 'default', launch: { ...myCustomLaunchOptions } } });
```

## Examples

### Mangakakalot

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

---

### MangaNato

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

---

### Mangahasu

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

---

### MangaSee

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
