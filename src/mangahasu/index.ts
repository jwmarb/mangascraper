import { parse } from 'date-fns';
import {
  MangaCallback,
  Manga,
  MangaSearch,
  MangahasuTypes,
  MangaFilters,
  MangahasuGenres,
  MangaMeta,
  MangaRating,
  MangaChapters,
  ScrapingOptions,
  MangaStatus,
  MangaGenre,
  MangaType,
  LatestHotManga,
} from '..';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import splitAltTitles from '../functions/splitAltTitles';
import success from '../functions/success';

export interface MangahasuManga {
  title: string;
  url: string;
  coverImage: string;
}

export type MangahasuMeta = {
  title: {
    main: string;
    alt: string[];
  };
  summary: string;
  authors: string[];
  artists: string[];
  genres: MangaGenre<Mangahasu>[];
  type: string;
  status: string;
  views: string;
  rating: MangaRating;
  coverImage: string;
  chapters: MangaChapters<Mangahasu>[];
};

export interface MangahasuOptions {
  genres?: {
    include?: MangaGenre<Mangahasu>[];
    exclude?: MangaGenre<Mangahasu>[];
  };
  status?: MangaStatus<Mangahasu> | 'any';
  type?: MangaType<Mangahasu> | 'any';
  page?: number;
}

export interface MangahasuLatestHotManga {
  title: string;
  url: string;
  coverImage: string;
}

export type MangahasuGenre = keyof typeof MangahasuGenres;

export default class Mangahasu {
  private options: ScrapingOptions;

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   *
   * @param query - Search manga, name of author and artist. If you only want to search for a specific characteristic of a manga (such as searching for author name only), use an object which has the fields `author`, `artist`, and `title`
   * @param filters - Filters to apply when searching up the manga such as including/excluding genres or newest releases.
   * @param callback - Callback function
   * @returns Returns an array of manga from mangahasu
   * @example
   * ```js
   * import { Mangahasu } from "@specify_/mangascraper";
   * const mangahasu = new Mangahasu();
   *
   * (await () => {
   *  const mangas = await mangahasu.search({ title: "One Piece", author: "Oda" }, { genres: { include: ["Action", "Adventure"], exclude: ["Mystery"]}, status: "ongoing" })
   * console.log(mangas); // Output: [ { title: 'One Piece - Digital Colored Comics' ... }]
   * })();
   * ```
   */
  public search(
    query: MangaSearch<Mangahasu> = '',
    filters: MangaFilters<Mangahasu> = {},
    callback: MangaCallback<Manga<Mangahasu>[]> = () => void 0,
  ): Promise<Manga<Mangahasu>[]> {
    if (query == null) query = '';
    if (filters == null) filters = {};
    const { genres = {}, status = 'any', type = 'any', page = 1 } = filters;

    function generateURL(): string {
      const keyword: string = (() => {
        if (typeof query === 'string') return `keyword=${encodeURIComponent(query)}`;
        return query.title != null ? `keyword=${encodeURIComponent(query.title)}` : '';
      })();

      const author: string =
        typeof query !== 'string' && query.author != null ? `author=${encodeURIComponent(query.author)}` : '';
      const artist: string =
        typeof query !== 'string' && query.artist != null ? `artist=${encodeURIComponent(query.artist)}` : '';

      const typeid: string = type !== 'any' ? `typeid=${MangahasuTypes[type]}` : '';

      const includeGenres: string = genres.include
        ? `g_i[]=${genres.include.map((genre) => MangahasuGenres[genre])}`
        : '';
      const excludeGenres: string = genres.exclude
        ? `g_e[]=${genres.exclude.map((genre) => MangahasuGenres[genre])}`
        : '';

      const mangaStatus = status !== 'any' ? `status=${status === 'completed' ? '1' : '2'}` : '';

      const urlArgs = [keyword, author, artist, typeid, includeGenres, excludeGenres, mangaStatus]
        .filter((arg) => arg.length > 0)
        .join('&');

      const baseUrl = `https://mangahasu.se/advanced-search.html?${urlArgs}&page=${page}`;
      return baseUrl;
    }

    return new Promise(async (res, rej) => {
      if (page == null) return failure('Missing argument "page" is required', callback, rej);
      if (page <= 0) return failure('"page" must be greater than 0', callback, rej);
      if (typeof query !== 'string' && query.artist == null && query.title == null && query.author == null) query = '';

      try {
        /** Parse HTML Document */
        const $ = await readHtml(generateURL(), this.options);

        /** Get manga titles and URLs */
        const titlesURL = $(`ul.list_manga > li > div.div_item > div.info-manga > a.name-manga`)
          .map((_, el) => {
            const title = $(el).text();
            const url = $(el).attr('href');
            if (typeof url !== 'undefined' && typeof title !== 'undefined') {
              return {
                title: title.trim(),
                url,
              };
            }
          })
          .get();

        /** Get manga covers */
        const coverImages: string[] = $(`ul.list_manga > li > div.div_item > div.wrapper_imgage > a > img`)
          .map((_, el) => $(el).attr('src') ?? '')
          .get();

        // const mangaList: Manga<Mangahasu>[] = [];

        // for (let i = 0; i < titlesURL.length; i++) {
        //   mangaList.push({ title: titlesURL[i].title, url: titlesURL[i].url, coverImage: coverImages[i] });
        // }

        const mangaList: Manga<Mangahasu>[] = titlesURL.map(({ title, url }, i) => ({
          title,
          url,
          coverImage: coverImages[i],
        }));

        success(mangaList, callback, res);
      } catch (e) {
        return failure(e, callback, rej);
      }
    });
  }

  /**
   * Get metadata of a manga from its url
   *
   * @param url - URL of manga
   * @param callback - Callback function
   * @returns Returns the metadata of a manga from the given url
   * @example
   * ```js
   * import { Mangahasu } from "@specify_/mangascraper";
   * const mangahasu = new Mangahasu();
   *
   * (async () => {
   *  const one_piece = await mangahasu.getMangaMeta('https://mangahasu.se/one-piece-p10328.html');
   *  console.log(one_piece); // Output: { title: { main: "One Piece", alt: ["ワンピース", ... ] }, ... }
   * })();
   * ```
   */
  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<Mangahasu>> = () => void 0,
  ): Promise<MangaMeta<Mangahasu>> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Missing argument "url" is required', callback, rej);
      try {
        /** Parse HTML document */
        const $ = await readHtml(url, this.options);
        let title = '';
        let altTitles: string[] = [];
        let summary = '';
        let authors: string[] = [];
        let artists: string[] = [];
        let genres: MangaGenre<MangahasuGenre>[] = [];
        let type = '';
        let status = '';
        let views = '';
        let rating: MangaRating = {} as MangaRating;

        /** Get manga title */
        title = $(`div.info-title > h1`).text();

        /** Get manga alternate titles */
        altTitles = splitAltTitles($(`div.info-title > h3`).text());

        /** Get manga summary */
        summary = $(`div.content-info > h3:contains("Summary")`).siblings('div').text().trim();

        /** Get manga authors */
        authors = $(`div.row > b:contains("Author(s)")`).siblings('span.info').text().trim().split('; ');

        /** Get manga artists */
        artists = $(`div.box-des > div.detail_item > b:contains("Artist(s)")`)
          .siblings('span.info')
          .text()
          .trim()
          .split('; ');

        /** Get manga type */
        type = $(`div.detail_item > b:contains("Type")`).siblings('span.info').text().trim();

        /** Get manga genres */
        genres = $(`div.detail_item > b:contains("Genre(s)")`)
          .siblings('span.info')
          .text()
          .trim()
          .split(', ') as MangaGenre<MangahasuGenre>[];

        /** Get status of the manga */
        status = $(`div.detail_item > b:contains("Status")`).siblings('span.info').text().trim();

        /** Get manga views */
        views = Number(
          $(`div.detail_item > div.row > b:contains("Views")`).siblings('span.info').text().trim(),
        ).toLocaleString();

        /** Get manga rating */
        const spanRatings = $(`div[class="div-evaluate detail_item"] > span.info > span.ratings`).text().trim();
        let ratingStars;
        let ratingPercentage;
        if (spanRatings.length !== 0) {
          ratingStars = `${spanRatings}/5`;
          ratingPercentage = `${((Number(spanRatings) / 5) * 100).toFixed(2)}%`;
        }
        const voteCount = Number(
          $(`div[class="div-evaluate detail_item"] > span.info > span.div_evaluate`).text().trim(),
        ).toLocaleString();
        rating = {
          sourceRating: 'Mangahasu.se',
          ratingPercentage,
          ratingStars,
          voteCount,
        };

        /** Get manga cover image */
        const coverImage = $(`div.container > div.wrapper_content > div.info-img > img`).attr('src') ?? '';

        /** Get manga chapters */
        const chapters: MangaChapters<Mangahasu>[] = $(`div.content-info > div.list-chapter > table.table > tbody > tr`)
          .map((_, el) => {
            const anchorEl = $(el).children('td.name').children('a');
            const chapterName = anchorEl.text().replace(title, '').trim();
            const chapterUrl = anchorEl.attr('href');
            const chapterDate = parse($(el).children('td.date-updated').text().trim(), 'MMM dd, yyyy', new Date());
            if (typeof chapterUrl !== 'undefined')
              return { name: chapterName, url: chapterUrl, uploadDate: chapterDate };
          })
          .get();

        success(
          {
            title: { main: title, alt: altTitles },
            summary,
            authors,
            artists,
            type,
            status,
            genres,
            views,
            rating,
            coverImage,
            chapters,
          },
          callback,
          res,
        );
      } catch (e) {
        return failure(e, callback, rej);
      }
    });
  }

  /**
   * Get a list of mangas from Mangahasu's latest releases
   *
   * @param options - Options to provide when getting latest updates
   * @param callback - Callback function
   * @returns Returns an array of mangas from Mangahasu's latest releases page.
   */
  public getLatestUpdates(
    options: { page: number } = { page: 1 },
    callback: MangaCallback<LatestHotManga<Mangahasu>[]> = () => void 0,
  ): Promise<LatestHotManga<Mangahasu>[]> {
    const { page } = options;
    return new Promise(async (res, rej) => {
      if (page < 1) return failure('Argument "page" must be greater than or equal to 1', callback, rej);
      try {
        const $ = await readHtml(`https://mangahasu.se/latest-releases.html?page=${page}`, this.options);
        const mangaList = $('ul.list_manga > li');
        const mangaListLength = mangaList.length;
        const mangas: LatestHotManga<Mangahasu>[] = [];

        for (let i = 0; i < mangaListLength; i++) {
          const divContainer = mangaList.eq(i);
          const imgEl = divContainer.find('img');
          const src = imgEl.attr('src') ?? '';
          const alt = imgEl.attr('alt') ?? '';
          const href = divContainer.find('a.name-manga').attr('href') ?? '';
          mangas.push({ title: alt, coverImage: src, url: href });
        }

        success(mangas, callback, res);
      } catch (e) {
        return failure(e, callback, rej);
      }
    });
  }

  /**
   * Get raw image URLs from chapter URL.
   * Note: Each image URL does not require any `headers` when making requests
   *
   * @param url - URL of chapter
   * @param callback - Callback function
   * @returns Returns an array of URLs of each page in the chapter
   * @example
   * ```js
   * import { Mangahasu } from "@specify_/mangascraper";
   * const mangahasu = new Mangahasu();
   *
   * (async () => {
   *  const pages = mangahasu.getPages("https://mangahasu.se/solo-leveling/chapter-0-prologue-v1-c628457.html");
   *  console.log(pages); // Output: [ 'https://.../0000-001.png', 'https://.../0000-002.png', 'https://.../0000-003.png', ... ]
   * })();
   * ```
   */
  public getPages(url: string, callback: MangaCallback<string[]> = () => void 0): Promise<string[]> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Missing argument "url" is required', callback, rej);
      try {
        /** parse HTML document */
        const $ = await readHtml(url, this.options);

        /** Get URLs of each img element */
        const pages: string[] = $(`div.img-chapter > div.img > img`)
          .map((_, el) => {
            const img = $(el).attr('src');

            if (typeof img !== 'undefined') return img;
          })
          .get();

        success(pages, callback, res);
      } catch (e) {
        return failure(e, callback, rej);
      }
    });
  }
}
