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
import { parse } from 'date-fns';

type WindowJquery = typeof window & { $: typeof jquery };

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
  genre?: {
    include?: Array<keyof typeof MangaSeeGenres>;
    exclude?: Array<keyof typeof MangaSeeGenres>;
  };
}

export type MangaSeeGenre = keyof typeof MangaSeeGenres;

export interface MangaSeeMangaAlt {
  title: string;
  url: string;
  genres: string[];
  coverImage: string;
  status: 'Ongoing' | 'Complete';
}
export interface MangaSeeManga {
  title: string;
  url: string;
  status: {
    scan: MangaStatus<MangaSee>;
    publish: MangaStatus<MangaSee>;
  };
  genres: keyof typeof MangaSeeGenres;
  coverImage: string;
  updatedAt: Date;
}

export default class MangaSee {
  private options: ScrapingOptions = {};

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
   * @param title - Title of manga. Leave it at null if you don't want to search for a specific title. This parameter accepts either a `string` or `object` containing either or both `title` and `author`
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
    title?: MangaSearch<MangaSee>,
    filters: MangaFilters<MangaSee> = {},
    callback: MangaCallback<Manga<MangaSee>[]> = () => {},
  ): Promise<Manga<MangaSee>[]> {
    const {
      orderBy = 'A-Z',
      orderType = 'ascending',
      translationGroup = 'any',
      status = { scan: 'any', publish: 'any' },
      type: mangaType = 'any',
      genre = { include: [], exclude: [] },
    } = filters;

    function generateURL() {
      const parsedQuery = (() => {
        // Check if its null or undefined...
        if (title == null) return '';

        // Is the query a string? If so, just return it as a URI component
        if (typeof title === 'string') return `name=${encodeURIComponent(title)}`;

        /**
         * If the query is not a string, extract `title` and `author`
         * and then return the data as a URI component
         *
         * ex: &name=title&author=author
         */
        const params: string[] = [];
        if ('author' in title && title.author != null) params.push(`author=${encodeURIComponent(title.author)}`);
        if ('title' in title && title.title != null) params.push(`name=${encodeURIComponent(title.title)}`);
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
            await page.goto(generateURL(), { waitUntil: 'networkidle2' });
            await page.addScriptTag({ path: require.resolve('jquery') });

            return await page.evaluate(() => {
              return document.querySelector('*')?.outerHTML || '';
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

        const $ = cheerio.load(html);

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
          .map((date) => parse(date, 'MM/DD/YYYY', new Date()));

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
          genres: (<unknown>genres[i]) as keyof typeof MangaSeeGenres,
          updatedAt: updatedAt[i],
        }));

        success(data as any, callback, res);
      } catch (e) {
        failure(new Error(e), callback);
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
            await page.goto('https://mangasee123.com/directory/', { waitUntil: 'networkidle2' });
            await page.addScriptTag({ path: require.resolve('jquery') });
            return await page.evaluate(() => {
              const { $ } = window as WindowJquery;
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
            .clone()
            .children()
            .remove()
            .end()
            .map((_, el) => {
              return $(el).text().trim().split(', ');
            })
            .get();
          const firstIndexItemArray = textArr[0].split(' ');
          return {
            title,
            url: `https://mangasee123.com${url}`,
            coverImage: img,
            status: firstIndexItemArray[0] as 'Ongoing' | 'Complete',
            genres: textArr.map((genre, i) => {
              if (i === 0) return firstIndexItemArray[1];
              return genre;
            }),
          };
        });
        success(mangas as any, callback, res);
      } catch (e) {
        failure(new Error(e), callback);
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
      if (url == null) return failure(new Error('"url" is required'), callback);
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
                await page.goto(url, { waitUntil: 'networkidle2' });
                await page.addScriptTag({ path: require.resolve('jquery') });
                return await page.evaluate(() => {
                  const { $ } = window as WindowJquery;
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
        failure(new Error(e), callback);
      }
    });
  }

  public getPages(url: string, callback: MangaCallback<string[]> = () => {}): Promise<string[]> {
    return new Promise(async (res) => {
      try {
        const pages = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.addScriptTag({ path: require.resolve('jquery') });
            return await page.evaluate(() => {
              const { $ } = window as WindowJquery;
              return $('img.img-fluid')
                .map((_, el) => $(el).attr('src'))
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
              type: ['document', 'script', 'image'],
            },
          },
        );
        success(pages, callback, res);
      } catch (e) {
        failure(new Error(e), callback);
      }
    });
  }
}
