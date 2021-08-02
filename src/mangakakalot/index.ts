import { parse } from 'date-fns';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import {
  MangaCallback,
  MangaMeta,
  MangaChapters,
  MangakakalotGenres,
  MangaFilters,
  Manga,
  ScrapingOptions,
  MangaGenre,
  MangaAge,
  MangaStatus,
} from '..';
import splitAltTitles from '../functions/splitAltTitles';

export interface MangakakalotManga {
  title: string;
  url: string;
  authors: string[];
  updatedAt: Date;
  views: string;
  coverImage: string;
}

export interface MangakakalotAlt {
  title: string;
  url: string;
  views: string;
  coverImage: string;
}

export type MangakakalotGenre = keyof typeof MangakakalotGenres | 'any';

export interface MangakakalotOptions {
  status?: MangaStatus<Mangakakalot> | 'any';
  age?: MangaAge;
  page?: number;
}

export default class Mangakakalot {
  private options: ScrapingOptions;

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   * Get a list of manga that match the title. Unfortunately, Mangakakalot does not offer an advanced search, so this can only search manga titles only. I will be updating this if Mangakakalot introduces a better search system. This method also requires you to have at least **3 characters** minimum.
   *
   * @param keyword - Title of manga (e.g "Black Clover", "One Piece", "Naruto")
   * @param callback - Callback function
   * @returns List of Manga that match `title`
   * @example
   * ```typescript
   * import { Mangakakalot } from '@specify_/mangascraper';
   * const mangakakalot = new Mangakakalot();
   *
   * async function test() {
   *  const mangas = await mangakakalot.search("pokemon")
   *  console.log(mangas);
   * }
   *
   * test(); // Output: [ { title: 'Pokemon: The World Champion Season', url: 'https://mangakakalot.com/manga/zv925092' ... }]
   * ```
   */
  public search(
    keyword: string,
    callback: MangaCallback<Manga<Mangakakalot>[]> = () => void 0,
  ): Promise<Manga<Mangakakalot>[]> {
    function generateURL(): string {
      const search: string = keyword.replace(/[^a-zA-Z0-9]/g, '_');

      const baseUrl = `https://mangakakalot.com/search/story/${search}`;

      return baseUrl;
    }

    return new Promise(async (res, rej) => {
      if (keyword == null) return failure('Missing argument "keyword" is required', callback, rej);
      if (keyword.length < 3) {
        return failure('"keyword" must be greater than 3 characters', callback, rej);
      }
      try {
        /** Load HTML Document to cheerio to extract HTML data */
        const $ = await readHtml(generateURL(), this.options);

        const authors: string[][] = [];
        const views: string[] = [];
        const updatedAt: Date[] = [];

        /** Simple string date converter to Date type */
        function convertToDate(date: string): Date {
          return parse(date, 'MMM-dd-yyyy HH:mm', new Date());
        }

        /** Gets all URLs to their respected manga */
        const links: string[] = $(`div.story_item > div.story_item_right > h3.story_name > a`)
          .map((index, element) => {
            const link = $(element).attr('href');

            if (typeof link !== 'undefined') return link;
          })
          .get();

        /** Gets all Titles */
        const titles: string[] = $(`div.story_item > div.story_item_right > h3.story_name > a`)
          .map((index, element) => {
            const title = $(element).text();
            if (typeof title !== 'undefined') return title;
          })
          .get();

        /** Gets all cover images */
        const coverImage: string[] = $(`div.story_item > a[rel="nofollow"] > img`)
          .map((index, element) => $(element).attr('src') ?? '')
          .get();

        /** Gets all Authors, Dates, and View Count */
        $(`div.story_item > div.story_item_right > span`).each((index, element) => {
          const attribute = $(element).text();
          if (typeof attribute === 'undefined') return;
          if (attribute.startsWith('Author(s) :')) authors.push(attribute.substring(12).split(','));
          if (attribute.startsWith('Updated :')) updatedAt.push(convertToDate(attribute.substring(10)));
          if (attribute.startsWith('View :')) views.push(attribute.substring(7));
        });

        const mangaList = new Array(titles.length)
          .fill('')
          .map((_, index) => ({
            title: titles[index],
            url: links[index],
            authors: authors[index],
            updatedAt: updatedAt[index],
            views: views[index],
            coverImage: coverImage[index],
          }))
          /** Yeah... mangakakalot redirects to this website */
          .filter((manga) => !manga.url.startsWith('https://readmanganato.com/'));

        success(mangaList, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  /**
   * Gets metadata of manga such as the genre, authors, chapters, etc.
   *
   * @param url - Mangakakalot URL page of the manga
   * @param callback - Callback function
   * @returns Returns metadata of manga (chapters, alternate titles, status, etc.)
   * @example
   * ```js
   * import { Mangakakalot } from "@specify_/mangascraper";
   * const mangakakalot = new Mangakakalot();
   *
   * async function test() {
   *  const meta = await mangakakalot.getMangaMeta('https://mangakakalot.com/read-gj8eg158504836414');
   *  console.log(meta);
   * }
   *
   * test(); // Output: { title: { main: 'Fukushuu...', alt: { jp: [...], en: [...], cn: [], ...} }}
   * ```
   */
  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<Mangakakalot>> = () => void 0,
  ): Promise<MangaMeta<Mangakakalot>> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Argument "url" is required', callback, rej);
      try {
        /** Load HTML Document to cheerio to extract HTML data */
        const $ = await readHtml(url, this.options);

        let status!: MangaStatus<Mangakakalot>;
        let updatedAt: Date = new Date();
        let views = '';

        const chaptersViews: string[] = [];
        const chaptersDate: Date[] = [];

        /** Get main title */
        const mainTitle: string = $(`h1`).text();

        /** Get alternate titles */
        const altTitles: string[] = $(`div.manga-info-top > ul.manga-info-text > li > h2.story-alternative`)
          .map((_, element) => splitAltTitles($(element).text().substring(14)))
          .get();

        /** Get manga status, update date, views */
        $(`div.manga-info-top > ul > li`).each((_, element) => {
          const unknownLi = $(element).text();
          if (unknownLi.startsWith('Status :'))
            status = unknownLi.substring(9).toLowerCase() as MangaStatus<Mangakakalot>;
          if (unknownLi.startsWith('Last updated :')) updatedAt = new Date(unknownLi.substring(15));
          if (unknownLi.startsWith('View :')) views = unknownLi.substring(7);
        });

        /** Get manga authors */
        const authors: string[] = $(`div.manga-info-top > ul > li:contains("Author(s)") > a`)
          .map((_, element) => $(element).text())
          .get();

        /** Get manga genres */
        const genres: string[] = $(`div.manga-info-top > ul > li:contains("Genres") > a`)
          .map((_, element) => $(element).text())
          .get();

        /** Get manga rating */
        const ratingText = $(
          `div.manga-info-top > ul > li[style="line-height: 20px; font-size: 11px; font-style: italic; padding: 0px 0px 0px 44px;"] > em#rate_row_cmd`,
        ).text();
        const stringArr = ratingText.split(' ');
        const src = stringArr[0].trim();
        const voteCount = Number(stringArr[7]).toLocaleString();
        const ratingStars = `${stringArr[3]} / ${stringArr[5]}`;
        const ratingPercentage = `${((Number(stringArr[3]) / Number(stringArr[5])) * 100).toFixed(2)}%`;

        const rating = { sourceRating: src, voteCount, ratingPercentage, ratingStars };

        /** Remove all children and get summary text */
        const summary = $(`div#noidungm`).clone().children().remove().end().text().trim();

        /** Get image URL and alt */
        const coverImage = $(`div.manga-info-top > div.manga-info-pic > img`).attr('src') ?? '';

        /** Get manga chapters */
        const chapterDiv = $(`div.manga-info-chapter > div.chapter-list > div.row`);

        /** Get manga chapter name and url */
        const chaptersNameURL: { name: string; url: string }[] = chapterDiv
          .find(`span > a`)
          .map((_, element) => {
            const chapterName = $(element).text();
            const chapterURL = $(element).attr('href') ?? '';
            return { name: chapterName, url: chapterURL };
          })
          .get();

        /** Get views of every manga chapter */
        chapterDiv.children(`span:not(:has(a))`).each((_, element) => {
          const chaptersViewDate: string = $(element).text();
          if (chaptersViewDate.match(/[a-zA-Z]/g)) chaptersDate.push(parse(chaptersViewDate, 'MMM-dd-yy', new Date()));
          else chaptersViews.push(chaptersViewDate);
        });

        const chapters: MangaChapters<Mangakakalot>[] = chapterDiv
          .map((index) => ({
            name: chaptersNameURL[index].name,
            url: chaptersNameURL[index].url,
            uploadDate: chaptersDate[index],
            views: chaptersViews[index],
          }))
          .get();

        success(
          {
            title: { main: mainTitle, alt: altTitles },
            status,
            updatedAt,
            views,
            authors,
            genres: genres as MangaGenre<Mangakakalot>[],
            rating,
            summary,
            coverImage,
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
   * Get a list of manga from mangakakalot
   *
   * @param genre - Mangakakalot Genre
   * @param filters - Filters to apply based on mangakakalot's query system
   * @param callback - Callback function
   * @returns Returns a list of manga from mangakakalot
   * @example
   * ```js
   * import { Mangakakalot } from "@specify_/mangascraper";
   * const mangakakalot = new Mangakakalot();
   *
   * async function test() {
   *  const mangas = await mangakakalot.getMangas({ genre: 'Comedy' });
   *  console.log(mangas);
   * }
   *
   * test(); // Output: [{ title: 'The Provincial...', url: 'https://mangakakalot.com/...', ... }]
   * ```
   */

  public getMangasFromGenre(
    genre: MangaGenre<Mangakakalot> = 'any',
    filters: MangaFilters<Mangakakalot> = {},
    callback: MangaCallback<Manga<Mangakakalot, 'alt'>[]> = () => void 0,
  ): Promise<Manga<Mangakakalot, 'alt'>[]> {
    const { page = 1, status = 'any', age: type = 'updated' } = filters;
    return new Promise(async (res, rej) => {
      if (page == null) return failure('Missing argument "page" is required', callback, rej);
      if (typeof page !== 'number') return failure('"page" must be a number', callback, rej);
      if (page <= 0) return failure('"page" must be a number greater than 0', callback, rej);

      try {
        /** Parse HTML Document */
        const $ = await readHtml(
          `https://mangakakalot.com/manga_list?type=${type === 'updated' ? 'latest' : 'newest'}&category=${
            genre != null && genre !== 'any' ? MangakakalotGenres[genre] : ''
          }&state=${status === 'any' ? 'all' : status}&page=${page}`,
          this.options,
        );

        /** Get manga titles */
        const titleURLs = $(`div.list-truyen-item-wrap > h3 > a`)
          .map((_, element) => {
            const anchorEl = $(element);
            const title = anchorEl.text();
            const url = anchorEl.attr('href') ?? '';
            return { title, url };
          })
          .get();

        /** Get manga views */
        const views: string[] = $(`div.list-truyen-item-wrap > div > span.aye_icon`)
          .map((_, element) => $(element).text())
          .get();

        /** Get manga cover img */
        const covers: string[] = $(`div.list-truyen-item-wrap > a > img`)
          .map((_, element) => $(element).attr('src') ?? '')
          .get();

        const mangaList: Manga<Mangakakalot, 'alt'>[] = titleURLs
          .map(({ title, url }, i) => ({
            title,
            url,
            views: views[i],
            coverImage: covers[i],
          }))
          /** Yeah... mangakakalot redirects to this website */
          .filter((manga) => !manga.url.startsWith('https://readmanganato.com/'));

        success(mangaList, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  /**
   * Get raw image URLs from a chapter URL. Since mangakakalot uses cloudfare, make sure
   * to attach `referer: https://mangakakalot.com/` to the request headers when fetching images
   * or else the images will not load.
   *
   * @param url - URL of chapter
   * @param callback - Callback function
   * @returns Returns raw image URLs of the chapter.
   * @example
   * ```jsx
   * // React-native example
   * <Image source={{
   *    uri: 'https://s8.mkklcdnv6temp.com/mangakakalot/y1/yk923891/chapter_38/1.jpg',
   *    method: 'GET',
   *    headers: {
   *        referer: 'https://mangakakalot.com/'
   *        }
   *    }}
   * />
   * ```
   */
  public getPages(url: string, callback: MangaCallback<string[]> = () => void 0): Promise<string[]> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Argument "url" is required', callback, rej);

      try {
        /** Parse HTML document */
        const $ = await readHtml(url, this.options);

        /** Get image URLs */
        const pages: string[] = $(`div.container-chapter-reader > img[src]`)
          .map((_, element) => $(element).attr('src'))
          .get();

        success(pages, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }
}
