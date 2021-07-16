import { parse } from 'date-fns';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import {
  MangaCallback,
  MangaCoverImage,
  MangaChapters,
  MangaMeta,
  MangaFilters,
  MangaRating,
  ManganatoGenres,
  MangaGenre,
  MangaSearch,
  Manga,
  MangaGenreFilters,
  ScrapingOptions,
  MangaOrder,
  MangaStatus,
} from '..';
import splitAltTitles from '../functions/splitAltTitles';

export type ManganatoQuery = { keywords: 'author' | 'title' | 'alt_title' | 'everything'; search: string } | string;

export interface ManganatoManga {
  title: string;
  url: string;
  authors: string[];
  updatedAt: Date;
  views: string;
  coverImage: MangaCoverImage;
}

export interface ManganatoOptions {
  genres?: { include?: ManganatoGenre[]; exclude?: ManganatoGenre[] };
  status?: MangaStatus<Manganato>;
  orderBy?: MangaOrder<Manganato>;
  page?: number;
}

export type ManganatoGenre = keyof typeof ManganatoGenres;

export default class Manganato {
  private options: ScrapingOptions;

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   * Search up a manga from Manganato
   *
   * @param query - Title of manga. By default, it searches for all mangas that have matching keywords. If you want to only search for a specific keyword (such as author name only), pass in an object with the key `keywords` containing either values: `author`, `artist`, `title`.
   * ```js
   * await manganato.search({ keywords: 'title', search: 'YOUR TITLE' });
   * ```
   * @param filters - Filters to apply when searching up the manga.
   * ```js
   * await manganato.search(null, { genres: { include: ["Comedy"], exclude: ["Action"] } });
   * ```
   * @param callback - Callback function
   * @returns Returns an array of manga from manganato
   * @example
   * ```js
   * import { Manganato } from "@specify_/mangascraper";
   * const manganato = new Manganato();
   *
   * (async () => {
   *  const mangas = manganato.search({ title: "black clover" });
   *  console.log(mangas); // Output: [{ title: "Black Clover" ...}, ... ]
   * })();
   * ```
   */
  public search(
    query: MangaSearch<Manganato> = '',
    filters: MangaFilters<Manganato> = {},
    callback: MangaCallback<Manga<Manganato>[]> = () => void 0,
  ): Promise<Manga<Manganato>[]> {
    if (query == null) query = '';
    if (filters == null) filters = {};
    const { genres = {}, status = 'any', orderBy = 'latest_updates', page = 1 } = filters;

    function generateURL(): string {
      let includeGenres = ''; // short for genre_includes
      let excludeGenres = ''; // short for genre_excludes
      const keyw: string = (() => {
        if (query == null) return '';
        if (typeof query === 'string') return `keyw=${query.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const { search, keywords } = query;
        if (keywords === 'title') return `keyw=${search.replace(/[^a-zA-Z0-9]/g, '_')}`;
        if (keywords === 'author') return `keyw=${search.replace(/[^a-zA-Z0-9]/g, '_')}&keyt=author`;
        if (keywords === 'alt_title') return `keyw=${search.replace(/[^a-zA-Z0-9]/g, '_')}&keyt=alternative`;
        return `keyw=${search.replace(/[^a-zA-Z0-9]/g, '_')}`;
      })(); // Basically search query for manganato
      const sts = `sts=${status === 'any' ? 'all' : status}` || ''; // short for status
      const orby = (() => {
        /** Converts 'orderBy' into an argument manganato can use for its filters */
        switch (orderBy) {
          case 'A-Z':
            return 'orby=az';
          case 'new_manga':
            return 'orby=newest';
          case 'latest_updates':
            return '';
          case 'most_views':
            return 'orby=topview';
          default:
            return '';
        }
      })(); // short for Order By

      /** Check if there is a genre object */
      if (genres != null) {
        /** Put each genre from 'includes' into 'genre_includes' */
        includeGenres =
          (genres.include && `g_i=_${genres.include.map((genre) => ManganatoGenres[genre]).join('_')}_`) || '';

        /** Put each genre from 'excludes' into 'genre_excludes' */
        excludeGenres =
          (genres.exclude && `g_e=_${genres.exclude.map((genre) => ManganatoGenres[genre]).join('_')}_`) || '';
      }
      const urlArgs: string[] = [includeGenres, excludeGenres, sts, orby, keyw].filter((arg) => arg.length > 0);

      return `https://manganato.com/advanced_search?s=all&${urlArgs.join('&')}&page=${page}`;
    }
    return new Promise(async (res, rej) => {
      if (page == null) return failure('Missing argument "page" is required', callback, rej);
      if (page <= 0) return failure('"page" must be greater than 0', callback, rej);

      try {
        /** Parse HTML document */
        const $ = await readHtml(generateURL(), this.options);

        /** Get manga URLs and titles */
        const titleURLs = $(`div.panel-content-genres > div.content-genres-item > div.genres-item-info > h3 > a`)
          .map((_, element) => {
            const title = $(element).text();
            const url = $(element).attr('href');
            if (title != null && url != null) return { title, url };
          })
          .get();

        /** Get manga author(s) */
        const authors: string[][] = $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-author`,
        )
          .map((_, element) => [$(element).text().split(', ')])
          .get();

        /** Get manga date */
        const updatedAt: Date[] = $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-time`,
        )
          .map((_, element) => parse($(element).text(), 'MMM dd,yy', new Date()))
          .get();

        /** Get manga views */
        const views: string[] = $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-view`,
        )
          .map((_, element) => $(element).text())
          .get();

        /** Get manga cover image */
        const coverImage: MangaCoverImage[] = $(
          `div.panel-content-genres > div.content-genres-item > a.genres-item-img > img`,
        )
          .map((_, element) => {
            const img = $(element).attr('src');
            const alt = $(element).attr('alt');
            if (alt != null) return { url: img, alt };
          })
          .get();

        const mangaList: Manga<Manganato>[] = titleURLs.map(({ title, url }, i) => ({
          title,
          url,
          authors: authors[i],
          coverImage: coverImage[i],
          updatedAt: updatedAt[i],
          views: views[i],
        }));

        success(mangaList, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  /**
   * Gets metadata of manga such as the genre, authors, chapters, etc.
   *
   * @param url - URL of manga
   * @param callback - Callback function
   * @returns Returns metadata of manga
   * @example
   * ```js
   * import { MangaNato } from "@specify_/mangascraper";
   *
   * const manganato = new MangaNato();
   *
   * async function test() {
   *  const meta = await manganato.getMangaMeta("https://manganato.com/manga-jk986519");
   *  console.log(meta);
   * }
   *
   * test(); // Output: { title: { 'Utakata No Minato', alt: [ 'Minato of the Foam', 'ウタカタノミナト' ] } ... }
   * ```
   */
  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<Manganato>> = () => void 0,
  ): Promise<MangaMeta<Manganato>> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Missing argument "url" is required', callback, rej);
      try {
        /** Parse HTML Document */
        const $ = await readHtml(url, this.options);

        /** Get manga title */
        const mainTitle: string = $(`div.panel-story-info > div.story-info-right > h1`).text();

        /** Get manga alternate titles */
        const altTitles: string[] = $(
          `div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-value > h2`,
        )
          .map((_, el) => {
            const alternateTitles = $(el).text();
            if (typeof alternateTitles == null) return;
            return splitAltTitles(alternateTitles);
          })
          .get();

        /** Get manga author(s) */
        const authors: string[] = $(
          `div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-value > a[rel="nofollow"]`,
        )
          .map((_, el) => $(el).text())
          .get();

        /** Get manga status */
        const status = $(
          `div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-label > i.info-status`,
        )
          .parent()
          .siblings('td.table-value')
          .text() as MangaStatus<Manganato>;

        /** Get manga genres */
        const genres: string[] = $(
          `div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-label > i.info-genres`,
        )
          .parent()
          .siblings('td.table-value')
          .children(`a`)
          .map((_, el) => $(el).text())
          .get();

        /** Get manga updated date */
        const updatedAt = new Date(
          $(`div.story-info-right-extent > p > span.stre-label > i.info-time`)
            .parent()
            .siblings('span.stre-value')
            .text(),
        );

        /** Get manga views */
        const views: string = $(`div.story-info-right-extent > p > span.stre-label > i.info-view`)
          .parent()
          .siblings('span.stre-value')
          .text();

        /** Get manga rating */
        const ratingText = $(`div.story-info-right-extent > p > em#rate_row_cmd > em > em`)
          .map((_, el) => $(el).text().trim().split(' ').join('').split('\n'))
          .get();
        const rating: MangaRating = {
          sourceRating: ratingText[0],
          voteCount: Number(ratingText[4]).toLocaleString(),
          ratingPercentage: `${((Number(ratingText[2].substring(0, 3)) / Number(ratingText[3])) * 100).toFixed(2)}%`,
          ratingStars: `${ratingText[2].substring(0, 3)} / ${ratingText[3]}`,
        };

        /** Get manga summary */
        const summary = $(`div.panel-story-info-description`).clone().children().remove().end().text().trim();

        /** Get manga cover image */
        const imgEl = $(`div.story-info-left > span.info-image > img`);
        const img = imgEl.attr('src');
        const alt = imgEl.attr('alt');
        const coverImage: MangaCoverImage = { url: img, alt: alt || '' };

        /** Get manga chapters */
        // Get chapter names and URLs
        const chapterNameURL = $(`div.panel-story-chapter-list > ul.row-content-chapter > li > a.chapter-name`)
          .map((_, el) => {
            const chapterName = $(el).text();
            const chapterUrl = $(el).attr('href');
            if (chapterName != null && chapterUrl != null) return { name: chapterName, url: chapterUrl };
          })
          .get();

        // Get chapter views
        const chapterViews = $(`div.panel-story-chapter-list > ul.row-content-chapter > li > span.chapter-view`)
          .map((_, el) => $(el).text())
          .get();

        // Get chapter dates
        const chapterDates = $(`div.panel-story-chapter-list > ul.row-content-chapter > li > span.chapter-time`)
          .map((_, el) => parse($(el).text(), 'MMM dd,yy', new Date()))
          .get();

        /** Get data from chapters and arrange them into JSON-like data */
        const chapters: MangaChapters<Manganato>[] = chapterNameURL.map(({ name, url: chapterUrl }, i) => ({
          name,
          url: chapterUrl,
          uploadDate: chapterDates[i],
          views: chapterViews[i],
        }));

        success(
          {
            title: {
              main: mainTitle,
              alt: altTitles,
            },
            coverImage,
            authors,
            status,
            summary,
            genres: genres as MangaGenre<Manganato>[],
            rating,
            updatedAt,
            views,
            chapters,
          },
          callback,
          res,
        );
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  /**
   * Get raw image URLs from a chapter URL. Since readmanganato uses Cloudflare, make sure
   * to attach `referer: https://readmanganato.com/` to the request headers when fetching images
   * or else the images will not load.
   *
   * @param url - URL of chapter
   * @param callback - Callback function
   * @returns Returns an array of raw img URLs (manga pages) from the chapter URL
   * @example
   * ```ts
   * // React-native example
   * <Image source={{
   *    uri: 'https://s8.mkklcdnv6temp.com/mangakakalot/r1/read_boku_no_hero_academia_manga/chapter_318/1.jpg',
   *    method: 'GET',
   *    headers: {
   *        referer: 'https://readmanganato.com/'
   *        }
   *    }}
   * />
   * ```
   */
  public getPages(url: string, callback: MangaCallback<string[]> = () => void 0): Promise<string[]> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Argument "url" is required', callback, rej);

      try {
        /** Parse HTML Document */
        const $ = await readHtml(url, this.options);

        /** Get each page url */
        const pages: string[] = $(`div.container-chapter-reader > img`)
          .map((_, el) => {
            const img = $(el).attr('src');
            if (img != null) return img;
          })
          .get();

        success(pages, callback, res);
      } catch (e) {
        return failure(e, callback, rej);
      }
    });
  }

  /**
   * Get a list of manga that contain the given genre.
   * This can only search for one genre at a time, so if you
   * want to search multiple genres, use the `search()` method instead.
   *
   * @param genre - A manga genre (e.g. Comedy, Fantasy)
   * @param options - Options to add to search (e.g. Filter results for ongoing mangas)
   * @param callback - Callback Function
   * @returns Returns an array of manga from the given genre
   * @example
   * ```js
   * import { MangaNato } from "manganato";
   *
   * const manganato = new MangaNato();
   *
   * async function test() {
   *  const mangas = await manganato.getMangasFromGenre('Comedy', { type: 'new' })
   *  console.log(mangas);
   * }
   *
   * test(); // Output: [{ ... }, { ... }, ...] Fetches the newest mangas with the Comedy genre
   * ```
   */
  public getMangasFromGenre(
    genre: MangaGenre<Manganato>,
    options: MangaGenreFilters<Manganato> = {},
    callback: MangaCallback<Manga<Manganato>[]> = () => void 0,
  ): Promise<Manga<Manganato>[]> {
    const { age: type = 'updated', status = 'all', page = 1 } = options;

    function generateURL(): string {
      const filterState = `state=${status}`;
      const filterType = `type=${type === 'updated' ? 'latest' : 'newest'}`;
      const baseUrl = `https://manganato.com/genre-${ManganatoGenres[genre]}/${page}?${filterType}&${filterState}`;

      return baseUrl;
    }

    return new Promise(async (res, rej) => {
      if (genre == null) return failure('Missing argument "genres" is required', callback, rej);
      if (page == null) return failure('Missing argument "page" is required', callback, rej);
      if (page <= 0) return failure('"page" must be greater than 0', callback, rej);

      try {
        /** Parse HTML document */
        const $ = await readHtml(generateURL(), this.options);
        const titles: string[] = [];
        const urls: string[] = [];
        const authors: string[][] = [];
        const updatedAt: Date[] = [];
        const views: string[] = [];
        const coverImage: MangaCoverImage[] = [];

        /** Get manga titles */
        $(`div.panel-content-genres > div.content-genres-item > div.genres-item-info > h3 > a.genres-item-name`).each(
          (_, el) => {
            const title = $(el).text();
            if (typeof title !== 'undefined') titles.push(title);
          },
        );

        /** Get manga views */
        $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-view`,
        ).each((_, el) => {
          const viewCount = $(el).text();
          if (typeof viewCount !== 'undefined') views.push(viewCount);
        });

        /** Get manga date */
        $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-time`,
        ).each((_, el) => {
          const timestamp = $(el).text();
          if (timestamp != null) updatedAt.push(parse(timestamp, 'MMM dd,yy', new Date()));
        });

        /** Get manga authors */
        $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-author`,
        ).each((_, el) => {
          const author = $(el).text();
          if (typeof author !== 'undefined') authors.push(author.split(', '));
        });

        /** Get manga cover image */
        $(`div.panel-content-genres > div.content-genres-item > a.genres-item-img > img.img-loading`).each((_, el) => {
          const img = $(el).attr('src');
          const alt = $(el).attr('alt');
          if (typeof alt !== 'undefined') coverImage.push({ url: img, alt });
        });

        /** Get manga URL */
        $(`div.panel-content-genres > div.content-genres-item > a.genres-item-img`).each((_, el) => {
          const url = $(el).attr('href');
          if (typeof url !== 'undefined') urls.push(url);
        });

        const mangas: Manga<Manganato>[] = titles.map((title, index) => ({
          title,
          url: urls[index],
          authors: authors[index],
          updatedAt: updatedAt[index],
          views: views[index],
          coverImage: coverImage[index],
        }));

        success(mangas, callback, res);
      } catch (e) {
        return failure(e, callback, rej);
      }
    });
  }
}
