import {
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
import jquery from 'jquery';
import cheerio from 'cheerio';
import success from '../functions/success';
import failure from '../functions/failure';
import automateBrowsers from '../functions/automateBrowsers';

type InjectedScriptsWindow = {
  $: typeof jquery;
} & typeof window;

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
    scan?: MangaStatus<MangaSee>;
    publish?: MangaStatus<MangaSee>;
  };
  type?: MangaType<MangaSee>;
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
  status: 'ongoing' | 'complete';
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
        genre: { include: ['Fantasy'], exclude: ['Seinen'] },
        status: { scan: 'ongoing', publish: 'ongoing' },
        orderBy: 'popularity(all_time)',
        orderType: 'ascending',
        type: 'manga',
    });
   * ```
   */
  public search(
    query: MangaSearch<MangaSee> = '',
    filters: MangaFilters<MangaSee> = {},
    callback: MangaCallback<Manga<MangaSee>[]> = () => {},
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
          return `desc=${orderType === 'descending' ? false : true}`;
        return `desc=${orderType === 'ascending' ? false : true}`;
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
        genre.include == null || genre.include.length == 0 ? `` : `genre=${genre.include.join(',')}`;

      const excludeGenres =
        genre.exclude == null || genre.exclude.length == 0 ? `` : `genreNo=${genre.exclude.join(',')}`;

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

    return new Promise(async (res) => {
      try {
        const html = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto(generateURL(), { waitUntil: 'domcontentloaded' });
            await page.addScriptTag({ path: require.resolve('jquery') });
            await page.waitForSelector('a.SeriesName.ng-binding, div.NoResults');

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
            return;
          }
        });

        // Get manga statuses
        const statuses = $('div[ng-if="vm.FullDisplay"]:contains("Status") > a')
          .map((_, el) => $(el).text().trim())
          .get()
          .reduce<Array<{ scan: string; publish: string }>>((acc, cV, cI, arr) => {
            const object = arr.slice(cI, cI + 2).map((text) => {
              if (text.endsWith('(Scan)'))
                return { scan: text.replace(' (Scan)', '').replace('Hiatus', 'Paused').toLowerCase() };
              else return { publish: text.replace(' (Publish)', '').replace('Hiatus', 'Paused').toLowerCase() };
            });

            if (cI % 2 === 0) acc.push(Object.assign(object[0], object[1]) as any);
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
          const genre = $(el).text().trim();
          if (genre.endsWith(',')) {
            memo = [...memo, genre.slice(0, genre.length - 1)];
            return;
          }

          if (!genre.endsWith(',')) {
            const currentMemo = [...memo, genre];
            memo = [];
            genres.push(currentMemo);
            return;
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
          genres: (<unknown>genres[i]) as (keyof typeof MangaSeeGenres)[],
          updatedAt: updatedAt[i],
        }));

        success(data, callback, res);
      } catch (e) {
        failure(e, callback);
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
  public directory(callback: MangaCallback<MangaSeeMangaAlt[]> = () => {}): Promise<MangaSeeMangaAlt[]> {
    return new Promise(async (res) => {
      try {
        const data = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto('https://mangasee123.com/directory/', { waitUntil: 'domcontentloaded' });
            await page.addScriptTag({ path: require.resolve('jquery') });
            await page.waitForSelector('a[href="/manga/Zui-Wu-Dao"]');
            return await page.evaluate(() => {
              const { $ } = window as InjectedScriptsWindow;
              return $(`div.top-15 > a`)
                .map((_, el) => {
                  const element = $(el);
                  const title = element.text();
                  const url = element.attr('href') || '';
                  const tooltip = element.attr('title') || '';

                  return { title, url, tooltip };
                })
                .get();
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

        const mangas = data.map(({ tooltip, url, title }) => {
          const $ = cheerio.load(tooltip);
          const divElement = $('div');
          const img = divElement.children('img').attr('src') || '';
          const textArr = divElement
            .children()
            .remove()
            .end()
            .map((_, el) => $(el).text().trim().split(', '))
            .get();
          const firstIndexItemArray = textArr[0].split(' ');
          return {
            title,
            url: `https://mangasee123.com${url}`,
            coverImage: img,
            status: firstIndexItemArray[0].toLowerCase() as 'ongoing' | 'complete',
            genres: textArr.map((genre, i) => {
              if (i === 0) return firstIndexItemArray[1];
              return genre;
            }) as MangaGenre<MangaSee>[],
          };
        });
        success(mangas, callback, res);
      } catch (e) {
        failure(e, callback);
      }
    });
  }

  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<MangaSee>> = () => {},
  ): Promise<MangaMeta<MangaSee>> {
    const xml_document = (() => {
      return url.replace('/manga/', '/rss/') + '.xml';
    })();

    return new Promise(async (res) => {
      if (url == null) return failure('Missing argument "url" is required', callback);
      try {
        /**
         * Runs tabs in parallization. Pretty cool, right?
         */
        const [data, [xmlData, chapterURLs]]: [Omit<MangaMeta<MangaSee>, 'chapters'>, [string, string[]]] =
          await automateBrowsers(this.options, [
            {
              network: {
                domains: {
                  method: 'block',
                  value: this.BLOCKED_DOMAINS,
                },
                resource: {
                  method: 'unblock',
                  type: ['script', 'document'],
                },
              },
              callback: async (page) => {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                await page.addScriptTag({ path: require.resolve('jquery') });
                await page.waitForSelector('h1');
                return await page.evaluate(() => {
                  const { $ } = window as InjectedScriptsWindow;
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
                    .get();
                  const summary = $('div.top-5.Content').text().trim();
                  const type = $('span.mlabel:contains("Type:")').siblings().text().toLowerCase();
                  const _status = $('span.mlabel:contains("Status:")')
                    .siblings()
                    .map((_, el) => $(el).text().toLowerCase().split(' ')[0])
                    .get();
                  const status = { scan: _status[0], publish: _status[1] };
                  const img = document.querySelector('img.img-fluid')?.getAttribute('src') || '';
                  return { title: { main: title, alt }, authors, genres, summary, type, status, coverImage: img };
                });
              },
            },
            {
              callback: async (page) => {
                await page.goto(xml_document, { waitUntil: 'domcontentloaded' });
                return await page.evaluate(() => [
                  document.querySelector('*')?.outerHTML || '',
                  Array.from(document.querySelectorAll('item > link')).map((url) =>
                    url.innerHTML.replace('-page-1', ''),
                  ),
                ]);
              },
            },
          ]);

        const $ = cheerio.load(xmlData);

        const title = $('title').first().text() + ' ';

        const chapterTitles = $('item > title').map((_, el) => $(el).text().replace(title, ''));
        const chapterDates = $('pubDate').map((_, el) => new Date($(el).text()));

        success(
          {
            ...data,
            chapters: chapterURLs.map((url, i) => ({
              name: chapterTitles[i],
              url,
              uploadDate: chapterDates[i],
            })),
          },
          callback,
          res,
        );
      } catch (e) {
        failure(e, callback);
      }
    });
  }

  public getPages(url: string, callback: MangaCallback<string[]> = () => {}): Promise<string[]> {
    return new Promise(async (res) => {
      if (url == null) return failure('Missing argument "url" is required', callback);
      try {
        const pages = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForFunction('window.angular.element(document.body).scope()');
            return await page.evaluate(() => {
              const { angular } = window as InjectedScriptsWindow & { angular: any };
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
                    $state.vm.CurChapter.Directory === '' ? '' : $state.vm.CurChapter.Directory + '/'
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
        failure(e, callback);
      }
    });
  }
}
