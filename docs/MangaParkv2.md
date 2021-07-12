[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[browser]: https://devdocs.io/puppeteer/index#class-browser
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[mangapark]: https://v2.mangapark.net/
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[launchoptions]: https://pptr.dev/#?product=Puppeteer&version=v10.1.0&show=api-puppeteerlaunchoptions

## Table of Contents

- [MangaPark(options)](#mangaparkoptions)
  - [`search(query, filters, callback)`](#mangaparksearchquery-callback)
  - [`getMangaMeta(url, callback)`](#mangaparkgetmangametaurl-callback)
  - [`getPages(url, callback)`](#mangaparkgetpagesurl-callback)

---

## `MangaPark(options)`

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

#### `mangapark.search(query, callback)`

Gets a list of manga that match the `query` from [MangaPark]

##### Parameters:

- `query` «[String]|[Object]»

  - `title` «?[String]»

  - `author` «?[String]»

- `filters` «?[Object]»

  - `genres` «?[Object]»

    - `include` «?[Array]<[String]>»

    - `exclude` «?[Array]<[String]>»

  - `status` «?[String]»

  - `orderBy` «?[String]»

  - `rating` «?[String]»

  - `type` «?[String]»

  - `yearReleased` «?[String]»

  - `page` «?[Number]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `authors` «[Object]<[String]>»

    - `coverImage` «[String]»

    - `genres` «[Array]<[String]>»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

##### Example

```js
await mangapark.search('dungeon');

[
  {
    title: 'Dungeon ni Deai o Motomeru no wa Machigatte Iru Darou ka',
    url: 'https://v2.mangapark.net/manga/dungeon-ni-deai-o-motomeru-no-wa-machigatte-iru-darou-ka',
    authors: [ 'Oomori fujino', 'Kunieda' ],
    coverImage: {
      url: 'https://xfs-000.animemark.net/pictures/W300/71a/71a9191cabeae820e9455916931a4ec06fa7ad53_200_284_36777.jpg?acc=Er5Q5zP3zZT7OP99Econrw&exp=1626097380',
      alt: 'Dungeon ni Deai o Motomeru no wa Machigatte Iru Darou ka'
    },
    genres: [
      'Seinen',
      'Ecchi',
      'Action',
      'Adventure',
      'Comedy',
      'Fantasy',
      'Harem'
    ],
    rating: {
      sourceRating: 'MangaPark.net',
      voteCount: '4,662,429',
      rating_percentage: '95.00%',
      rating_stars: '9.5 / 10'
    }
  },
  {
    title: 'Maou no Hajimekata',
    url: 'https://v2.mangapark.net/manga/maou-no-hajimekata-warau-yakan',
    authors: [ 'Warau yakan', 'Maou no hajimekata 43', 'Komiya toshimasa' ],
    coverImage: {
      url: 'https://xfs-000.animemark.net/pictures/W300/b67/b677257f3eba92aa6c4a86c45e6c71682ecbfb65_200_292_31113.jpg?acc=oVSy1-u4FlBL4bARKAMryQ&exp=1626097380',
      alt: 'Maou no Hajimekata'
    },
    genres: [
      'Seinen',  'Adult',
      'Mature',  'Smut',
      'Action',  'Drama',
      'Fantasy', 'Harem'
    ],
    rating: {
      sourceRating: 'MangaPark.net',
      voteCount: '3,055,246',
      rating_percentage: '92.00%',
      rating_stars: '9.2 / 10'
    }
  },
  ...
]
```

---

#### `mangapark.getMangaMeta(url, callback)`

Gets the metadata of the given manga url from [MangaPark]

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

    - `authors` «[Array]<[String]>»

    - `artists` «[Array]<[String]>»

    - `genres` «[Array]<[String]>»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

    - `type` «[String]»

    - `status` «[String]»

    - `chapters` «[Object]» **Note:** MangaPark offers different chapter sources whose objects in the array share the same type as each source.

      - `recentlyUpdated` «[String]»

      - `duck` «[Array]<[Object]>»

      - `fox` «[Array]<[Object]>»

      - `rock` «[Array]<[Object]>»

      - `panda` «[Array]<[Object]>»

      - `mini` «[Array]<[Object]>»

      - `toon` «[Array]<[Object]>»

        ***

    - `chapters` in `Object` «[Array]<[Object]>»

      - `recentlyUpdated` «[String]»

      - `sourceName (e.g fox)` «[Array]<[Object]>»

        - «[Object]»

          - `name` «[String]»

          - `url` «[String]»

          - `uploadWhen` «[String]» **Note:** MangaPark does not use timestamps

##### Example

```js
await mangapark.getMangaMeta('https://v2.mangapark.net/manga/maou-no-hajimekata-warau-yakan');

{
  title: {
    main: 'Maou no Hajimekata',
    alt: [
      'Как стать повелителем демонов',
      '成为魔王的方法',
      '魔王の始め方 THE COMIC',
      'Getting Started as the Demon King - The Comic',
      'How to Book on the Devil - The Comic',
      'How to Build a Dungeon: Book of the Demon King',
      'Maou no Hajimekata - The Comic'
    ]
  },
  summary: '“I do not trust humans. They’ll betray you without fail.” Aur, the man who had obtained the ability and right to become the Maou at the end of his life of research. Summoning the succubus Lilu, he then sets out on creating his own domain, a gigantic labyrinthine dungeon. The misanthropic Maou taking on the world, the curtain rises on a dark harem fantasy!',
  coverImage: {
    url: 'https://xfs-000.animemark.net/pictures/W600/b67/b677257f3eba92aa6c4a86c45e6c71682ecbfb65_200_292_31113.jpg?acc=JRPVbdoV7qOGLGKYz-fqrA&exp=1626098272',
    alt: 'Maou no Hajimekata'
  },
  authors: [ 'Warau yakan' ],
  artists: [ 'Komiya toshimasa', 'Maou no hajimekata 43' ],
  genres: [
    'Seinen',
    'Adult',
    'Mature',
    'Smut',
    'Action',
    'Drama',
    'Fantasy',
    'Harem',
    'Supernatural'
  ],
  rating: {
    sourceRating: 'MangaPark.net',
    voteCount: '3,055,246',
    rating_percentage: '92.00%',
    rating_stars: '9.2 / 10'
  },
  type: 'manga',
  status: 'ongoing',
  chapters: {
    recentlyUpdated: 'fox',
    duck: [],
    fox: [
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object], [Object], [Object], [Object],
      [Object]
    ],
    rock: [
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object], [Object],
      [Object], [Object]
    ],
    panda: [],
    mini: [],
    toon: []
  }
}
```

---

#### `mangapark.getPages(url, callback)`

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
await mangapark.getPages('https://v2.mangapark.net/manga/maou-no-hajimekata-warau-yakan/i2686750/c043/');

[
  'https://xcdn-209.mangapark.net/00004/images/e9/10/e9100e703a8aa1e15f1c4f3d4d9e7307f077a5b4_547412_870_2475.jpg?acc=MKJMGOZJxUKT7XCAUhdk3g&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/17/a5/17a5da33b8d528dcb2ea41cc266bf8ccbd850527_168303_870_1237.jpg?acc=jsirV4LGrsbzfmc5qO4wDw&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/71/10/71105b5e0cf28f0fface1be02214b68ce99932c7_186616_870_1237.jpg?acc=N58wi9XD2o6ddqJPe35VBg&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/f2/2b/f22b466adb51adbc33ca557e5e218fdc5fda4f0d_213711_870_1237.jpg?acc=DUE4A_CQAWeNw8MRe3cJMQ&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/58/4f/584f6b2ae3a42fd10f705f7a79b012fedce4f30f_164991_870_1237.jpg?acc=XRp9Z1DqfscmfmqYMqzZLQ&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/1a/ea/1aea9a3b8a7f4a57c7470b6fd30da96da146c38d_150103_870_1237.jpg?acc=PRtMP78L5Hx20TAD0gqypg&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/24/53/24533ea01eab5c0da50e3dbcf5fb08ebbf31f026_177314_870_1237.jpg?acc=ufAZ-GXPJcqGe3S2fbFYig&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/2d/7c/2d7c0528ae96656960be7649ef99b71cf19e9be1_220457_870_1237.jpg?acc=homE-pt1KNk14JjCZKWyIQ&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/83/da/83da8bc8e125ec7017122eca6cf53eed96523c09_187008_870_1237.jpg?acc=PloeS83YibT_Abn418g_tg&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/32/fd/32fda44b2049bbdf7f8a7e8f6e397ba08fde638b_237347_870_1237.jpg?acc=SG6e6oW5wOwgdRePoMt8eA&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/9e/ee/9eeec4f044757a92ecc2ec39504518da2b10937f_225050_870_1237.jpg?acc=2V2yA_WmfJLAJkTgS5kgvQ&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/da/39/da39cec2e14ff7515eda63b8f3d8d96d65a6efcb_239613_870_1237.jpg?acc=-VoCh5o3s3hPuLOx5qnM-A&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/66/c2/66c246f27c1228b5cf98dfb9a3638a864f2fd076_235478_870_1237.jpg?acc=oLq1-FV4RmdTFnIgBPfOJA&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/1a/e9/1ae9f66bfbe5e901f16dfde553ebfbeadddf9a83_259332_870_1237.jpg?acc=0vy17IUum0_6tLCOUARkzw&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/e2/a4/e2a4c96760bae6ac80b26981d91e918695ccd461_263809_870_1237.jpg?acc=kYLw_a8aKMhjYFsyDn0iWQ&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/ef/15/ef15806a7d516b884b55240220799e9a94429b0d_199498_870_1237.jpg?acc=swLlVHGlvEDhJ1_9Ea4PYg&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/47/4a/474a91fa2b8595bade4cf5170fa389cd628698b4_246466_870_1237.jpg?acc=t7y6cKcuqjOWkSl0IXsArQ&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/90/de/90de04226c846c29e3356399a80773880260f0e2_232694_870_1237.jpg?acc=NWP9MBQKS7WeYj3Mv9HwHQ&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/ad/fa/adfa29bf5a9c6bda2355fbeee8abbe95395107f4_355379_870_1237.jpg?acc=31w68hl5g7YhTk-0xryKCg&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/ca/96/ca96f9766f3287378871bb0348f9532bf20935e3_312296_870_1237.jpg?acc=e6psIskTxQeBeDKk7KnLmw&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/14/e9/14e9814f4620522c3aa6dc75ac0fc4ccc9f02c90_311072_870_1237.jpg?acc=oVRr5D-_g3m7gXbYuCOx0g&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/db/43/db43c517d759a9543aa9f4a764070de902eeeca3_275796_870_1237.jpg?acc=sBsp75sXOurO3K9gwayD5w&exp=1626098905',
  'https://xcdn-209.mangapark.net/00004/images/78/b4/78b4b3b51c9686bb48ae8a2b0faed7bc7bc6710f_409107_870_1815.jpg?acc=PLneECJre87RyMrP3N3OKQ&exp=1626098905',
];
```
