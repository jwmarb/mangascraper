import {
  Manga,
  MangaCallback,
  MangaChapters,
  MangaCoverImage,
  MangaFilters,
  MangaGenre,
  MangaMeta,
  MangaOrder,
  MangaParkGenres,
  MangaParkOrderBy,
  MangaRating,
  MangaSearch,
  MangaStatus,
  MangaType,
  ScrapingOptions,
} from '..';
import failure from '../functions/failure';
import jquery from 'jquery';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import automateBrowser from '../functions/automateBrowser';

export type MangaParkMeta = {
  title: {
    main: string;
    alt?: string[];
  };
  authors: string[];
  artists: string[];
  coverImage: MangaCoverImage;
  summary: string;
  genres: MangaGenre<MangaPark>[];
  type: MangaType<MangaPark>;
  status: Omit<MangaStatus<MangaPark>, 'any'>;
  rating: MangaRating;
  chapters: {
    recentlyUpdated?: 'duck' | 'fox' | 'rock' | 'panda' | 'mini';
    duck: MangaChapters<MangaPark>[];
    fox: MangaChapters<MangaPark>[];
    rock: MangaChapters<MangaPark>[];
    panda: MangaChapters<MangaPark>[];
    mini: MangaChapters<MangaPark>[];
  };
};

export type MangaParkManga = {
  title: string;
  url: string;
  authors: string[];
  coverImage: MangaCoverImage;
  genres: string[];
  rating: MangaRating;
};

export interface MangaParkOptions {
  genre?: {
    include?: MangaGenre<MangaPark>[];
    exclude?: MangaGenre<MangaPark>[];
  };
  status?: MangaStatus<MangaPark>;
  rating?: '5☆' | '4☆' | '3☆' | '2☆' | '1☆' | '0☆';
  type?: MangaType<MangaPark>;
  yearReleased?: string;
  orderBy?: MangaOrder<MangaPark>;
  page?: number;
}

export type MangaParkGenre = keyof typeof MangaParkGenres;

let memo: string[] = [];

export default class MangaPark {
  private options: ScrapingOptions;

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   * Search up a manga from MangaParkv2
   *
   * @param title - Title of manga. By default, it searches for titles matching this value. If you want to search for author and/or title, pass in an object containing either/both `author` and/or `title`.
   * @param filters - Filters to apply to query
   * @param callback - Callback function
   * @returns Returns an array of mangas from MangaPark (v2)
   * @example
   * ```js
   * const mangapark = new MangaPark();
   * ```
   * ```js
   * mangapark.search('Berserk');
   * ```
   * ```js
   * mangapark.search({ author: 'Gotouge Koyoharu' })
   * ```
   * ```js
   * mangapark.search(null, { type: 'manga', genre: { include: ['Horror'] } })
   * ```
   */
  search(
    title: MangaSearch<MangaPark>,
    filters: MangaFilters<MangaPark> = {},
    callback: MangaCallback<Manga<MangaPark>[]> = () => {},
  ): Promise<Manga<MangaPark>[]> {
    const { genre, status = 'any', rating, type, yearReleased, orderBy = 'views', page = 1 } = filters;

    const url = (() => {
      const query = (() => {
        if (title == null || (typeof title === 'string' && title.length === 0)) return '';
        if (typeof title === 'string') return `q=${title}`;

        let author;
        let query;

        if (title.author == null) author = '';
        else author = `autart=${title.author}`;
        if (query == null) query = '';
        else query = `q=${title.title}`;
        return [query, author].filter((item) => item.length !== 0).join('');
      })();

      const includeGenres =
        genre && genre.include && genre.include.length > 0
          ? `genres=${genre.include.map((genre) => MangaParkGenres[genre])}`
          : '';

      const excludeGenres =
        genre && genre.exclude && genre.exclude.length > 0
          ? `genres-exclude=${genre.exclude.map((genre) => MangaParkGenres[genre])}`
          : '';

      const mangaRating = rating ? `rating=${rating.substring(0, 0)}` : '';

      const mangaStatus = status !== 'any' ? `status=${status}` : '';

      const mangaType = type ? `types=${type}` : '';

      const year = yearReleased ? `years=${yearReleased}` : '';

      const order = `orderby=${MangaParkOrderBy[orderBy]}`;

      const args = [
        query,
        includeGenres,
        excludeGenres,
        mangaRating,
        mangaStatus,
        mangaType,
        year,
        order,
        '&st-ss=0',
        `page=${page}`,
      ]
        .filter((i) => i.length !== 0)
        .join('&');

      return `https://v2.mangapark.net/search?${args}`;
    })();

    return new Promise(async (res) => {
      if (typeof page !== 'number') return failure('"page" must be a number', callback);
      if (page == null) return failure('Missing argument "page" is required', callback);
      try {
        // Parse HTML document
        const $ = await readHtml(url, this.options);
        const titleURLs = $('h2 > a')
          .map((_, el) => {
            const anchorEl = $(el);
            const url = `https://v2.mangapark.net${anchorEl.attr('href')}` || '';
            const title = anchorEl.attr('title') || '';
            return {
              url,
              title,
            };
          })
          .get();

        const authors = $('div:contains("Authors/Artists") > b.pd')
          .prevAll()
          .map((_, el) => {
            const text = $(el).text();
            if (!text.match('Authors/Artists:')) memo = [...memo, text];
            else {
              const prevMemo = memo;
              memo = [];
              return [prevMemo];
            }
          })
          .get();

        const genres = $('div.field.last > a')
          .map((_, el) => {
            const anchorEl = $(el);
            const text = anchorEl.text();
            if (anchorEl.next().is('a')) memo = [...memo, text];
            else {
              const prevMemo = memo;
              memo = [];
              return [prevMemo];
            }
          })
          .get();

        const rating = $('div.rate').map((_, el) => {
          const divEl = $(el);
          const rating = divEl.attr('title')?.split(' ') || [];
          const numerator = Number(rating[1]);
          const denominator = Number(rating[3]);
          const voteCount = Number(rating[6]);
          return {
            sourceRating: 'MangaPark.net',
            voteCount,
            rating_percentage: `${((numerator / denominator) * 100).toFixed(2)}%`,
            rating_stars: `${numerator} / ${denominator}`,
          };
        });

        const coverImage = $('a.cover > img')
          .map((_, el) => {
            const imgEl = $(el);
            const img = imgEl.attr('src');
            const alt = imgEl.attr('alt') || '';
            return {
              url: img,
              alt,
            };
          })
          .get();

        const data = titleURLs.map(({ title, url }, i) => ({
          title,
          url,
          authors: authors[i],
          coverImage: coverImage[i],
          genres: genres[i],
          rating: rating[i],
        }));

        success(data, callback, res);
      } catch (e) {
        failure(e, callback);
      }
    });
  }

  /**
   * Get the metadata of a manga
   *
   * @param url - URL of manga
   * @param callback - Callback function
   * @returns Returns the metadata of a manga
   * @example
   * ```js
   * const mangapark = new MangaPark();
   * ```
   * ```js
   * await mangapark.getMangaMeta('https://v2.mangapark.net/manga/berserk');
   * ```
   */
  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<MangaPark>> = () => {},
  ): Promise<MangaMeta<MangaPark>> {
    return new Promise(async (res) => {
      try {
        // Parse HTML document
        const $ = await readHtml(url, this.options);

        const title = $('h2 > a').text().split(' ').slice(0, -1).join(' ');

        const altTitles = $('th:contains("Alternative")')
          .siblings('td')
          .map((_, el) =>
            $(el)
              .text()
              .trim()
              .split(';')
              .map((text) => text.trim()),
          )
          .get();

        const rating = (() => {
          const textArray = $('th:contains("Rating")').siblings('td').text().trim().split(' ');
          const numerator = Number(textArray[1]);
          const denominator = Number(textArray[3]);
          const voteCount = Number(textArray[6]);
          return {
            sourceRating: 'MangaPark.net',
            voteCount,
            rating_percentage: `${((numerator / denominator) * 100).toFixed(2)}%`,
            rating_stars: `${numerator} / ${denominator}`,
          };
        })();
        const authors = $('th:contains("Author(s)")')
          .siblings('td')
          .children()
          .map((_, el) => $(el).text().trim())
          .get();
        const artists = $('th:contains("Artist(s)")')
          .siblings('td')
          .children()
          .map((_, el) => $(el).text().trim())
          .get();
        const genres = $('th:contains("Genre(s)")')
          .siblings('td')
          .children()
          .map((_, el) => <MangaGenre<MangaPark>>$(el).text().trim())
          .get();
        const type = (() => {
          let mangaType = $('th:contains("Type")').siblings().text().trim().split(' ')[1];
          if (mangaType === 'Webtoon') mangaType = 'manhwa';
          return <MangaType<MangaPark>>mangaType.toLowerCase();
        })();
        const status: MangaMeta<MangaPark>['status'] = $('th:contains("Status")')
          .siblings()
          .text()
          .trim()
          .toLowerCase();
        const summary = $('div.summary').children().remove().end().text().trim();
        const coverImage: MangaCoverImage = (() => {
          const imgEl = $('img.w-100');
          const url = imgEl.attr('src');
          const alt = imgEl.attr('alt') || '';
          return {
            url,
            alt,
          };
        })();

        let memo: MangaChapters<MangaPark>[][] = [[], [], [], [], []];
        $('div.volumes').each((_, el) => {
          const container = $(el);
          const version = <MangaMeta<MangaPark>['chapters']['recentlyUpdated']>(
            container.siblings().find('div > a > span').text().slice(8).toLowerCase()
          );

          let chapters = container
            .find('a.visited.ch')
            .map((_, el) => {
              const anchorEl = $(el);
              const url = `https://v2.mangapark.net${anchorEl.attr('href')?.slice(0, -1)}` || '';
              const name = anchorEl.text();
              return {
                name,
                url,
              };
            })
            .get();

          const uploadWhen = container
            .find('span.time')
            .map((_, el) => $(el).text().trim())
            .get();

          const data = chapters.map(({ url, name }, i) => ({ name, url, uploadWhen: uploadWhen[i] }));

          switch (version) {
            case 'duck':
              memo[0] = data;
              break;
            case 'fox':
              memo[1] = data;
              break;
            case 'rock':
              memo[2] = data;
              break;
            case 'panda':
              memo[3] = data;
              break;
            case 'mini':
              memo[4] = data;
              break;
            default:
              break;
          }
        });

        const recommendedSource = <NonNullable<MangaMeta<MangaPark>['chapters']['recentlyUpdated']>>$(
          'div#list > div.stream',
        )
          .filter((_, el) => !$(el).hasClass('collapsed'))
          .find('div > div > a > span')
          .text()
          .substring(8)
          .toLowerCase();

        const chapters: MangaMeta<MangaPark>['chapters'] = {
          recentlyUpdated: recommendedSource.length === 0 ? undefined : recommendedSource,
          duck: memo[0],
          fox: memo[1],
          rock: memo[2],
          panda: memo[3],
          mini: memo[4],
        };

        success(
          {
            title: {
              main: title,
              alt: altTitles,
            },
            summary,
            coverImage,
            authors,
            artists,
            genres,
            rating,
            type,
            status,
            chapters,
          },
          callback,
          res,
        );
      } catch (e) {
        failure(e, callback);
      }
    });
  }

  /**
   * Get raw image URLs from a chapter URL. Since MangaPark uses Cloudflare, make sure to add `referer: https://v2.mangapark.net/` to every GET request when fetching the image or else the image will not load.
   *
   * @param url - URL of chapter
   * @param callback - Callback function
   * @returns Returns an array of strings that contain the img URLs of the pages from the chapter URL
   * @example
   * ```js
   * const mangapark = new MangaPark();
   * ```
   * ```js
   * await mangapark.getPages('https://xcdn-222.mangapark.net/10102/69/9b/5c791a3ae9c047226f2bb996/02_75696_711_1114.webp');
   * ```
   */
  public getPages(url: string, callback: MangaCallback<string[]> = () => {}): Promise<string[]> {
    const BLOCKED_REQUESTS = [
      'https://v2.mangapark.net/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/',
      'https://cdnjs.cloudflare.com/ajax/libs/jquery_lazyload/',
      'https://cdnjs.cloudflare.com/ajax/libs/axios/',
      'https://static.mangapark.net/v2/js/global.js',
      'https://static.mangapark.net/v2/js/manga-global.js',
      'https://v2.mangapark.net/book-list/',
      'https://mangapark.net/misc/',
      'https://mangaparkcom.disqus.com/',
      'https://www.googletagmanager.com/',
      'https://hm.baidu.com/',
      'https://s7.addthis.com/',
      'https://tags.crwdcntrl.net/',
    ];

    return new Promise(async (res) => {
      try {
        const data = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto(url);
            await page.addScriptTag({ path: require.resolve('jquery') });
            return await page.evaluate(() => {
              const { $ } = window as typeof window & { $: typeof jquery };
              return $('a.img-link > img')
                .map((_, el) => $(el).attr('src') || '')
                .get();
            });
          },
          {
            domains: { method: 'block', value: BLOCKED_REQUESTS },
            resource: { method: 'unblock', type: ['document', 'script'] },
          },
        );
        success(data, callback, res);
      } catch (e) {
        failure(e, callback);
      }
    });
  }
}
