[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[browser]: https://devdocs.io/puppeteer/index#class-browser
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[manganato]: https://manganato.com/
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[launchoptions]: https://pptr.dev/#?product=Puppeteer&version=v10.1.0&show=api-puppeteerlaunchoptions

## Table of Contents

- [Manganato(options)](#manganatooptions)
  - [`search(query, filters, callback)`](#manganatosearchquery-filters-callback)
  - [`getMangaMeta(url, callback)`](#manganatogetmangametaurl-callback)
  - [`getMangasFromGenre(genre, options, callback)`](#manganatogetmangasfromgenregenre-options-callback)
  - [`getPages(url, callback)`](#manganatogetpagesurl-callback)

---

## `Manganato(options)`

### Parameters

- `options` «[Object]»

  - `proxy` «?[Object]»

    - `host` «[String]» URL of proxy

    - `port` «[Number]» Port of proxy

  - `debug` «?[Boolean]» Defaults to `false`. If `true`, it will log network requests into console.

  - `puppeteerInstance` «[Object]»

    - `instance` «[String]» Accepts either `custom`, `endpoint`, or `default` or `default`

    - `wsEndpoint` «[String]» URL of endpoint. Only available if `instance` is `endpoint`

    - `launch` «[LaunchOptions]» Puppeteer launch options. Only available if `instance` is `default`

    - `browser` «[Browser]» Only available if `instance` is `custom`

    - `options` «?[Object]» Only available if `instance` is `custom`

      - `closeAfterOperation` «?[Boolean]» If `true`, closes the browser after an operation has been completed. Else, it will leave one page open and standby for oncoming operations.

---

### Methods

#### `manganato.search(query, filters, callback)`

Gets a list of manga that match the `query` from [Manganato]

##### Parameters:

- `query` «[String]|[Object]»

  - `keywords` «[String]» Must be either `author`, `title`, `alt_title`, or `everything`

  - `search` «[String]»

- `filters` «?[Object]»

  - `genres` «?[Object]»

    - `include` «?[Array]<[String]>»

    - `exclude` «?[Array]<[String]>»

  - `status` «?[String]»

  - `orderBy` «?[String]»

  - `page` «?[Number]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `authors` «[Array]<[String]>»

    - `coverImage` «[String]»

    - `updatedAt` «[Date]»

    - `views` «[String]»

##### Example

```js
await manganato.search({ keywords: 'author', search: 'Oda' }, { orderBy: 'most_views' });

[
  {
    title: 'One Piece',
    url: 'https://readmanganato.com/manga-aa951409',
    authors: [ 'Oda Eiichiro' ],
    coverImage: 'https://avt.mkklcdnv6temp.com/3/u/1-1583463814.jpg',
    updatedAt: 2021-03-12T07:00:00.000Z,
    views: '126,812,256'
  },
  {
    title: 'Komi-San Wa Komyushou Desu',
    url: 'https://readmanganato.com/manga-va953509',
    authors: [ 'Oda Tomohito' ],
    coverImage: 'https://avt.mkklcdnv6temp.com/25/s/2-1583466695.jpg',
    updatedAt: 2021-07-08T07:00:00.000Z,
    views: '106,575,387'
  },
  ...
]
```

---

#### `manganato.getMangaMeta(url, callback)`

Gets the metadata of the given manga url from [Manganato]

##### Parameters:

- `url` «[String]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[Object]»

      - `main` «[String]»

      - `alt` «[Array]<[String]>»

    - `coverImage` «[String]»

    - `authors` «[Array]<[String]>»

    - `status` «[String]»

    - `summary` «[String]»

    - `genres` «[Array]<[String]>»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

    - `updatedAt` «[Date]»

    - `views` «[String]»

    - `chapters` «[Array]<[Object]>»

      - «[Object]»

        - `name` «[String]»

        - `url` «[String]»

        - `uploadDate` «[Date]»

        - `views` «[String]»

##### Example

```js
await manganato.getMangaMeta('https://readmanganato.com/manga-va953509');

{
  title: {
    main: 'Komi-San Wa Komyushou Desu',
    alt: [
      '古見さんはコミュ症です。 (Japanese)',
      'Komi-san ha Komyusho Desu.',
      'Komi-san wa Komyushou Desu.',
      'Miss Komi is bad at Communication. (English)',
      'Komi Là Cô Nàng Ít Nói (Vietnamese - Tiếng Việt - TV)'
    ]
  },
  coverImage: 'https://avt.mkklcdnv6temp.com/25/s/2-1583466695.jpg',
  authors: [ 'Oda Tomohito' ],
  status: 'Ongoing',
  summary: "Komi-san is the beautiful and admirable girl that no-one can take their eyes off her. Almost the whole school sees her as the cold beauty out of their league, but Tadano Shigeo knows the truth: she's
just really bad at communicating with others. Komi-san, who wishes to fix this bad habit of hers, tries to improve it with the help of Tadano-kun.",
  genres: [ 'Comedy', 'Romance', 'School life', 'Shounen' ],
  rating: {
    sourceRating: 'MangaNato.com',
    voteCount: '9,867',
    rating_percentage: '98.00%',
    rating_stars: '4.9 / 5'
  },
  updatedAt: Invalid Date,
  views: '106,575,387',
  chapters: [
    {
      name: 'Chapter 313: Sleepover 2',
      url: 'https://readmanganato.com/manga-va953509/chapter-313',
      uploadDate: 2021-07-08T07:00:00.000Z,
      views: '115,143'
    },
    ...
  ]
}
```

---

#### `manganato.getMangasFromGenre(genre, options, callback)`

Gets a list of mangas according to the applied `filters`

##### Parameters:

- `genre` «[String]»

- `options` «?[Object]»

  - `age` «?[String]»

  - `status` «?[String]»

  - `page` «?[Number]»

- `callback` «?[Function] (error, data) => void»

  - error «[Error]»

  - data «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `authors` «[Array]<[String]>»

    - `updatedAt` «[Date]»

    - `views` «[String]»

    - `coverImage` «[String]»

##### Example

```js
await manganato.getMangasFromGenre('One shot');

[
  {
    title: 'Lady Baby',
    url: 'https://readmanganato.com/manga-dt981128',
    authors: [ 'Pingmin', 'Ju hyeon' ],
    updatedAt: 2021-07-11T07:00:00.000Z,
    views: '34,994,411',
    coverImage: 'https://avt.mkklcdnv6temp.com/3/s/18-1583497223.jpg'
  },
  ...
]
```

---

#### `manganato.getPages(url, callback)`

Gets a list of image URLs (aka pages) of a manga chapter from the `url`

##### Parameters:

- `url` «[String]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[String]>»

##### Returns:

- «[Array]<[String]>»

##### Example

```js
await manganato.getPages('https://readmanganato.com/manga-dr980474/chapter-0');

[
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/1.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/2.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/3.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/4.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/5.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/6.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/7.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/8.jpg',
  'https://s41.mkklcdnv6tempv3.com/mangakakalot/p1/pn918005/chapter_0_prologue/9.jpg',
];
```
