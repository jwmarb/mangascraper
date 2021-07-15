[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[browser]: https://devdocs.io/puppeteer/index#class-browser
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[readmng]: https://www.readmng.com/
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[launchoptions]: https://pptr.dev/#?product=Puppeteer&version=v10.1.0&show=api-puppeteerlaunchoptions

## Table of Contents

- [ReadMng(options)](#readmngoptions)
  - [`search(query, filters, callback)`](#readmngquery-callback)
  - [`getMangaMeta(url, callback)`](#readmnggetmangametaurl-callback)
  - [`getPages(url, callback)`](#readmnggetpagesurl-callback)

---

## `ReadMng(options)`

### Parameters

- `options` «[Object]»

  - `proxy` «?[Object]»

    - `host` «[String]» URL of proxy

    - `port` «[Number]» Port of proxy

  - `debug` «?[Boolean]» Defaults to `false`. If `true`, it will log network requests into console.

  - `puppeteerInstance` «[Object]»

    - `instance` «[String]» Accepts either `custom`, `endpoint`, or `default`

    - `wsEndpoint` «[String]» URL of endpoint. Only available if `instance` is `endpoint`

    - `launch` «[LaunchOptions]» Puppeteer launch options. Only available if `instance` is `default`

    - `browser` «[Browser]» Only available if `instance` is `custom`

    - `options` «?[Object]» Only available if `instance` is `custom`

      - `closeAfterOperation` «?[Boolean]» If `true`, closes the browser after an operation has been completed. Else, it will leave one page open and standby for oncoming operations.

---

### Methods

#### `readmng.search(query, filters, callback)`

Gets a list of manga that match the `query` from [ReadMng]

##### Parameters:

- `query` «[String]|[Object]»

  - `title` «?[String]»

  - `author` «?[String]»

  - `artist` «?[String]»

- `filters` «?[Object]»

  - `genres` «?[Object]»

    - `include` «?[Array]<[String]>»

    - `exclude` «?[Array]<[String]>»

  - `status` «?[String]»

  - `type` «?[String]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `coverImage` «[Object]»

      - `url` «[String]»

      - `alt` «[String]»

    - `genres` «[Array]<[String]>»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

    - `type` «[String]»

    - `views` «[String]»

    - `status` «[String]»

##### Example

```js
await readmng.search({ title: 'the gamer' });

[
  {
    title: 'The Gamer',
    url: 'https://www.readmng.com/the-gamer',
    coverImage: {
      url: 'https://www.readmng.com/uploads/posters/thumb/1547203467.jpg',
      alt: 'The Gamer',
    },
    genres: ['Action', 'Fantasy', 'School Life', 'Shounen', 'Supernatural'],
    type: 'manhwa',
    views: '14,395,524',
    rating: {
      sourceRating: 'readMng.com',
      voteCount: '2,395',
      rating_percentage: '69.48%',
      rating_stars: '3.5 / 5',
    },
  },
];
```

---

#### `readmng.getMangaMeta(url, callback)`

Gets the metadata of the given manga url from [ReadMng]

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

    - `summary` «[String]»

    - `coverImage` «[Object]»

      - `url` «[String]»

      - `alt` «[String]»

    - `author` «[String]»

    - `artist` «?[String]»

    - `genres` «[Array]<[String]>»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

    - `type` «[String]»

    - `status` «?[String]»

    - `views` «[String]»

    - `chapters` «[Array]<[Object]>»

      - «[Object]»

        - `url` «[String]»

        - `name` «[String]»

        - `uploadWhen` «[String]» **Note:** ReadMng does not use timestamps

##### Example

```js
await readmng.getMangaMeta('https://v2.readmng.net/manga/maou-no-hajimekata-warau-yakan');

{
  title: { main: 'The Gamer', alt: [ '더 게이머' ] },
  coverImage: {
    url: 'https://www.readmng.com/uploads/posters/1547203467.jpg',
    alt: 'The Gamer'
  },
  author: 'Sung San Young',
  artist: 'Sang Ah',
  genres: [ 'Action', 'Fantasy', 'School Life', 'Shounen', 'Supernatural' ],
  status: undefined,
  summary: 'What would happen if your world suddenly turned into a game?If you could level up and raise your stats?An adventure of a life-turned-game',
  views: '14,395,524',
  rating: {
    sourceRating: 'readMng.com',
    voteCount: '2,395',
    rating_percentage: '69.48%',
    rating_stars: '3.5 / 5'
  },
  type: 'manhwa',
  chapters: [
    {
      name: 'Chapter - 380',
      url: 'https://www.readmng.com/the-gamer/380/all-pages',
      uploadWhen: '5 hours ago'
    },
    ...
  ]
}
```

---

#### `readmng.getPages(url, callback)`

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
await readmng.getPages('https://www.readmng.com/the-gamer/380/all-pages');

[
  'https://www.funmanga.com/uploads/chapter_files/7236/389/1.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/2.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/3.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/4.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/5.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/6.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/7.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/8.jpg',
  'https://www.funmanga.com/uploads/chapter_files/7236/389/9.jpg',
];
```
