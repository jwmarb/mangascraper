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

type MangaSeeAngularStateMangaType = 'Manga' | 'Manhua' | 'Manhwa' | 'Doujinshi' | 'OEL' | 'One-shot';
type MangaSeeAngularStateStatus = 'Cancelled' | 'Complete' | 'Discontinued' | 'Hiatus' | 'Ongoing';

type AngularStateSearchDirectoryManga = {
  $$hashKey: string;
  a: string[]; // Authors
  al: string[]; // Alternate Titles
  g: MangaGenre<MangaSee>[]; // Genres
  h: boolean; // Hot (is manga trending? If so, true - else false)
  i: string; // manga slug
  l: string; // for ChapterURLEncode() function.
  ls: string; // Chapter Date
  o: 'yes' | 'no'; // Official Translation
  ps: MangaSeeAngularStateStatus; // Publish status
  s: string; // Series name
  ss: MangaSeeAngularStateStatus; // Scan status
  t: MangaSeeAngularStateMangaType; // Series type
  y: string; // Manga year created
  v: string; // Most popular (all time)
  vm: string; // Most popular (monthly)
};

interface AngularStateSearch {
  angular: {
    element: (el: HTMLElement) => {
      scope: () => {
        vm: {
          Directory: AngularStateSearchDirectoryManga[];
        };
      };
    };
  };
}

interface AngularState {
  angular: {
    element: (el: HTMLElement) => {
      scope: () => {
        vm: {
          Pages: number[];
          ChapterURLEncode: (chapter: string) => string;
          ChapterDisplay: (chapter: string) => number | string;
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
      orderType = 'descending',
      translationGroup = 'any',
      status = { scan: 'any', publish: 'any' },
      type: mangaType = 'any',
      genres = { include: [], exclude: [] },
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
        genres.include == null || genres.include.length === 0 ? `` : `genre=${genres.include.join(',')}`;

      const excludeGenres =
        genres.exclude == null || genres.exclude.length === 0 ? `` : `genreNo=${genres.exclude.join(',')}`;

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
        const data = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto('https://mangasee123.com/search', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction('window.angular.element(document.body).scope().vm.Directory');
            return await page.evaluate(() => {
              const { angular } = window as typeof window & AngularStateSearch;

              const $state = angular.element(document.body).scope();

              return $state.vm.Directory;
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

        function convertToAngularStatus(status?: MangaStatus<MangaSee> | 'any'): MangaSeeAngularStateStatus | null {
          switch (status) {
            case 'cancelled':
              return 'Cancelled';
            case 'completed':
              return 'Complete';
            case 'discontinued':
              return 'Discontinued';
            case 'ongoing':
              return 'Ongoing';
            case 'paused':
              return 'Hiatus';
            case 'any':
            default:
              return null;
          }
        }

        const $translationGroup = (() => {
          switch (translationGroup) {
            case 'any':
            default:
              return null;
            case 'official':
              return 'yes';
          }
        })();
        const $scanStatus = convertToAngularStatus(status.scan);
        const $publishStatus = convertToAngularStatus(status.publish);
        const $type: MangaSeeAngularStateMangaType | null = (() => {
          switch (mangaType) {
            case 'doujinshi':
              return 'Doujinshi';
            case 'manga':
              return 'Manga';
            case 'manhua':
              return 'Manhua';
            case 'manhwa':
              return 'Manhwa';
            case 'any':
            default:
              return null;
          }
        })();

        function filterQuery(manga: AngularStateSearchDirectoryManga) {
          if (query == null) return true;
          if (typeof query === 'string') return manga.s.toLowerCase().includes(query.toLowerCase().trim());
          const queryFilters = [];
          if ('title' in query && query.title)
            queryFilters.push(manga.s.toLowerCase().includes(query.title.toLowerCase().trim()));
          if ('author' in query && query.author) {
            const { author } = query;
            queryFilters.push(manga.a.some((mangaka) => mangaka.toLowerCase().includes(author.toLowerCase().trim())));
          }
          return queryFilters.every((boolean) => boolean === true);
        }

        function hasGenres(manga: AngularStateSearchDirectoryManga) {
          const { include } = genres;
          if (include == null) return true;
          const mangaGenres = manga.g.map((genre) => include.indexOf(genre) !== -1);
          return mangaGenres.filter((validGenre) => validGenre).length === include.length;
        }

        function convertStatusToMatchMangaType(status: MangaSeeAngularStateStatus): MangaStatus<MangaSee> {
          switch (status) {
            case 'Cancelled':
              return 'cancelled';
            case 'Complete':
              return 'completed';
            case 'Discontinued':
              return 'discontinued';
            case 'Hiatus':
              return 'paused';
            case 'Ongoing':
              return 'ongoing';
          }
        }

        const filteredArray = data.filter(
          (manga) =>
            filterQuery(manga) &&
            hasGenres(manga) &&
            (genres.exclude && genres.exclude.length > 0
              ? manga.g.every((genre) => genres.exclude?.every((genreExcluded) => genreExcluded !== genre))
              : true) &&
            ($scanStatus ? manga.ss === $scanStatus : true) &&
            ($publishStatus ? manga.ps === $publishStatus : true) &&
            ($type ? manga.t === $type : true) &&
            ($translationGroup ? manga.o === $translationGroup : true),
        );

        function arrangeFilteredArray(array: typeof filteredArray): typeof filteredArray {
          switch (orderBy) {
            case 'A-Z':
              return orderType === 'descending' ? array.sort() : array.sort().reverse();
            case 'latest_updates':
              return orderType === 'descending'
                ? array.sort((a, b) => {
                    const parsedA = Date.parse(a.ls);
                    const parsedB = Date.parse(b.ls);
                    return parsedB - parsedA;
                  })
                : array.sort((a, b) => {
                    const parsedA = Date.parse(a.ls);
                    const parsedB = Date.parse(b.ls);
                    return parsedA - parsedB;
                  });
            case 'popularity(all_time)':
              return orderType === 'descending'
                ? array.sort((a, b) => {
                    return Number(b.v) - Number(a.v);
                  })
                : array.sort((a, b) => {
                    return Number(a.v) - Number(b.v);
                  });
            case 'popularity(monthly)':
              return orderType === 'descending'
                ? array.sort((a, b) => {
                    return Number(b.vm) - Number(a.vm);
                  })
                : array.sort((a, b) => {
                    return Number(a.vm) - Number(b.vm);
                  });
            case 'year_released':
              return orderType === 'ascending'
                ? array.sort((a, b) => {
                    return Number(a.y) - Number(b.y);
                  })
                : array
                    .sort((a, b) => {
                      return Number(a.y) - Number(b.y);
                    })
                    .reverse();
          }
        }
        // const html = await automateBrowser(
        //   this.options,
        //   async (page) => {
        //     await page.goto(generateURL(), { waitUntil: 'domcontentloaded' });
        //     await page.addScriptTag({ path: require.resolve('jquery') });
        //     await page.waitForSelector('a.SeriesName.ng-binding, div.NoResults', { hidden: false, visible: true });

        //     return await page.evaluate(() => document.documentElement.innerHTML);
        //   },
        //   {
        //     domains: {
        //       method: 'block',
        //       value: this.BLOCKED_DOMAINS,
        //     },
        //     resource: {
        //       method: 'unblock',
        //       type: ['document', 'script'],
        //     },
        //   },
        // );

        // const $ = cheerio.load(html);

        // if ($('div.NoResults').length === 1) return success([], callback, res);

        // let memo: string[] = [];

        // // Get title + manga URL
        // const titlesURL = $(`a.SeriesName.ng-binding`)
        //   .map((_, el) => {
        //     const anchorEl = $(el);
        //     const title = anchorEl.text();
        //     const url = anchorEl.attr('href') || '';
        //     return { title, url: `https://mangasee123.com${url}` };
        //   })
        //   .get();

        // // Get manga authors
        // const authors: string[][] = [];
        // $('div[ng-if="vm.FullDisplay"]:contains("Author") > span').each((_, el) => {
        //   const author = $(el).text().trim();
        //   if (author.endsWith(',')) {
        //     memo = [...memo, author.slice(0, author.length - 1)];
        //     return;
        //   }

        //   if (!author.endsWith(',')) {
        //     const currentMemo = [...memo, author];
        //     memo = [];
        //     authors.push(currentMemo);
        //   }
        // });

        // // Get manga statuses
        // const statuses = $('div[ng-if="vm.FullDisplay"]:contains("Status") > a')
        //   .map((_, el) => $(el).text().trim())
        //   .get()
        //   .reduce<{ scan?: string; publish?: string }[]>((acc, cV, cI, arr) => {
        //     const object = arr.slice(cI, cI + 2).map((text) => {
        //       if (text.endsWith('(Scan)'))
        //         return { scan: text.replace(' (Scan)', '').replace('Hiatus', 'Paused').toLowerCase() };
        //       return { publish: text.replace(' (Publish)', '').replace('Hiatus', 'Paused').toLowerCase() };
        //     });

        //     if (cI % 2 === 0) acc.push(Object.assign(object[0], object[1]));
        //     return acc;
        //   }, []);

        // // Get manga updated time
        // const updatedAt = $('div[ng-if="vm.FullDisplay"]:contains("Latest") > span')
        //   .text()
        //   .trim()
        //   .slice(2)
        //   .split('· ')
        //   .map((date) => new Date(date));

        // // Get manga genres
        // const genres: string[][] = [];
        // $('div.col-md-10.col-8 > div:contains("Genres") > span').each((_, el) => {
        //   const mangaGenre = $(el).text().trim();
        //   if (mangaGenre.endsWith(',')) {
        //     memo = [...memo, mangaGenre.slice(0, mangaGenre.length - 1)];
        //     return;
        //   }

        //   if (!mangaGenre.endsWith(',')) {
        //     const currentMemo = [...memo, mangaGenre];
        //     memo = [];
        //     genres.push(currentMemo);
        //   }
        // });

        // const img = $(`a.SeriesName > img`)
        //   .map((_, el) => {
        //     const src = $(el).attr('src');
        //     if (src != null) return src;
        //   })
        //   .get();

        // const data = titlesURL.map(({ title, url }, i) => ({
        //   title,
        //   url,
        //   coverImage: img[i],
        //   status: {
        //     scan: statuses[i].scan as MangaStatus<MangaSee>,
        //     publish: statuses[i].publish as MangaStatus<MangaSee>,
        //   },
        //   genres: genres[i] as (keyof typeof MangaSeeGenres)[],
        //   updatedAt: updatedAt[i],
        // }));

        success(
          arrangeFilteredArray(filteredArray).map((manga) => ({
            title: manga.s,
            coverImage: `https://cover.nep.li/cover/${manga.i}.jpg`,
            url: `https://mangasee123.com/manga/${manga.i}`,
            genres: manga.g,
            status: {
              scan: convertStatusToMatchMangaType(manga.ss),
              publish: convertStatusToMatchMangaType(manga.ps),
            },
            updatedAt: new Date(manga.ls),
          })),
          callback,
          res,
        );
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
                .map((chapter) => ({
                  name: chapter.ChapterName || `Chapter ${vm.ChapterDisplay(chapter.Chapter)}`,
                  url: `https://mangasee123.com/read-online/${vm.IndexName}${vm.ChapterURLEncode(chapter.Chapter)}`,
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
