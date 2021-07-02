import moment from 'moment';
import {
  MangaCallback,
  Manga,
  MangaSearch,
  MangahasuType,
  MangahasuTypes,
  MangaFilters,
  MangahasuGenres,
  MangaCoverImage,
  MangaMeta,
  MangaRating,
  MangaChapters,
} from '..';
import failure from '../functions/failure';
import numberSeperator from '../functions/numberSeperator';
import readHtml from '../functions/readHtml';
import splitAltTitles from '../functions/splitAltTitles';
import success from '../functions/success';

export default class Mangahasu {
  /**
   *
   * @param title - Search manga, name of author and artist. If you only want to search for a specific characteristic of a manga (such as searching for author name only), use an object which has the fields `author`, `artist`, and `title`
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
    title: MangaSearch<Mangahasu> = '',
    filters: MangaFilters<Mangahasu> = {},
    callback: MangaCallback<Manga<Mangahasu>[]> = () => {},
  ): Promise<Manga<Mangahasu>[]> {
    if (filters === null) filters = {};
    if (title === null) title = '';
    const { genres = {}, status = 'all', type = 'any', page = 1 } = filters;

    function generateURL(): string {
      const keyword: string = (() => {
        if (typeof title === 'string') return `keyword=${encodeURIComponent(title)}`;
        return typeof title.title !== 'undefined' ? `keyword=${encodeURIComponent(title.title)}` : '';
      })();

      const author: string =
        typeof title !== 'string' && typeof title.author !== 'undefined'
          ? `author=${encodeURIComponent(title.author)}`
          : '';
      const artist: string =
        typeof title !== 'string' && typeof title.artist !== 'undefined'
          ? `artist=${encodeURIComponent(title.artist)}`
          : '';

      const typeid: string = type !== 'any' ? `typeid=${MangahasuTypes[type]}` : '';

      const include_genres: string = genres.include
        ? `g_i[]=${genres.include.map((genre) => MangahasuGenres[genre])}`
        : '';
      const exclude_genres: string = genres.exclude
        ? `g_e[]=${genres.exclude.map((genre) => MangahasuGenres[genre])}`
        : '';

      const manga_status = status !== 'all' ? `status=${status === 'completed' ? '1' : '2'}` : '';

      const url_args = [keyword, author, artist, typeid, include_genres, exclude_genres, manga_status]
        .filter((arg) => arg.length > 0)
        .join('&');

      const base_url = `https://mangahasu.se/advanced-search.html?${url_args}&page=${page}`;
      return base_url;
    }

    return new Promise(async (res) => {
      if (page <= 0) return failure(new Error('"page" must be greater than 0'), callback);
      if (
        typeof title !== 'string' &&
        typeof title.artist === 'undefined' &&
        typeof title.title === 'undefined' &&
        typeof title.author === 'undefined'
      )
        title = '';

      try {
        /** Parse HTML Document */
        const $ = await readHtml(generateURL());
        const titles: string[] = [];
        const urls: string[] = [];
        const coverImages: MangaCoverImage[] = [];

        /** Get manga titles and URLs */
        $(`ul.list_manga > li > div.div_item > div.info-manga > a.name-manga`).each((_, el) => {
          const title = $(el).text();
          const url = $(el).attr('href');
          if (typeof url !== 'undefined' && typeof title !== 'undefined') {
            urls.push(url);
            titles.push(title.trim());
          }
        });

        /** Get manga covers */
        $(`ul.list_manga > li > div.div_item > div.wrapper_imgage > a > img`).each((_, el) => {
          const img = $(el).attr('src');
          const alt = $(el).attr('alt');
          if (typeof alt !== 'undefined') coverImages.push({ url: img, alt });
        });

        const mangaList: Manga<Mangahasu>[] = new Array(titles.length).fill('').map((_, i) => ({
          title: titles[i],
          url: urls[i],
          coverImage: coverImages[i],
        }));

        success(mangaList, callback, res);
      } catch (e) {
        return failure(new Error(e), callback);
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
    callback: MangaCallback<MangaMeta<Mangahasu>> = () => {},
  ): Promise<MangaMeta<Mangahasu>> {
    return new Promise(async (res) => {
      if (typeof url === 'undefined') return failure(new Error('Argument "url" is required'), callback);
      try {
        /** Parse HTML document */
        const $ = await readHtml(url);
        let title: string = '';
        let altTitles: string[] = [];
        let summary: string = '';
        let authors: string[] = [];
        let artists: string[] = [];
        let genres: string[] = [];
        let type: string = '';
        let status: string = '';
        let views: string = '';
        let rating: MangaRating = {} as MangaRating;
        let coverImage: MangaCoverImage = {} as MangaCoverImage;
        const chapters: MangaChapters[] = [];

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
        genres = $(`div.detail_item > b:contains("Genre(s)")`).siblings('span.info').text().trim().split(', ');

        /** Get status of the manga */
        status = $(`div.detail_item > b:contains("Status")`).siblings('span.info').text().trim();

        /** Get manga views */
        views = numberSeperator(
          $(`div.detail_item > div.row > b:contains("Views")`).siblings('span.info').text().trim(),
        );

        /** Get manga rating */
        let rating_stars = `${$(`div[class="div-evaluate detail_item"] > span.info > span.ratings`).text().trim()}/5`;
        let rating_percentage = `${(
          (Number($(`div[class="div-evaluate detail_item"] > span.info > span.ratings`).text().trim()) / 5) *
          100
        ).toFixed(2)}%`;
        let voteCount = Number(
          $(`div[class="div-evaluate detail_item"] > span.info > span.div_evaluate`).text().trim(),
        );
        rating = {
          sourceRating: 'Mangahasu.se',
          rating_percentage,
          rating_stars,
          voteCount,
        };

        /** Get manga cover image */
        const img = $(`div.container > div.wrapper_content > div.info-img > img`).attr('src');
        const alt = $(`div.container > div.wrapper_content > div.info-img > img`).attr('alt');
        coverImage = { url: img, alt: typeof alt !== 'undefined' ? alt : '' };

        /** Get manga chapters */
        $(`div.content-info > div.list-chapter > table.table > tbody > tr`).each((_, el) => {
          const anchorEl = $(el).children('td.name').children('a');
          const chapter_name = anchorEl.text().replace(title, '').trim();
          const chapter_url = anchorEl.attr('href');
          const chapter_date = moment($(el).children('td.date-updated').text().trim(), 'MMM DD, YYYY').toDate();
          if (typeof chapter_url !== 'undefined')
            chapters.push({ name: chapter_name, url: chapter_url, uploadDate: chapter_date });
        });

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
        return failure(new Error(e), callback);
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
  public getPages(url: string, callback: MangaCallback<string[]> = () => {}): Promise<string[]> {
    return new Promise(async (res) => {
      if (typeof url === 'undefined') return failure(new Error('Argument "url" is required'), callback);
      try {
        /** parse HTML document */
        const $ = await readHtml(url);
        const pages: string[] = [];

        /** Get URLs of each img element */
        $(`div.img-chapter > div.img > img`).each((_, el) => {
          const img = $(el).attr('src');

          if (typeof img !== 'undefined') pages.push(img);
        });

        success(pages, callback, res);
      } catch (e) {
        return failure(new Error(e), callback);
      }
    });
  }
}
