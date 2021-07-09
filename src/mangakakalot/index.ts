import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import { parse } from 'date-fns';
import {
  MangaCallback,
  MangaCoverImage,
  MangaMeta,
  MangaRating,
  MangaChapters,
  MangakakalotGenres,
  MangaFilters,
  Manga,
  ScrapingOptions,
  MangaGenre,
  MangaBase,
  MangaAge,
  MangaStatus,
} from '../';
import splitAltTitles from '../functions/splitAltTitles';

export interface MangakakalotManga extends MangaBase {}

export interface MangakakalotAlt {
  title: string;
  url: string;
  views: string;
  coverImage: MangaCoverImage;
}

export type MangakakalotGenre = keyof typeof MangakakalotGenres | 'any';

export interface MangakakalotOptions {
  genre?: MangaGenre<Mangakakalot>;
  status?: MangaStatus<Mangakakalot>;
  type?: MangaAge;
  page?: number;
}

export default class Mangakakalot {
  private options: ScrapingOptions = {};

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   * Get a list of manga that match the title. Unfortunately, Mangakakalot does not offer an advanced search, so this can only search manga titles only. I will be updating this if Mangakakalot introduces a better search system
   *
   * @param title - Title of manga (e.g "Black Clover", "One Piece", "Naruto")
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
    callback: MangaCallback<Manga<Mangakakalot>[]> = () => {},
  ): Promise<Manga<Mangakakalot>[]> {
    function generateURL(): string {
      const search: string = keyword.replace(/[^a-zA-Z0-9]/g, '_');

      const base_url = `https://mangakakalot.com/search/story/${search}`;

      return base_url;
    }

    return new Promise(async (res, rej) => {
      /** Param Validation */
      if (keyword == null) return failure(new Error('Missing argument "keyword" is required'), callback);

      try {
        /** Load HTML Document to cheerio to extract HTML data */
        const $ = await readHtml(generateURL(), this.options);

        const authors: string[][] = [];
        const views: string[] = [];
        const updatedAt: Date[] = [];

        /** Simple string date converter to Date type */
        function convertToDate(date: string): Date {
          return parse(date, 'MMM-dd-yyyy HH:mm:ss', new Date());
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
        const coverImage: MangaCoverImage[] = $(`div.story_item > a[rel="nofollow"] > img`)
          .map((index, element) => {
            const image = $(element).attr('src');
            const alt = $(element).attr('alt');
            if (typeof alt !== 'undefined') return { url: image, alt: alt };
          })
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
        failure(new Error(e));
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
    callback: MangaCallback<MangaMeta<Mangakakalot>> = () => {},
  ): Promise<MangaMeta<Mangakakalot>> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure(new Error('Argument "url" is required'), callback);
      try {
        /** Load HTML Document to cheerio to extract HTML data */
        const $ = await readHtml(url, this.options);
        let mainTitle: string = '';

        let status: string = '';
        let updatedAt: Date = new Date();
        let views: string = '';

        let rating: MangaRating = {
          sourceRating: '',
          rating_stars: '',
          rating_percentage: '',
          voteCount: NaN,
        };
        let coverImage: MangaCoverImage = { alt: '', url: undefined };

        const chaptersViews: string[] = [];
        const chaptersDate: Date[] = [];

        /** Get main title */
        $(`div.manga-info-top > ul.manga-info-text > li > h1`).each((_, element) => {
          mainTitle = $(element).text();
        });

        /** Get alternate titles */
        let altTitles: string[] = $(`div.manga-info-top > ul.manga-info-text > li > h2.story-alternative`)
          .map((_, element) => {
            const alt_titles_string = $(element).text();
            if (typeof alt_titles_string === 'undefined') return;
            return splitAltTitles(alt_titles_string);
          })
          .get();

        /** Get manga status, update date, views */
        $(`div.manga-info-top > ul > li`).each((_, element) => {
          const unknown_li = $(element).text();
          if (typeof unknown_li === 'undefined') return;
          if (unknown_li.startsWith('Status :')) status = unknown_li.substring(9);
          if (unknown_li.startsWith('Last updated :'))
            updatedAt = parse(unknown_li.substring(15), 'MMM-dd-yyyy hh:mm:ss A', new Date());
          if (unknown_li.startsWith('View :')) views = unknown_li.substring(7);
        });

        /** Get manga authors */
        const authors: string[] = $(`div.manga-info-top > ul > li:contains("Author(s)") > a`)
          .map((_, element) => $(element).text())
          .get();

        /** Get manga genres */
        const genres: string[] = $(`div.manga-info-top > ul > li:contains("Genres") > a`)
          .map((_, element) => {
            const genre = $(element).text();

            if (typeof genre !== 'undefined') return genre;
          })
          .get();

        /** Get manga rating */
        const ratingText = $(
          `div.manga-info-top > ul > li[style="line-height: 20px; font-size: 11px; font-style: italic; padding: 0px 0px 0px 44px;"] > em#rate_row_cmd`,
        ).text();
        const string_array = ratingText.split(' ');
        const src = string_array[0].trim();
        const voteCount = Number(string_array[7]);
        const rating_stars = `${string_array[3]} / ${string_array[5]}`;
        const rating_percentage = `${((Number(string_array[3]) / Number(string_array[5])) * 100).toFixed(2)}%`;

        rating = { sourceRating: src, voteCount, rating_percentage, rating_stars };

        /** Remove all children and get summary text */
        const summary = $(`div#noidungm`).clone().children().remove().end().text().trim();

        /** Get image URL and alt */
        const imgEl = $(`div.manga-info-top > div.manga-info-pic > img`);
        const imgURL = $(imgEl).attr('src');
        const alt = $(imgEl).attr('alt');
        if (typeof alt === 'undefined') return;
        coverImage = { url: imgURL, alt };

        /** Get manga chapters */
        const chaptersLength = $(`div.manga-info-chapter > div.chapter-list > div.row`).length;

        /** Get manga chapter name and url */
        const chaptersNameURL: Array<{ name: string; url: string }> = $(
          `div.manga-info-chapter > div.chapter-list > div.row > span > a`,
        )
          .map((_, element) => {
            const chapterName = $(element).text();
            const chapterURL = $(element).attr('href');
            if (typeof chapterName === 'undefined' || typeof chapterURL === 'undefined') return;
            return { name: chapterName, url: chapterURL };
          })
          .get();

        /** Get views of every manga chapter */
        $(`div.manga-info-chapter > div.chapter-list > div.row > span:not(:has(a))`).each((_, element) => {
          const chapters_views_date: string = $(element).text();
          if (typeof chapters_views_date === 'undefined') return;
          if (chapters_views_date.match(/[a-zA-Z]/g))
            chaptersDate.push(parse(chapters_views_date, 'MMM-dd-yy', new Date()));
          else chaptersViews.push(chapters_views_date);
        });

        const chapters: MangaChapters<Mangakakalot>[] = new Array(chaptersLength).fill('').map((_, index) => {
          return {
            name: chaptersNameURL[index].name,
            url: chaptersNameURL[index].url,
            uploadDate: chaptersDate[index],
            views: chaptersViews[index],
          };
        });

        success(
          {
            title: { main: mainTitle, alt: altTitles },
            status,
            updatedAt,
            views,
            authors,
            genres: (<unknown>genres) as MangaGenre<Mangakakalot>[],
            rating,
            summary,
            coverImage,
            chapters,
          },
          callback,
          res,
        );
      } catch (e) {
        failure(new Error(e), callback);
      }
    });
  }

  /**
   * Get a list of manga from mangakakalot
   *
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

  public getMangas(
    filters: MangaFilters<Mangakakalot> = {},
    callback: MangaCallback<Manga<Mangakakalot, 'alt'>[]> = () => {},
  ): Promise<Manga<Mangakakalot, 'alt'>[]> {
    const { page = 1, genre = 'any', status = 'any', type = 'updated' } = filters;
    return new Promise(async (res, rej) => {
      if (page == null) return failure(new Error("Argument 'page' is required"));
      if (typeof page !== 'number') return failure(new Error("Argument 'page' must be a number"), callback);
      if (page <= 0) return failure(new Error("'page' must be greater than 0"), callback);

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
            const title = $(element).text();
            const url = $(element).attr('href');
            if (typeof title === 'undefined' || typeof url === 'undefined') return;
            return { title, url };
          })
          .get();

        /** Get manga views */
        const views: string[] = $(`div.list-truyen-item-wrap > div > span.aye_icon`)
          .map((_, element) => {
            const viewerCount = $(element).text();
            if (typeof views === 'undefined') return;
            return viewerCount;
          })
          .get();

        /** Get manga cover img */
        const covers: MangaCoverImage[] = $(`div.list-truyen-item-wrap > a > img`)
          .map((_, element) => {
            const img = $(element).attr('src');
            const alt = $(element).attr('alt');
            if (typeof img === 'undefined' || typeof alt === 'undefined') return;
            return { url: img, alt };
          })
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
        failure(new Error(e));
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
  public getPages(url: string, callback: MangaCallback<string[]> = () => {}): Promise<string[]> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure(new Error("Argument 'chapter_url' is required"), callback);

      try {
        /** Parse HTML document */
        const $ = await readHtml(url, this.options);

        /** Get image URLs */
        const pages: string[] = $(`div.container-chapter-reader > img[src]`)
          .map((_, element) => {
            const page = $(element).attr('src');
            if (typeof page !== 'undefined') return page;
          })
          .get();

        success(pages, callback, res);
      } catch (e) {
        failure(new Error(e), callback);
      }
    });
  }
}
