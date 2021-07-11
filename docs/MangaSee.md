[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[browser]: https://devdocs.io/puppeteer/index#class-browser
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[mangasee]: https://mangasee123.com/
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

## Table of Contents

- [MangaSee(options)](#mangaseeoptions)
  - [`search(query, callback)`](#searchquery-callback)
  - [`getMangaMeta(url, callback)`](#getmangametaurl-callback)
  - [`getPages(url, callback)`](#getpagesurl-callback)
  - [`directory(callback)`](#directorycallback)

---

## `MangaSee(options)`

### Parameters

- `options` «[Object]»

  - `proxy` «?[Object]»

    - `host` «[String]» URL of proxy

    - `port` «[Number]» Port of proxy

  - `debug` «?[Boolean]» Defaults to `false`. If `true`, it will log network requests into console.

  - `puppeteerInstance` «[Object]»

    - `instance` «[String]» Accepts either `custom` or `endpoint`

    - `wsEndpoint` «[String]» URL of endpoint. Only available if `instance` is `endpoint`

    - `browser` «[Browser]» Only available if `instance` is `custom`

    - `options` «?[Object]» Only available if `instance` is `custom`

      - `closeAfterOperation` «?[Boolean]» If `true`, closes the browser after an operation has been completed. Else, it will leave one page open and standby for oncoming operations.

---

### Methods

#### `mangasee.search(query, callback)`

Gets a list of manga that match the `query` from [MangaSee]

##### Parameters:

- `query` «[String]|[Object]»

  - `title` «?[String]»

  - `author` «?[String]»

- `filters` «?[Object]»

  - `genres` «?[Object]»

    - `include` «?[Array]<[String]>»

    - `exclude` «?[Array]<[String]>»

  - `status` «?[Object]»

    - `scan` «?[String]»

    - `publish` «?[String]»

  - `orderBy` «?[String]»

  - `orderType` «?[String]»

  - `translationGroup` «?[String]»

  - `type` «?[String]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `coverImage` «[String]»

    - `status` «[Object]»

      - `scan` «[String]»

      - `publish` «[String]»

    - `genres` «[Array]<[String]>»

    - `updatedAt` «[Date]»

##### Example

```js
await mangasee.search('haikyu!');

[
  {
    title: 'Haikyu!!',
    url: 'https://mangasee123.com/manga/Haikyu',
    coverImage: 'https://cover.nep.li/cover/Haikyu.jpg',
    status: { scan: 'complete', publish: 'complete' },
    genres: [ 'Comedy', 'School Life', 'Shounen', 'Sports' ],
    updatedAt: 2021-05-24T07:00:00.000Z
  }
]
```

---

#### `mangasee.getMangaMeta(url, callback)`

Gets the metadata of the given manga url from [MangaSee]

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

    - `authors` «[Array]<[String]>»

    - `summary` «[String]»

    - `genres` «[Array]<[String]>»

    - `coverImage` «[String]»

    - `type` «[String]»

    - `status` «[Object]»

      - `scan` «[String]»

      - `publish` «[String]»

    - `chapters` «[Array]<[Object]>»

      - «[Object]»

        - `name` «[String]»

        - `url` «[String]»

        - `uploadDate` «[Date]»

##### Example

```js
await mangasee.getMangaMeta('https://mangasee123.com/manga/Haikyu');

{
  title: { main: 'Haikyu!!', alt: 'High Kyuu!!' },
  authors: [ 'FURUDATE Haruichi' ],
  genres: [ 'Comedy', 'School Life', 'Shounen', 'Sports' ],
  summary: `Hinata Shouyou, upon seeing a volleyball match, is aiming to become "The Small Giant", and joins his middle school volleyball club. After finding new members, they set out for the middle school tournament, where they've cross paths with a formidable school with the "King of the Upper Court", Kageyama Tobio. Although their team lost, Shouyou is still determined to aim for the top and exact revenge on Kageyama. Upon entering high school, he recieved the biggest surprise--he and Kageyama are on the same school and club!`,
  type: 'manga',
  status: { scan: 'complete', publish: 'complete' },
  coverImage: 'https://cover.nep.li/cover/Haikyu.jpg',
  chapters: [
    {
      name: 'Chapter 402',
      url: 'https://mangasee123.com/read-online/Haikyu-chapter-402.html',
      uploadDate: 2020-07-19T18:14:47.000Z
    },
    ...
  ]
}
```

---

#### `mangasee.getPages(url, callback)`

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
await mangasee.getPages('https://mangasee123.com/read-online/Haikyu-chapter-402.html');

[
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-001.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-002.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-003.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-004.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-005.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-006.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-007.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-008.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-009.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-010.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-011.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-012.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-013.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-014.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-015.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-016.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-017.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-018.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-019.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-020.png',
  'https://scans-hot.leanbox.us/manga/Haikyu/0402-021.png',
];
```

---

#### `mangasee.directory(callback)`

Gets all the mangas from the [MangaSee directory](https://mangasee123.com/directory/).

##### Parameters:

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `coverImage` «[String]»

    - `status` «[String]»

    - `genres` «[Array]<[String]>»

##### Example

```js
await mangasee.directory();

[
  {
    title: '#Killstagram',
    url: 'https://mangasee123.com/manga/Killstagram',
    coverImage: 'https://cover.nep.li/cover/Killstagram.jpg',
    status: 'ongoing',
    genres: [ 'Horror', 'Josei', 'Psychological' ]
  },
  {
    title: 'μ & I',
    url: 'https://mangasee123.com/manga/Myuun-I',
    coverImage: 'https://cover.nep.li/cover/Myuun-I.jpg',
    status: 'ongoing',
    genres: [ 'Action', 'Mystery', 'Sci-fi', 'Shounen', 'Supernatural' ]
  },
  {
    title: "'Tis Time for Torture, Princess",
    url: 'https://mangasee123.com/manga/Tis-Time-for-Torture-Princess',
    coverImage: 'https://cover.nep.li/cover/Tis-Time-for-Torture-Princess.jpg',
    status: 'ongoing',
    genres: [ 'Comedy', 'Fantasy', 'Shounen' ]
  },
  {
    title: '(G) Edition',
    url: 'https://mangasee123.com/manga/G-Edition',
    coverImage: 'https://cover.nep.li/cover/G-Edition.jpg',
    status: 'complete',
    genres: [ 'Comedy', 'Ecchi', 'Sci-fi', 'Shounen' ]
  },
  ... more than 6200 items
]
```
