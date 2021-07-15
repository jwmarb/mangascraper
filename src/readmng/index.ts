import jquery from 'jquery';
import {
  Manga,
  MangaCallback,
  MangaChapters,
  MangaCoverImage,
  MangaFilters,
  MangaGenre,
  MangaMeta,
  MangaRating,
  MangaSearch,
  MangaStatus,
  MangaType,
  ReadMngGenres,
  ScrapingOptions,
} from '..';
import automateBrowser from '../functions/automateBrowser';
import failure from '../functions/failure';
import success from '../functions/success';
import readHtml from '../functions/readHtml';

export type ReadMngGenre = keyof typeof ReadMngGenres;

type JQueryInjectedWindow = typeof window & {
  $: typeof jquery;
};

export interface ReadMngMeta {
  title: {
    main: string;
    alt: string[];
  };
  genres: MangaGenre<ReadMng>[];
  coverImage: MangaCoverImage;
  type: 'manga' | 'manhua' | 'manhwa';
  views: string;
  status?: 'ongoing' | 'completed';
  summary: string;
  author: string;
  artist?: string;
  rating: MangaRating;
  chapters: MangaChapters<ReadMng>[];
}

export interface ReadMngOptions {
  genres?: {
    include?: MangaGenre<ReadMng>[];
    exclude?: MangaGenre<ReadMng>[];
  };
  status?: MangaStatus<ReadMng>;
  type?: MangaType<ReadMng>;
}

export interface ReadMngManga {
  title: string;
  url: string;
  coverImage: MangaCoverImage;
  genres: MangaGenre<ReadMng>[];
  type: 'manhwa' | 'manhua' | 'manga';
  views: string;
  status?: 'ongoing' | 'completed';
  rating: MangaRating;
}

export default class ReadMng {
  private options: ScrapingOptions;

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   * Get a list of mangas from [readmng](https://www.readmng.com/).
   *
   * @param query - Title, author, or artist. Accepts a `string` by default, but if you want to include an `author`, `artist`, and/or `title`, it must be an object containing those fields.
   * @param filters - Filters you want to apply to query. Do note that Readmng's search can be unreliable sometimes. The manga order is locked by most views since this is readmng's search limitation.
   * @param callback - Callback function
   * @returns Returns at most 50 mangas from [readmng](https://www.readmng.com/).
   * @example
   * ```js
   * await readmng.search();
   * ```
   * ```js
   * await readmng.search({ title: 'The Gamer' });
   * ```
   * ```js
   * await readmng.search(null, { genres: { include: ['Fantasy', 'Seinen'] }});
   * ```
   */
  public search(
    query: MangaSearch<ReadMng> = '',
    filters: MangaFilters<ReadMng> = {},
    callback: MangaCallback<Manga<ReadMng>[]> = () => void 0,
  ): Promise<Manga<ReadMng>[]> {
    if (query == null) query = '';
    if (filters == null) filters = {};

    const { genres, status = 'any', type = 'any' } = filters;

    const genresIncludeCnt = genres?.include?.length ?? 0;
    const genresExcludeCnt = genres?.exclude?.length ?? 0;

    const mangaInput = (() => {
      if (typeof query === 'string') return query;
      if ('title' in query && query.title) return query.title;
      return '';
    })();
    const authorInput = query && typeof query === 'object' && query.author ? query.author : '';
    const artistInput = query && typeof query === 'object' && query.artist ? query.artist : '';

    return new Promise(async (res) => {
      try {
        const data = (await automateBrowser(
          this.options,
          async (page) => {
            await page.goto('https://www.readmng.com/advanced-search', { waitUntil: 'domcontentloaded' });
            await page.addScriptTag({ path: require.resolve('jquery') });

            await page.waitForSelector(
              'input[name="manga-name"], input[name="author-name"], input[name="artist-name"], button[type="submit"].btn.btn-danger',
            );

            await page.$eval(
              'input[name="manga-name"]',
              (element, mangaInput) => ((element as HTMLInputElement).value = <string>mangaInput),
              mangaInput,
            );
            await page.$eval(
              'input[name="author-name"]',
              (element, authorInput) => ((element as HTMLInputElement).value = <string>authorInput),
              authorInput,
            );
            await page.$eval(
              'input[name="artist-name"]',
              (element, artistInput) => ((element as HTMLInputElement).value = <string>artistInput),
              artistInput,
            );

            if (genres) {
              if (genres.include)
                for (let i = 0; i < genresIncludeCnt; i++) {
                  await page.$eval(`span[data-id="${ReadMngGenres[genres.include[i]]}"]`, (element) =>
                    (element as HTMLButtonElement).click(),
                  );
                }

              if (genres.exclude)
                for (let i = 0; i < genresExcludeCnt; i++) {
                  await page.$eval(`span[data-id="${ReadMngGenres[genres.exclude[i]]}"]`, (element) => {
                    (element as HTMLButtonElement).click();
                    (element as HTMLButtonElement).click();
                  });
                }
            }

            switch (type) {
              case 'any':
              default:
                break;
              case 'manga':
                await page.$eval('input[name="type"][value="japanese"]', (element) =>
                  (element as HTMLInputElement).click(),
                );
                break;
              case 'manhua':
                await page.$eval('input[name="type"][value="chinese"]', (element) =>
                  (element as HTMLInputElement).click(),
                );
                break;
              case 'manhwa':
                await page.$eval('input[name="type"][value="korean"]', (element) =>
                  (element as HTMLInputElement).click(),
                );
                break;
            }

            switch (status) {
              case 'any':
              default:
                break;
              case 'ongoing':
                await page.$eval('input[name="status"][value="ongoing"]', (element) =>
                  (element as HTMLInputElement).click(),
                );
                break;
              case 'completed':
                await page.$eval('input[name="status"][value="completed"]', (element) =>
                  (element as HTMLInputElement).click(),
                );
                break;
            }

            await page.$eval('button[type="submit"].btn.btn-danger', (element) =>
              (element as HTMLButtonElement).click(),
            );

            await page.waitForSelector('h2 > a[title], div.alert.alert-warning');

            return await page.evaluate(() => {
              const { $ } = window as JQueryInjectedWindow;

              if ($('div.alert.alert-warning').get().length === 1) return [];
              const titles: {
                title: string;
                url: string;
              }[] = $('h2 > a[title]')
                .map((_, el) => {
                  const anchorEl = $(el);
                  const title = anchorEl.text();
                  const url = anchorEl.attr('href') || '';
                  return {
                    title,
                    url,
                  };
                })
                .get();

              const coverImages: MangaCoverImage[] = $('div.left > a > img')
                .map((_, el) => {
                  const imgEl = $(el);
                  const src = imgEl.attr('src');
                  const alt = imgEl.attr('alt') || '';
                  return {
                    url: src,
                    alt,
                  };
                })
                .get();

              const genres: MangaGenre<ReadMng>[][] = $('div.right > dl > dd:has("a")')
                .map((_, el) => {
                  const ddEl = $(el);
                  return [
                    ddEl
                      .children()
                      .map((_, el) => {
                        const anchorEl = $(el);
                        const genre = anchorEl.text().trim();
                        return genre as MangaGenre<ReadMng>;
                      })
                      .get(),
                  ];
                })
                .get();

              const dlContainer = $('div.right > dl > dt:contains("Status:")');

              const statuses: (ReadMngManga['status'] | '')[] = dlContainer
                .map((_, el) => {
                  const ddEl = $(el);
                  const status = ddEl.siblings('dd:eq(0)').text().trim().toLowerCase();
                  return status === '-' ? null : <ReadMngManga['status']>status;
                })
                .get();

              const types: ReadMngManga['type'][] = dlContainer
                .map((_, el) => {
                  const ddEl = $(el);
                  const type = ddEl.siblings('dd:eq(2)').text();
                  switch (type) {
                    case 'Chinese':
                      return 'manhua';
                    case 'Korean':
                      return 'manhwa';
                    case 'Japanese':
                      return 'manga';
                  }
                })
                .get();

              const views: string[] = dlContainer
                .map((_, el) => {
                  const ddEl = $(el);
                  const views = ddEl.siblings('dd:eq(3)').text();
                  return views;
                })
                .get();

              const ratings = $('div.meta > ul')
                .map((_, el) => {
                  const ulEl = $(el);
                  const smileyCt = Number(ulEl.children('li:eq(0)').text());
                  const sadCt = Number(ulEl.children('li:eq(2)').text());
                  const voteCountNum = sadCt + smileyCt;
                  const voteCount = voteCountNum.toLocaleString();
                  const rating_percentage =
                    voteCountNum > 0 && sadCt < smileyCt
                      ? `${((smileyCt / voteCountNum) * 100).toFixed(2)}%`
                      : undefined;
                  const rating_stars =
                    voteCountNum > 0 && sadCt < smileyCt
                      ? `${(Number(Number(rating_percentage?.slice(0, -1)) / 10) / 2).toFixed(1)} / 5`
                      : undefined;
                  return {
                    sourceRating: 'readMng.com',
                    voteCount,
                    rating_percentage,
                    rating_stars,
                  };
                })
                .get();

              return titles.map(({ title, url }, i) => ({
                title,
                url,
                coverImage: coverImages[i],
                genres: genres[i],
                type: types[i],
                status: statuses[i],
                views: views[i],
                rating: ratings[i],
              }));
            });
          },
          { resource: { method: 'unblock', type: ['document', 'script', 'xhr'] } },
        )) as Manga<ReadMng>[];
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
   */
  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<ReadMng>> = () => void 0,
  ): Promise<MangaMeta<ReadMng>> {
    return new Promise(async (res) => {
      if (url == null) return failure('Missing argument "url" is required', callback);

      try {
        const $ = await readHtml(url, this.options);

        const title = $('h1').text();

        const dlEl = $('dl.dl-horizontal');

        const altTitles = dlEl.children('dd:eq(0)').text().split(', ');

        const status = (() => {
          const text = dlEl.children('dd:eq(1)').text().toLowerCase();
          if (text === '-') return undefined;
          return text;
        })() as 'ongoing' | 'completed';

        const genres: MangaGenre<ReadMng>[] = dlEl
          .children('dd:eq(2)')
          .children('a')
          .map((_, el) => $(el).attr('title') as MangaGenre<ReadMng>)
          .get();

        const type = (() => {
          switch (dlEl.children('dd:eq(3)').text()) {
            case 'Japanese':
            default:
              return 'manga';
            case 'Korean':
              return 'manhwa';
            case 'Chinese':
              return 'manhua';
          }
        })();

        const views = dlEl.children('dd:eq(4)').text();

        const summary = $('li.movie-detail').text().trim();

        const author = $('li:contains("Author")').siblings('li').children('a').text();

        const artist = $('li:contains("Artist")').siblings('li').children('a').text();

        const ulEl = $('div.rm_rating > ul');

        const likeCnt = Number(ulEl.children('li:eq(0)').text().trim());
        const dislikeCnt = Number(ulEl.children('li:eq(2)').text().trim());

        const rating: MangaRating = (() => {
          const voteCountNum = dislikeCnt + likeCnt;
          const voteCount = voteCountNum.toLocaleString();
          const rating_percentage =
            voteCountNum > 0 && dislikeCnt < likeCnt ? `${((likeCnt / voteCountNum) * 100).toFixed(2)}%` : undefined;
          const rating_stars =
            voteCountNum > 0 && dislikeCnt < likeCnt
              ? `${(Number(Number(rating_percentage?.slice(0, -1)) / 10) / 2).toFixed(1)} / 5`
              : undefined;
          return {
            sourceRating: 'readMng.com',
            voteCount,
            rating_percentage,
            rating_stars,
          };
        })();

        const chapters: MangaChapters<ReadMng>[] = $('ul.chp_lst > li > a')
          .map((_, el) => {
            const anchorEl = $(el);
            const url = `${anchorEl.attr('href')}/all-pages`;
            const uploadWhen = anchorEl.children('span.dte').text().trim().toLowerCase();
            const name = anchorEl.children('span.val').children().remove().end().text().trim();
            return {
              name,
              url,
              uploadWhen,
            };
          })
          .get();

        const coverImage: MangaCoverImage = (() => {
          const imgEl = $('div.col-md-3 > img');
          const src = imgEl.attr('src');
          const alt = imgEl.attr('alt') || '';
          return {
            url: src,
            alt,
          };
        })();

        success(
          {
            title: {
              main: title,
              alt: altTitles,
            },
            coverImage,
            author,
            artist,
            genres,
            status,
            summary,
            views,
            rating,
            type,
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
   * Get pages in the form of image urls from a manga chapter
   *
   * @param url - URL of manga chapter
   * @param callback - Callback function
   * @returns Returns an array of img urls from the manga chapter.
   */
  public getPages(url: string, callback: MangaCallback<string[]> = () => void 0): Promise<string[]> {
    return new Promise(async (res) => {
      if (url == null) return failure('Missing argument "url" is required', callback);

      try {
        const $ = await readHtml(url, this.options);
        const pages = $('div.page_chapter > img')
          .map((_, el) => $(el).attr('src'))
          .get();
        success(pages, callback, res);
      } catch (e) {
        failure(e, callback);
      }
    });
  }
}
