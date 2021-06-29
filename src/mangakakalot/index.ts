import axios from 'axios';
import cheerio from 'cheerio';
import moment from 'moment';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import {
  CallbackFunc,
  Manga,
  MangaAttributeCoverImage,
  MangaMeta,
  MangaGenres,
  MangaAuthors,
  MangaRating,
  MangakakalotGenre,
  MangaChapters,
  MangakakalotOptions,
  MangaList,
  MangakakalotGenres,
} from '../';
import splitAltTitles from '../functions/splitAltTitles';

export default class Mangakakalot {
  /**
   * Get a list of manga that match the title
   *
   * @param title - Title of Manga (e.g "Black Clover", "One Piece", "Naruto")
   * @param callback - Callback function
   * @returns List of Manga that match `title`
   * @example
   * ```typescript
   * import { Mangakakalot } from '@specify_/mangascraper';
   * const mangakakalot = new Mangakakalot();
   *
   * async function test() {
   *  const mangas = await mangakakalot.getMangaByTitle("naruto")
   *  console.log(mangas);
   * }
   *
   * test(); // Output: [ { title: 'Naruto', url: 'https://readmanganato.com/manga-ng952689' ... }]
   * ```
   */
  public getMangasByTitle(title: string, callback: CallbackFunc<Manga[]> = () => {}): Promise<Manga[]> {
    function convertToSearch(query: string): string {
      return query.replace(/[^a-zA-Z0-9]/g, '_');
    }

    return new Promise(async (res, rej) => {
      /** Param Validation */
      if (typeof title === 'undefined') return failure(new Error('Missing argument "title" is required'), callback);

      try {
        /** Load HTML Document to cheerio to extract HTML data */
        const $ = await readHtml(`https://mangakakalot.com/search/story/${convertToSearch(title)}`);
        const links: string[] = [];
        const titles: string[] = [];
        const authors: string[][] = [];
        const views: string[] = [];
        const updatedAt: Date[] = [];
        const coverImage: MangaAttributeCoverImage[] = [];

        /** Simple string date converter to Date type */
        function convertToDate(date: string): Date {
          return moment(date, 'MMM-DD-YYYY HH:mm:ss').toDate();
        }

        /** Gets all URLs to their respected manga */
        $(`div.story_item > div.story_item_right > h3.story_name > a`).each((index, element) => {
          const link = $(element).attr('href');

          if (typeof link !== 'undefined') links.push(link);
        });

        /** Gets all Titles */
        $(`div.story_item > div.story_item_right > h3.story_name > a`).each((index, element) => {
          const title = $(element).text();
          if (typeof title !== 'undefined') titles.push(title);
        });

        /** Gets all cover images */
        $(`div.story_item > a[rel="nofollow"] > img`).each((index, element) => {
          const image = $(element).attr('src');
          const alt = $(element).attr('alt');
          if (typeof alt !== 'undefined') coverImage.push({ url: image, alt: alt });
        });

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
  public getMangaMeta(url: string, callback: CallbackFunc<MangaMeta> = () => {}): Promise<MangaMeta> {
    return new Promise(async (res, rej) => {
      if (typeof url === 'undefined') return failure(new Error('Argument "url" is required'), callback);
      try {
        /** Load HTML Document to cheerio to extract HTML data */
        const $ = await readHtml(url);
        let mainTitle: string = '';
        let altTitles: string[] = [];
        let status: string = '';
        let updatedAt: Date = new Date();
        let views: string = '';
        const genres: MangaGenres[] = [];
        const authors: MangaAuthors[] = [];
        let rating: MangaRating = {
          sourceRating: '',
          rating_stars: '',
          rating_percentage: '',
          voteCount: NaN,
        };
        let coverImage: MangaAttributeCoverImage = { alt: '', url: undefined };
        const chaptersNameURL: Array<{ name: string; url: string }> = [];
        const chaptersViews: string[] = [];
        const chaptersDate: Date[] = [];

        /** Get main title */
        $(`div.manga-info-top > ul.manga-info-text > li > h1`).each((_, element) => {
          mainTitle = $(element).text();
        });

        /** Get alternate titles */
        $(`div.manga-info-top > ul.manga-info-text > li > h2.story-alternative`).each((_, element) => {
          const alt_titles_string = $(element).text();
          if (typeof alt_titles_string === 'undefined') return;
          altTitles = splitAltTitles(alt_titles_string);
        });

        /** Get manga status, update date, views */
        $(`div.manga-info-top > ul > li`).each((_, element) => {
          const unknown_li = $(element).text();
          if (typeof unknown_li === 'undefined') return;
          if (unknown_li.startsWith('Status :')) status = unknown_li.substring(9);
          if (unknown_li.startsWith('Last updated :'))
            updatedAt = moment(unknown_li.substring(15), 'MMM-DD-YYYY hh:mm:ss A').toDate();
          if (unknown_li.startsWith('View :')) views = unknown_li.substring(7);
        });

        /** Get manga authors */
        $(`div.manga-info-top > ul > li:contains("Author(s)") > a`).each((_, element) => {
          const author = $(element).text();
          const url = $(element).attr('href');
          if (typeof author === 'undefined' || typeof url === 'undefined') return;
          authors.push({ name: author, url });
        });

        /** Get manga genres */
        $(`div.manga-info-top > ul > li:contains("Genres") > a`).each((_, element) => {
          const genre = $(element).text();
          const genreURL = $(element).attr('href');

          if (typeof genre !== 'undefined' && typeof genreURL !== 'undefined')
            genres.push({ genre: genre as MangakakalotGenre, url: genreURL });
        });

        /** Get manga rating */
        $(
          `div.manga-info-top > ul > li[style="line-height: 20px; font-size: 11px; font-style: italic; padding: 0px 0px 0px 44px;"] > em#rate_row_cmd`,
        ).each((_, element) => {
          const el = $(element).text();
          if (typeof el === 'undefined') return;
          const string_array = el.split(' ');
          const src = string_array[0].trim();
          const voteCount = Number(string_array[7]);
          const rating_stars = `${string_array[3]} / ${string_array[5]}`;
          const rating_percentage = `${(Number(string_array[3]) / Number(string_array[5])) * 100}%`;

          rating = { sourceRating: src, voteCount, rating_percentage, rating_stars };
        });

        /** Remove all children and get summary text */
        const summary = $(`div#noidungm`)
          .clone()
          .children()
          .remove()
          .end()
          .text()
          .replace(/\r?\n|\r/g, ' ')
          .trim();

        /** Get image URL and alt */
        $(`div.manga-info-top > div.manga-info-pic > img`).each((_, element) => {
          const imgURL = $(element).attr('src');
          const alt = $(element).attr('alt');
          if (typeof alt === 'undefined') return;
          coverImage = { url: imgURL, alt };
        });

        /** Get manga chapters */
        const chaptersLength = $(`div.manga-info-chapter > div.chapter-list > div.row`).length;

        /** Get manga chapter name and url */
        $(`div.manga-info-chapter > div.chapter-list > div.row > span > a`).each((_, element) => {
          const chapterName = $(element).text();
          const chapterURL = $(element).attr('href');
          if (typeof chapterName === 'undefined' || typeof chapterURL === 'undefined') return;
          chaptersNameURL.push({ name: chapterName, url: chapterURL });
        });

        /** Get views of every manga chapter */
        $(`div.manga-info-chapter > div.chapter-list > div.row > span:not(:has(a))`).each((_, element) => {
          const chapters_views_date: string = $(element).text();
          if (typeof chapters_views_date === 'undefined') return;
          if (chapters_views_date.match(/[a-zA-Z]/g))
            chaptersDate.push(moment(chapters_views_date, 'MMM-DD-YY').toDate());
          else chaptersViews.push(chapters_views_date);
        });

        const chapters: MangaChapters[] = new Array(chaptersLength).fill('').map((_, index) => {
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
            genres,
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
   * @param options - Fetch options within mangakakalot's query system
   * @param page - Page # for Pagination
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
    options: MangakakalotOptions = {},
    page: number = 1,
    callback: CallbackFunc<MangaList[]> = () => {},
  ): Promise<MangaList[]> {
    return new Promise(async (res, rej) => {
      const { genre = 'All', status = 'all', type = 'updated' } = options;
      if (typeof page === 'undefined') return failure(new Error("Argument 'page' must be a number"), callback);
      if (page <= 0) return failure(new Error("'page' must be greater than 0"), callback);

      try {
        /** Parse HTML Document */
        const $ = await readHtml(
          `https://mangakakalot.com/manga_list?type=${type === 'updated' ? 'latest' : 'newest'}&category=${
            MangakakalotGenres[genre || 'All']
          }&state=${status}&page=${page}`,
        );
        const titles: string[] = [];
        const urls: string[] = [];
        const views: string[] = [];
        const covers: MangaAttributeCoverImage[] = [];

        /** Get manga titles */
        $(`div.list-truyen-item-wrap > h3 > a`).each((_, element) => {
          const title = $(element).text();
          const url = $(element).attr('href');
          if (typeof title === 'undefined' || typeof url === 'undefined') return;
          titles.push(title);
          urls.push(url);
        });

        /** Get manga views */
        $(`div.list-truyen-item-wrap > div > span.aye_icon`).each((_, element) => {
          const viewerCount = $(element).text();
          if (typeof views === 'undefined') return;
          views.push(viewerCount);
        });

        /** Get manga cover img */
        $(`div.list-truyen-item-wrap > a > img`).each((_, element) => {
          const img = $(element).attr('src');
          const alt = $(element).attr('alt');
          if (typeof img === 'undefined' || typeof alt === 'undefined') return;
          covers.push({ url: img, alt });
        });

        const mangaList: MangaList[] = new Array(titles.length)
          .fill('')
          .map((_, index) => ({
            title: titles[index],
            url: urls[index],
            coverImage: covers[index],
            views: views[index],
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
  public getPages(url: string, callback: CallbackFunc<string[]> = () => {}): Promise<string[]> {
    return new Promise(async (res, rej) => {
      if (typeof url === 'undefined') return failure(new Error("Argument 'chapter_url' is required"), callback);

      try {
        /** Parse HTML document */
        const $ = await readHtml(url);
        const pages: string[] = [];

        /** Get image URLs */
        $(`div.container-chapter-reader > img[src]`).each((_, element) => {
          const page = $(element).attr('src');
          if (typeof page !== 'undefined') pages.push(page);
        });

        success(pages, callback, res);
      } catch (e) {
        failure(new Error(e), callback);
      }
    });
  }
}
