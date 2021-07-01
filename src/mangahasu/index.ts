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

      const base_url = `https://mangahasu.se/advanced-search.html?${url_args}`;
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
        const authors: string[] = [];
        const artists: string[] = [];
        let type: string = '';
        let status: string = '';
        let views: string = '';
        let rating: MangaRating = {} as MangaRating;
        let coverImages: MangaCoverImage = {} as MangaCoverImage;
        const chapters: MangaChapters[] = [];

        /** Get manga title */
        title = $(`div.info-title > h1`).text();

        /** Get manga alternate titles */
        altTitles = splitAltTitles($(`div.info-title > h3`).text());

        /** Get manga summary */
        summary = $(`div.content-info > div > p`).text();

        success({ title: { main: title, alt: altTitles }, summary } as any, callback, res);
      } catch (e) {
        return failure(new Error(e), callback);
      }
    });
  }
}
