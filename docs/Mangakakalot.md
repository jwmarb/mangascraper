[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[browser]: https://devdocs.io/puppeteer/index#class-browser
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[mangakakalot]: https://mangakakalot.com/
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

## Table of Contents

- [Mangakakalot(options)](#mangakakalotoptions)
  - [`search(keyword, callback)`](#searchkeyword-callback)
  - [`getMangaMeta(url, callback)`](#getmangametaurl-callback)
  - [`getMangas(filters, callback)`](#getmangasfilters-callback)
  - [`getPages(url, callback)`](#getpagesurl-callback)

---

## `Mangakakalot(options)`

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

#### `mangakakalot.search(keyword, callback)`

Gets a list of manga that match the `query` from [Mangakakalot]

##### Parameters:

- `keyword` «[String]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `authors` «[Array]<[String]>»

    - `updatedAt` «[Date]»

    - `views` «[String]»

    - `coverImage` «[Object]»

      - `url` «[String]»

      - `alt` «[String]»

##### Example

```js
await mangakakalot.search('Please dont bully me Nagatoro');

[
  {
    title: "Please Don't Bully Me, Nagatoro",
    url: 'https://mangakakalot.com/read-nx6my158504832956',
    authors: [ '774 House (774)' ],
    updatedAt: 2021-07-06T19:43:00.000Z,
    views: '38,186,463',
    coverImage: {
      url: 'https://avt.mkklcdnv6temp.com/2/g/16-1583493543.jpg',
      alt: "Please don't bully me, Nagatoro"
    }
  },
  {
    title: "Please Don't Bully Me, Nagatoro Comic Anthology",
    url: 'https://mangakakalot.com/manga/bm922425',
    authors: [ 'Anthology' ],
    updatedAt: 2020-03-12T19:58:00.000Z,
    views: '448,531',
    coverImage: {
      url: 'https://avt.mkklcdnv6temp.com/43/k/20-1583989794.jpg',
      alt: "Please Don't Bully Me, Nagatoro Comic Anthology"
    }
  }
]
```

---

#### `mangakakalot.getMangaMeta(url, callback)`

Gets the metadata of the given manga url from [Mangakakalot]

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

    - `status` «[String]»

    - `updatedAt` «[Date]»

    - `views` «[String]»

    - `authors` «[Array]<[String]>»

    - `genres` «[Array]<[String]>»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

    - `summary` «[String]»

    - `coverImage` «[Object]»

      - `url` «[String]»

      - `alt` «[String]»

    - `chapters` «[Array]<[Object]>»

      - «[Object]»

        - `name` «[String]»

        - `url` «[String]»

        - `uploadDate` «[Date]»

        - `views` «[String]»

##### Example

```js
await mangakakalot.getMangaMeta('https://mangakakalot.com/read-rp1kv158504840628');

{
  title: {
    main: 'Tensei Kizoku no Isekai Boukenroku ~Jichou wo Shiranai Kamigami no Shito~',
    alt: [
      'Adventure Record of Reincarnated Aristocrat ~ The apostle of Gods who doesn’t know self-esteem~',
      `Wonderful adventure in Another world! "God... That's going too far!!" he said...`,
      '転生貴族の異世界冒険録 ～自重を知らない神々の使徒～',
      '转生贵族的异世界冒险录'
    ]
  },
  status: 'ongoing',
  updatedAt: 2021-07-07T09:28:41.000Z,
  views: '21,829,266',
  authors: [ 'Nini', ' Yashu' ],
  genres: [ 'Action', 'Fantasy', 'Harem', 'Historical', 'Romance', 'Shounen' ],
  rating: {
    sourceRating: 'Mangakakalot.com',
    voteCount: '8,136',
    rating_percentage: '96.00%',
    rating_stars: '4.8 / 5'
  },
  summary: 'Shiina Kazuya, our protagonist who got killed by a stranger when he tried to protect his childhood friend and little sister, reincarnated into Cain Von Silford as the third son in the world of sword and magic.\n' +
    '\n' +
    'Cain grew up being surrounded by Gods who doesn’t know self-esteem, the upper noble and the girls who are swayed around him.\n' +
    'Being given so many protection from the gods, He overcame any obstacle (aka Flags) while hiding his unbelievable status. The noble path fantasy story of a young boy who sometimes wicked and clumsy.',
  coverImage: {
    url: 'https://avt.mkklcdnv6temp.com/40/f/16-1583494908.jpg',
    alt: 'Tensei Kizoku no Isekai Boukenroku ~Jichou wo Shiranai Kamigami no Shito~'
  },
  chapters: [
    {
      name: 'Chapter 33',
      url: 'https://mangakakalot.com/chapter/tensei_kizoku_no_isekai_boukenroku_jichou_wo_shiranai_kamigami_no_shito/chapter_33',
      uploadDate: 2021-07-07T07:00:00.000Z,
      views: '75,069'
    },
    ...
  ]
}
```

---

#### `mangakakalot.getMangas(filters, callback)`

Gets a list of mangas with according to the applied `filters`

##### Parameters:

- `filters` «?[Object]»

  - `genre` «?[String]»

  - `status` «?[String]»

  - `age` «?[String]»

  - `page` «?[Number]»

- `callback` «?[Function] (error, data) => void»

  - error «[Error]»

  - data «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `url` «[String]»

    - `views` «[String]»

    - `coverImage` «[Object]»

      - `url` «[String]»

      - `alt` «[String]»

##### Example

```js
await mangakakalot.getMangas({ genre: 'Historical' });

[
  {
    title: '100 Strange Nights',
    url: 'https://mangakakalot.com/manga/sp918107',
    views: '212,385',
    coverImage: {
      url: 'https://avt.mkklcdnv6temp.com/33/x/17-1583496474.jpg',
      alt: '100 Strange Nights'
    }
  },
...
]
```

---

#### `mangakakalot.getPages(url, callback)`

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
await mangakakalot.getPages('https://mangakakalot.com/chapter/please_dont_bully_me_nagatoro/chapter_86');

[
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/1.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/2.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/3.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/4.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/5.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/6.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/7.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/8.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/9.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/10.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/11.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/12.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/13.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/14.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/15.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/16.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/17.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/18.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/19.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/20.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/21.jpg',
  'https://s8.mkklcdnv6temp.com/mangakakalot/p1/please_dont_bully_me_nagatoro/chapter_86/22.jpg',
];
```
