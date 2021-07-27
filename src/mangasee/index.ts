import jquery from 'jquery';
import cheerio from 'cheerio';
import {
  LatestHotManga,
  Manga,
  MangaCallback,
  MangaChapters,
  MangaFilters,
  MangaGenre,
  MangaMeta,
  MangaOrder,
  MangaSearch,
  MangaSeeGenres,
  MangaSeeOrderBy,
  MangaStatus,
  MangaType,
  ScrapingOptions,
} from '..';
import automateBrowser from '../functions/automateBrowser';
import success from '../functions/success';
import failure from '../functions/failure';

type InjectedScriptsWindow = {
  $: typeof jquery;
} & typeof window;

interface AngularJSON {
  $$hashKey: string;
  Chapter: string;
  Date: string;
  IndexName: string;
  IsEdd: boolean;
  SeriesID: string;
  SeriesName: string;
}

interface AngularState {
  angular: {
    element: (el: HTMLElement) => {
      scope: () => {
        vm: {
          Pages: number[];
          ChapterURLEncode: (chapter: string) => string;
          IndexName: string;
          CurPathName: string;
          CurChapter: { Directory: string; Chapter: string };
          ChapterImage: (chapter: string) => string;
          PageImage: (page: number) => string;
          HotUpdateJSON: AngularJSON[];
          LatestJSON: AngularJSON[];
          FullDirectory: {
            AllGenres: MangaSeeGenre[];
            Directory: {
              $$hashKey: string;
              g: number[];
              i: string;
              s: string;
              st: string;
            }[];
          };
          Chapters: {
            $$hashKey: string;
            Chapter: string;
            Type: 'Chapter';
            Date: string;
            ChapterName: null | string;
          }[];
        };
      };
    };
  };
}

export type MangaSeeMeta = {
  title: {
    main: string;
    alt: string;
  };
  authors: string[];
  summary: string;
  genres: MangaGenre<MangaSee>[];
  coverImage: string;
  type: MangaType<MangaSee>;
  status: {
    scan: MangaStatus<MangaSee>;
    publish: MangaStatus<MangaSee>;
  };
  chapters: MangaChapters<MangaSee>[];
};

export interface MangaSeeOptions {
  orderBy?: MangaOrder<MangaSee>;
  orderType?: 'ascending' | 'descending';
  translationGroup?: 'any' | 'official';
  status?: {
    scan?: MangaStatus<MangaSee> | 'any';
    publish?: MangaStatus<MangaSee> | 'any';
  };
  type?: MangaType<MangaSee> | 'any';
  genres?: {
    include?: MangaGenre<MangaSee>[];
    exclude?: MangaGenre<MangaSee>[];
  };
}

export type MangaSeeGenre = keyof typeof MangaSeeGenres;

export interface MangaSeeMangaAlt {
  title: string;
  url: string;
  genres: MangaGenre<MangaSee>[];
  coverImage: string;
  status: MangaStatus<MangaSee>;
}
export interface MangaSeeManga {
  title: string;
  url: string;
  status: {
    scan: MangaStatus<MangaSee>;
    publish: MangaStatus<MangaSee>;
  };
  genres: MangaGenre<MangaSee>[];
  coverImage: string;
  updatedAt: Date;
}

export interface MangaSeeLatestHotManga {
  title: string;
  updatedAt: Date;
  url: string;
  coverImage: string;
}

export default class MangaSee {
  private options: ScrapingOptions;

  protected BLOCKED_DOMAINS = [
    'https://static.cloudflareinsights.com/beacon.min.js',
    'https://www.googletagmanager.com/',
    'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/',
    'https://cdnjs.cloudflare.com/ajax/libs/popper.js/',
    'https://www.google.com/',
  ];

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   * Search up a manga from MangaSee
   *
   * @param query - Title of manga. Leave it at null if you don't want to search for a specific title. This parameter accepts either a `string` or `object` containing either or both `title` and `author`
   * @param filters  - Filters to apply when searching for manga
   * @param callback - Callback function
   * @returns Returns an array of mangas from mangasee123.com
   * @example
   * ```js
   * await mangasee.search('chainsaw man');
   * ```
   *
   * @example
   * ```js
   * await mangasee.search({ author: 'Fujimoto Tatsuki' });
   * ```
   *
   * @example
   * ```js
   * await mangasee.search(null, {
   *    genre: { include: ['Fantasy'], exclude: ['Seinen'] },
   *    status: { scan: 'ongoing', publish: 'ongoing' },
   *    orderBy: 'popularity(all_time)',
   *    orderType: 'ascending',
   *    type: 'manga',
   * });
   * ```
   */
  public search(
    query: MangaSearch<MangaSee> = '',
    filters: MangaFilters<MangaSee> = {},
    callback: MangaCallback<Manga<MangaSee>[]> = () => void 0,
  ): Promise<Manga<MangaSee>[]> {
    if (query == null) query = '';
    if (filters == null) filters = {};

    const {
      orderBy = 'A-Z',
      orderType = 'ascending',
      translationGroup = 'any',
      status = { scan: 'any', publish: 'any' },
      type: mangaType = 'any',
      genres: genre = { include: [], exclude: [] },
    } = filters;

    function generateURL() {
      const parsedQuery = (() => {
        // Is the query a string? If so, just return it as a URI component
        if (typeof query === 'string') return `name=${encodeURIComponent(query)}`;

        /**
         * If the query is not a string, extract `title` and `author`
         * and then return the data as a URI component
         *
         * ex: &name=title&author=author
         */
        const params: string[] = [];
        if ('author' in query && query.author != null) params.push(`author=${encodeURIComponent(query.author)}`);
        if ('title' in query && query.title != null) params.push(`name=${encodeURIComponent(query.title)}`);
        return params.join('&');
      })();

      const sort = `sort=${MangaSeeOrderBy[orderBy]}`;

      const desc = (() => {
        if (orderBy === 'popularity(all_time)' || orderBy === 'popularity(monthly)')
          return `desc=${orderType !== 'descending'}`;
        return `desc=${orderType !== 'ascending'}`;
      })();

      const type = mangaType === 'any' ? '' : `type=${mangaType}`;

      const trGroup = translationGroup === 'any' ? '' : `official=yes`;

      const scanStatus =
        status.scan == null || status.scan === 'any'
          ? ''
          : `status=${status.scan === 'paused' ? 'hiatus' : status.scan}`;

      const publishedStatus =
        status.publish == null || status.publish === 'any'
          ? ''
          : `pstatus=${status.publish === 'paused' ? 'hiatus' : status.publish}`;

      const includeGenres =
        genre.include == null || genre.include.length === 0 ? `` : `genre=${genre.include.join(',')}`;

      const excludeGenres =
        genre.exclude == null || genre.exclude.length === 0 ? `` : `genreNo=${genre.exclude.join(',')}`;

      const urlParams = [
        parsedQuery,
        sort,
        desc,
        type,
        trGroup,
        scanStatus,
        publishedStatus,
        includeGenres,
        excludeGenres,
      ]
        .filter((param) => param.length !== 0)
        .join('&');

      return `https://mangasee123.com/search/?${urlParams}`;
    }

    return new Promise(async (res, rej) => {
      try {
        const html = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto(generateURL(), { waitUntil: 'domcontentloaded' });
            await page.addScriptTag({ path: require.resolve('jquery') });
            await page.waitForSelector('a.SeriesName.ng-binding, div.NoResults', { hidden: false, visible: true });

            return await page.evaluate(() => document.documentElement.innerHTML);
          },
          {
            domains: {
              method: 'block',
              value: this.BLOCKED_DOMAINS,
            },
            resource: {
              method: 'unblock',
              type: ['document', 'script'],
            },
          },
        );

        const $ = cheerio.load(html);

        if ($('div.NoResults').length === 1) return success([], callback, res);

        let memo: string[] = [];

        // Get title + manga URL
        const titlesURL = $(`a.SeriesName.ng-binding`)
          .map((_, el) => {
            const anchorEl = $(el);
            const title = anchorEl.text();
            const url = anchorEl.attr('href') || '';
            return { title, url: `https://mangasee123.com${url}` };
          })
          .get();

        // Get manga authors
        const authors: string[][] = [];
        $('div[ng-if="vm.FullDisplay"]:contains("Author") > span').each((_, el) => {
          const author = $(el).text().trim();
          if (author.endsWith(',')) {
            memo = [...memo, author.slice(0, author.length - 1)];
            return;
          }

          if (!author.endsWith(',')) {
            const currentMemo = [...memo, author];
            memo = [];
            authors.push(currentMemo);
          }
        });

        // Get manga statuses
        const statuses = $('div[ng-if="vm.FullDisplay"]:contains("Status") > a')
          .map((_, el) => $(el).text().trim())
          .get()
          .reduce<{ scan?: string; publish?: string }[]>((acc, cV, cI, arr) => {
            const object = arr.slice(cI, cI + 2).map((text) => {
              if (text.endsWith('(Scan)'))
                return { scan: text.replace(' (Scan)', '').replace('Hiatus', 'Paused').toLowerCase() };
              return { publish: text.replace(' (Publish)', '').replace('Hiatus', 'Paused').toLowerCase() };
            });

            if (cI % 2 === 0) acc.push(Object.assign(object[0], object[1]));
            return acc;
          }, []);

        // Get manga updated time
        const updatedAt = $('div[ng-if="vm.FullDisplay"]:contains("Latest") > span')
          .text()
          .trim()
          .slice(2)
          .split('· ')
          .map((date) => new Date(date));

        // Get manga genres
        const genres: string[][] = [];
        $('div.col-md-10.col-8 > div:contains("Genres") > span').each((_, el) => {
          const mangaGenre = $(el).text().trim();
          if (mangaGenre.endsWith(',')) {
            memo = [...memo, mangaGenre.slice(0, mangaGenre.length - 1)];
            return;
          }

          if (!mangaGenre.endsWith(',')) {
            const currentMemo = [...memo, mangaGenre];
            memo = [];
            genres.push(currentMemo);
          }
        });

        const img = $(`a.SeriesName > img`)
          .map((_, el) => {
            const src = $(el).attr('src');
            if (src != null) return src;
          })
          .get();

        const data = titlesURL.map(({ title, url }, i) => ({
          title,
          url,
          coverImage: img[i],
          status: {
            scan: statuses[i].scan as MangaStatus<MangaSee>,
            publish: statuses[i].publish as MangaStatus<MangaSee>,
          },
          genres: genres[i] as (keyof typeof MangaSeeGenres)[],
          updatedAt: updatedAt[i],
        }));

        success(data, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  /**
   *  Get all mangas from the MangaSee directory. This can take 5-10 seconds to process since this is returning 5,000+ mangas.
   *
   * @param callback - Callback function
   * @returns Returns an array of every manga from the MangaSee directory
   * @example
   * ```js
   * const mangas = await mangasee.directory();
   * ```
   */
  public directory(callback: MangaCallback<MangaSeeMangaAlt[]> = () => void 0): Promise<MangaSeeMangaAlt[]> {
    return new Promise(async (res, rej) => {
      try {
        const data = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto('https://mangasee123.com/directory/', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction('window.angular.element(document.body).scope()');

            return await page.evaluate(() => {
              const { angular } = window as typeof window & AngularState;
              const { FullDirectory } = angular.element(document.body).scope().vm;
              return FullDirectory;
            });
          },
          {
            domains: {
              method: 'block',
              value: this.BLOCKED_DOMAINS,
            },
            resource: {
              method: 'unblock',
              type: ['document', 'script'],
            },
          },
        );

        const formattedDirectoryData: MangaSeeMangaAlt[] = data.Directory.map((manga) => {
          const status = (() => {
            switch (manga.st) {
              case 'Complete':
                return 'completed';
              case 'Hiatus':
                return 'paused';
              case 'Ongoing':
              default:
                return 'ongoing';
              case 'Discontinued':
                return 'discontinued';
              case 'Cancelled':
                return 'cancelled';
            }
          })();

          return {
            title: manga.s,
            url: `https://mangasee123.com/manga/${manga.i}`,
            coverImage: `https://cover.nep.li/cover/${manga.i}.jpg`,
            genres: manga.g.map((genre) => data.AllGenres[genre]),
            status,
          };
        });

        success(formattedDirectoryData, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  /**
   * Get a list of mangas that have been recently updated from MangaSee
   *
   * @param callback - Callback function
   * @returns Returns an array of mangas in the latest chapters section in MangaSee's homepage.
   * @example
   *
   * ```js
   * await mangasee.getLatestUpdates();
   * ```
   */
  public getLatestUpdates(
    callback: MangaCallback<LatestHotManga<MangaSee>[]> = () => void 0,
  ): Promise<LatestHotManga<MangaSee>[]> {
    return new Promise(async (res, rej) => {
      try {
        const json = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto('https://mangasee123.com/', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction('window.angular.element(document.body).scope()');
            return await page.evaluate(() => {
              const { angular } = window as typeof window & AngularState;
              return angular.element(document.body).scope().vm.LatestJSON;
            });
          },
          {
            domains: {
              method: 'block',
              value: this.BLOCKED_DOMAINS,
            },
            resource: {
              method: 'unblock',
              type: ['script', 'document'],
            },
          },
        );

        const formattedJson: MangaSeeLatestHotManga[] = json.map((manga) => ({
          title: manga.SeriesName,
          updatedAt: new Date(manga.Date),
          url: `https://mangasee123.com/manga/${manga.IndexName}`,
          coverImage: `https://cover.nep.li/cover/${manga.IndexName}.jpg`,
        }));

        success(formattedJson, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  /**
   * Get the hottest updates from MangaSee
   *
   * @param callback - Callback function
   * @returns Returns an array of mangas in the hottest updates section in MangaSee's homepage.
   * @example
   *
   * ```js
   * await mangasee.getHotUpdates();
   * ```
   */
  public getHotUpdates(
    callback: MangaCallback<LatestHotManga<MangaSee>[]> = () => void 0,
  ): Promise<LatestHotManga<MangaSee>[]> {
    return new Promise(async (res, rej) => {
      try {
        const json = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto('https://mangasee123.com/', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction('window.angular.element(document.body).scope()');
            return await page.evaluate(() => {
              const { angular } = window as typeof window & AngularState;
              return angular.element(document.body).scope().vm.HotUpdateJSON;
            });
          },
          {
            domains: {
              method: 'block',
              value: this.BLOCKED_DOMAINS,
            },
            resource: {
              method: 'unblock',
              type: ['script', 'document'],
            },
          },
        );

        const formattedJson: MangaSeeLatestHotManga[] = json.map((manga) => ({
          title: manga.SeriesName,
          updatedAt: new Date(manga.Date),
          url: `https://mangasee123.com/manga/${manga.IndexName}`,
          coverImage: `https://cover.nep.li/cover/${manga.IndexName}.jpg`,
        }));

        success(formattedJson, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<MangaSee>> = () => void 0,
  ): Promise<MangaMeta<MangaSee>> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Missing argument "url" is required', callback, rej);
      try {
        const data = await automateBrowser(
          this.options,

          async (page) => {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.addScriptTag({ path: require.resolve('jquery') });
            await page.waitForSelector('h1');
            await page.waitForFunction('window.angular.element(document.body).scope()');
            return await page.evaluate(() => {
              const { $, angular } = window as InjectedScriptsWindow & AngularState;
              const vm = angular.element(document.body).scope().vm;
              const title = $('h1').text();
              const alt = $('span.mlabel:contains("Alternate Name(s):")')
                .parent()
                .text()
                .trim()
                .replace('Alternate Name(s): ', '');
              const authors = $('span.mlabel:contains("Author(s):")')
                .siblings()
                .map((_, el) => $(el).text())
                .get();
              const genres = $('span.mlabel:contains("Genre(s):")')
                .siblings()
                .map((_, el) => $(el).text())
                .get() as MangaGenre<MangaSee>[];
              const summary = $('div.top-5.Content').text().trim();
              const type = $('span.mlabel:contains("Type:")').siblings().text().toLowerCase() as MangaType<MangaSee>;
              const _status = $('span.mlabel:contains("Status:")')
                .siblings()
                .map((_, el) => $(el).text().toLowerCase().split(' ')[0])
                .get();
              const status = {
                scan: _status[0] as MangaStatus<MangaSee>,
                publish: _status[1] as MangaStatus<MangaSee>,
              };
              const img =
                document.querySelector('div.col-md-3.top-5 > img.img-fluid.bottom-5')?.getAttribute('src') || '';
              const chapters = angular
                .element(document.body)
                .scope()
                .vm.Chapters.reverse()
                .map((chapter, index) => ({
                  name: chapter.ChapterName || `Chapter ${index}`,
                  url: `https://mangasee123.com/read-online/${vm.IndexName}${vm.ChapterURLEncode('1000115')}`,
                  uploadDate: chapter.Date,
                }))
                .reverse();
              return { title: { main: title, alt }, authors, genres, summary, type, status, coverImage: img, chapters };
            });
          },
          {
            domains: {
              method: 'block',
              value: this.BLOCKED_DOMAINS,
            },
            resource: {
              method: 'unblock',
              type: ['script', 'document'],
            },
          },
        );

        success(
          {
            ...data,
            chapters: data.chapters.map((chapter) => ({ ...chapter, uploadDate: new Date(chapter.uploadDate) })),
          },
          callback,
          res,
        );
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  public getPages(url: string, callback: MangaCallback<string[]> = () => void 0): Promise<string[]> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Missing argument "url" is required', callback, rej);
      try {
        const pages = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForFunction('window.angular.element(document.body).scope()');
            return await page.evaluate(() => {
              const { angular } = window as typeof window & AngularState;
              const $state = angular.element(document.body).scope();
              const iterator: number[] = $state.vm.Pages;
              const title: string = $state.vm.IndexName;
              const baseURL: string = $state.vm.CurPathName;

              /**
               * MangaSee123 uses angular. We can get the chapters very quickly just by accessing the document state.
               */
              const pages = iterator.map(
                (number) =>
                  `https://${baseURL}/manga/${title}/${
                    $state.vm.CurChapter.Directory === '' ? '' : `${$state.vm.CurChapter.Directory}/`
                  }${$state.vm.ChapterImage($state.vm.CurChapter.Chapter)}-${$state.vm.PageImage(number)}.png`,
              );

              return pages;
            });
          },
          {
            domains: {
              method: 'block',
              value: this.BLOCKED_DOMAINS,
            },
            resource: {
              method: 'unblock',
              type: ['script', 'document'],
            },
          },
        );
        success(pages, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }
}
