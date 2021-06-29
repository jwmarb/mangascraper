## Install

### npm

```sh
npm install @specify_/mangascraper
```

This installs the [`mangascraper`]("https://github.com/EGGaming/mangascraper") package which scrapes manga from the sources below (more will be added soon):

- [Mangakakalot]("https://mangakakalot.com/")
- [MangaNato]("http://manganato.com/")

## Usage

### Mangakakalot

Get a list of manga that match the title `Black Clover`

```js
import { Mangakakalot } from '@specify_/mangascraper';

const mangakakalot = new Mangakakalot();

mangakakalot.getMangasByTitle('Black Clover', function (err, mangas) {
  console.log(mangas);
});
```

Get a list of manga from the `Isekai` genre

```js
import { Mangakakalot } from '@specify_/mangascraper';

const mangakakalot = new Mangakakalot();

mangakakalot.getMangas({ genre: 'Isekai' }, function (err, mangas) {
  console.log(mangas);
});
```

Get the metadata of the `Jaryuu Tensei` manga

```js
import { Mangakakalot } from '@specify_/mangascraper';

const mangakakalot = new Mangakakalot();

mangakakalot.getMangaMeta('https://mangakakalot.com/read-qt9nz158504844280', function (err, meta) {
  console.log(meta);
});
```

---

### MangaNato

Get a list of manga that match the title `Naruto`

```js
import { MangaNato } from '@specify_/mangascraper';

const manganato = new Manganato();

manganato.getMangas('Naruto', null, function (err, mangas) {
  console.log(mangas);
});
```

Get a list of manga from the `Romance` genre that do not have the `Drama` genre

```js
import { MangaNato } from '@specify_/mangascraper';

const manganato = new Manganato();

manganato.getMangas(null, { genre: { include: ['Romance'], exclude: ['Drama'] } }, function (err, mangas) {
  console.log(mangas);
});
```

Get the metadata of the `Solo Leveling` manhwa

```js
import { MangaNato } from '@specify_/mangascraper';

const manganato = new Manganato();

manganato.getMangaMeta('https://readmanganato.com/manga-dr980474', function (err, meta) {
  console.log(meta);
});
```
