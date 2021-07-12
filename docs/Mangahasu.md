[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[browser]: https://devdocs.io/puppeteer/index#class-browser
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[mangahasu]: https://mangahasu.se/
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[launchoptions]: https://pptr.dev/#?product=Puppeteer&version=v10.1.0&show=api-puppeteerlaunchoptions

## Table of Contents

- [Mangahasu(options)](#mangahasuoptions)
  - [`search(query, filters, callback)`](#mangahasusearchquery-callback)
  - [`getMangaMeta(url, callback)`](#mangahasugetmangametaurl-callback)
  - [`getPages(url, callback)`](#mangahasugetpagesurl-callback)

---

## `Mangahasu(options)`

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

#### `mangahasu.search(query, callback)`

Gets a list of manga that match the `query` from [Mangahasu]

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

    - `coverImage` «[Object]»

      - `url` «[String]»

      - `alt` «[String]»

##### Example

```js
await mangahasu.search('gamer');

[
  {
    title: 'Hell Mode - Yarikomi Suki no Gamer wa Haisettei no Isekai de Musou Suru',
    url: 'https://mangahasu.se/hell-mode---yarikomi-suki-no-gamer-wa-haisettei-no-isekai-de-musou-suru-p55361.html',
    coverImage: {
      url: 'https://img.mangahasu.se/1img/ddyLr-AXOt2Q5a/hell-mode---yarikomi-suki-no-gamer-wa-haisettei-no-isekai-de-musou-suru.jpg',
      alt: 'Hell Mode - Yarikomi Suki no Gamer wa Haisettei no Isekai de Musou Suru'
    }
  },
  {
    title: 'Gamers!',
    url: 'https://mangahasu.se/gamers-p25752.html',
    coverImage: {
      url: 'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/gamers.jpg',
      alt: 'Gamers!'
    }
  },
  ...
]
```

---

#### `mangahasu.getMangaMeta(url, callback)`

Gets the metadata of the given manga url from [Mangahasu]

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

    - `authors` «[Array]<[String]>»

    - `artists` «[Array]<[String]>»

    - `type` «[String]»

    - `status` «[String]»

    - `genres` «[Array]<[String]>»

    - `views` «[String]»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

    - `coverImage` «[Object]»

      - `url` «[String]»

      - `alt` «[String]»

    - `chapters` «[Array]<[Object]>»

      - «[Object]»

        - `name` «[String]»

        - `url` «[String]»

        - `uploadDate` «[Date]»

##### Example

```js
await mangahasu.getMangaMeta('https://mangahasu.se/gamers-p25752.html');

{
  title: { main: 'Gamers!', alt: [ 'ゲーマーズ!' ] },
  summary: "The story centers on a fairly ordinary high school boy named Keita Amano. His hobby is video games, but apart from that, he has no conspicuous traits, and has never been in love. As Keita continues his gaming life, he suddenly becomes involved with the most beautiful girl at school, Tendou Karen, the president of the school's video game club. She shocks Keita when she suddenly asks him to join the video game
club. \n" +
    '\n' +
    'Watch how their relationship evolves and becomes more complicated, especially when other gamers come into the picture, creating all sorts of misunderstandings and drama.',
  authors: [ 'Aoi Sekina' ],
  artists: [ 'Takahashi Tsubasa' ],
  type: 'Manga',
  status: 'Ongoing',
  genres: [
    'Comedy',
    'Drama',
    'Romance',
    'School Life',
    'Shounen',
    'Slice of Life'
  ],
  views: '6,454',
  rating: {
    sourceRating: 'Mangahasu.se',
    rating_percentage: '100.00%',
    rating_stars: '5/5',
    voteCount: '2'
  },
  coverImage: {
    url: 'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/gamers.jpg',
    alt: 'Gamers!'
  },
  chapters: [
    {
      name: 'Vol 3 Chapter 14: Gamers & Flying Get 5',
      url: 'https://mangahasu.se/gamers/vol-3-chapter-14-gamers--flying-get-5-c1044670.html',
      uploadDate: 2021-03-13T07:00:00.000Z
    },
    ...
  ]
}
```

---

#### `mangahasu.getPages(url, callback)`

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
await mangahasu.getPages('https://mangahasu.se/gamers/vol-3-chapter-14-gamers--flying-get-5-c1044670.html');

[
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/001.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/002.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/003.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/004.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/005.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/006.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/007.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/008.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/009.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/010.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/011.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/012.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/013.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/014.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/015.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/016.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/017.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/018.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/019.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/020.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/021.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/022.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/023.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/024.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/025.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/026.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/027.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/028.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/029.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/030.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/031.jpg',
  'https://img.mangahasu.se/1img/BdadB-2c3Xtbrn/rZNNLaZ-wvOamp2c/032.jpg',
];
```
