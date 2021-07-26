[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[browser]: https://devdocs.io/puppeteer/index#class-browser
[error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[mangabox]: https://mangabox.org/
[date]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
[launchoptions]: https://pptr.dev/#?product=Puppeteer&version=v10.1.0&show=api-puppeteerlaunchoptions

## Table of Contents

- [MangaBox(options)](#mangaboxhasuoptions)
  - [`search(query, filters, callback)`](#mangaboxsearchquery-filters-callback)
  - [`getMangaMeta(url, callback)`](#mangaboxgetmangametaurl-callback)
  - [`getPages(url, callback)`](#mangaboxgetpagesurl-callback)

---

## `MangaBox(options)`

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

#### `mangabox.search(query, filters, callback)`

Gets a list of manga that match the `query` from [MangaBox]

##### Parameters:

- `query` «[String]|[Object]»

  - `title` «?[String]»

  - `author` «?[String]»

  - `artist` «?[String]»

- `filters` «?[Object]»

  - `genres` «?[Object]»

    - `include` «?[Array]<[String]>»

    - `condition` «[String]» Accepts either `and` or `or`. If value is set to `and`, it will search for mangas that have all genres. If value is set to `or`, it will search for mangas that have EITHER genre.

  - `status` «?[String]»

  - `orderBy` «?[String]»

  - `includeNSFW` «?[Boolean]» If `true`, search will include nsfw results. This value is `false` by default.

  - `yearReleased` «?[Number]»

- `callback` «?[Function] (error, data) => void»

  - `error` «[Error]»

  - `data` «[Array]<[Object]>»

##### Returns:

- «[Array]<[Object]>»

  - «[Object]»

    - `title` «[String]»

    - `authors` «[Array]<[String]>»

    - `genres` «[Array]<[String]>»

    - `status` «[String]»

    - `updatedAt` «[Date]»

    - `url` «[String]»

    - `coverImage` «[String]»

##### Example

```js
await mangabox.search(null, {
    genres: {
        include: ['Detective', 'Martial Arts'],
        condition: 'or',
    },
    status: ['completed', 'ongoing'],
    orderBy: 'trending',
});

[
  {
    title: 'Martial Peak',
    url: 'https://mangabox.org/manga/martial-peak/',
    authors: [ 'Pikapi' ],
    coverImage: 'https://mangabox.org/wp-content/uploads/2020/11/26158-193x278.jpg',
    genres: [
      'Action',
      'Adventure',
      'Fantasy',
      'Harem',
      'Historical',
      'Manhua',
      'Martial Arts'
    ],
    status: 'ongoing',
    updatedAt: 2021-07-26T03:46:57.000Z
  },
  {
    title: 'Tales of Demons and Gods',
    url: 'https://mangabox.org/manga/tales-of-demons-and-gods/',
    authors: [ 'Mad Snail' ],
    coverImage: 'https://mangabox.org/wp-content/uploads/2020/09/01-193x278.png',
    genres: [
      'Action',
      'Adventure',
      'Comedy',
      'Drama',
      'Fantasy',
      'Manhua',
      'Martial Arts',
      'Romance',
      'Shounen'
    ],
    status: 'ongoing',
    updatedAt: 2021-07-25T02:25:28.000Z
  },
]
```

---

#### `mangabox.getMangaMeta(url, callback)`

Gets the metadata of the given manga url from [MangaBox]

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

    - `artists` «[Array]<[String]>»

    - `genres` «[Array]<[String]>»

    - `coverImage` «[String]»

    - `status` «[String]»

    - `rank` «[String]»

    - `rating` «[Object]»

      - `sourceRating` «[String]»

      - `voteCount` «[String]»

      - `rating_percentage` «[String]»

      - `rating_stars` «[String]»

    - `summary` «[String]»

    - `chapters` «[Array]<[Object]>»

      - «[Object]»

        - `name` «[String]»

        - `url` «[String]»

        - `uploadDate` «[Date]»

##### Example

```js
await mangabox.getMangaMeta('https://mangabox.org/manga/tales-of-demons-and-gods/');

{
  title: { main: 'Tales of Demons and Gods', alt: [] },
  authors: [ 'Mad Snail' ],
  artists: [ 'Jiang Ruotai', 'Mad snail' ],
  genres: [
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Manhua',
    'Martial Arts',
    'Romance',
    'Shounen'
  ],
  coverImage: 'https://mangabox.org/wp-content/uploads/2020/09/01-193x278.png',
  status: 'ongoing',
  rank: '7th',
  rating: {
    sourceRating: 'mangabox.org',
    ratingStars: '4.5/5',
    ratingPercentage: '90.00%',
    voteCount: '8'
  },
  summary: "The world's toughest satanic force speller Nie Lie perished in cope the Wise Emperor. However his heart was actually symbolized once more, giving back many years earlier, in him, a thirteen-year-old young boy. Currently he possesses an opportunity to fix all the blunders helped make before: to spare his neighborhood coming from beasts, to defend his treasured, loved ones. As a youngster, Nie Li was actually the weakest pupil in the course, along with metaphysical toughness at the degree of normal individuals. He performed certainly not risk to come to be a fighter, not to mention a daemon incantation producer, however the adventure and also know-how gathered in his previous lifestyle will definitely aid him come to be more powerful. Nevertheless, currently he understands one thing that is actually not known to lecturers in their battle institute.",
  chapters: [
    {
      name: 'Chapter 337.6',
      url: 'https://mangabox.org/manga/tales-of-demons-and-gods/chapter-337-6/',
      uploadDate: Invalid Date
    },
    {
      name: 'Chapter 337.1',
      url: 'https://mangabox.org/manga/tales-of-demons-and-gods/chapter-337-1/',
      uploadDate: 2021-07-21T07:00:00.000Z
    },
    ...
  ]
}
```

---

#### `mangabox.getPages(url, callback)`

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
await mangabox.getPages('https://mangabox.org/manga/dr-stone-manhua/chapter-205/');

[
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/500.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/501.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/502.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/503.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/504.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/505.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/506.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/507.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/508.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/509.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/510.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/511.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/512.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/513.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/514.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/515.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/516.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/517.jpg',
  'https://mangabox.org/wp-content/uploads/WP-manga/data/manga_5f05ad97427cf/918c1528f6f70f2ea0ddb5189b04ccfa/518.jpg',
];
```
