## Install

### npm

```sh
npm install @specify_/mangascraper
```

This installs the [`mangascraper`]("https://github.com/EGGaming/mangascraper") package which scrapes manga from the following sources:

| Source                                      | Supported? | Notes                       |
| ------------------------------------------- | ---------- | --------------------------- |
| [Kissmanga]("https://kissmanga.org")        | ❌         | Not enough information      |
| [Mangafreak]("https://w11.mangafreak.net/") | ❌         | Cannot GET request          |
| [Mangahasu]("https://mangahasu.se/")        | ✔️         |                             |
| [Mangakakalot]("https://mangakakalot.com/") | ✔️         |                             |
| [Manganato]("https://manganato.com/")       | ✔️         |                             |
| [Mangaparkv2]("https://v2.mangapark.net")   | ❌         | Cloudflare is a hassle      |
| [Mangasee]("https://mangasee123.com/")      | ✔️         | Uses puppeteer              |
| [Readmng]("https://www.readmng.com/")       | ❌         | Requires browser automation |

I will be looking forward to adding more sources to scrape from.

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

## Configuring with puppeteer

If you already have

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
