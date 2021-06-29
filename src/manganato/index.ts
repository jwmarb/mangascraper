import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import {
  CallbackFunc,
  Manga,
  MangaAttributeCoverImage,
  MangaAuthors,
  MangaChapters,
  MangakakalotGenre,
  MangaGenres,
  MangaMeta,
  MangaNatoOptions,
  MangaRating,
  MangaNatoGenres,
  MangaNatoGenre,
  MangaNatoGenreOptions,
  MangakakalotGenres,
} from '../';
import moment from 'moment';
import splitAltTitles from '../functions/splitAltTitles';
import { CheerioAPI, Element } from 'cheerio';

export default class MangaNato {
  /**
   * Get a list of manga.
   * This uses MangaNato's advanced search. You can sort by most views
   *
   * @param title - Title of the manga
   * @param callback - Callback function
   * @returns Returns an array of manga from manganato
   * @example
   * ```js
   * import { MangaNato } from "@specify_/mangascraper";
   * const manganato = new MangaNato();
   *
   * async function test() {
   *  const mostViewedRomanceMangas = await manganato.getMangas(null, { genre: { include: ['Romance'] }, orderBy: 'top_view' });
   *
   *  const newIsekaiMangas = await manganato.getMangas(null, { genre: { include: ['Isekai', 'Action', 'Fantasy'] }, orderBy: 'new_manga' });
   *
   * const titlesWithMyHeroAcademia = await manganato.getMangas('my hero academia');
   *
   * console.log(mostViewedRomanceMangas); // Output: [{ ...views: '334,592,606' }, { ...views: '162,501,040' }, ...]
   * console.log(newIsekaiMangas); // Output: [{ title: 'Survival Story Of A Sword King...' ... }, { title: 'People Made Fun Of Me For Being Jobless...' }, ...]
   * }
   * console.log(titlesWithMyHeroAcademia); // Output: [{ title: 'Boku No Hero Academia', ... }, { title: 'My Hero Academia Team Up Mission'}, ... ]
   * ```
   */
  public getMangas(
    title?: string,
    options: MangaNatoOptions = {},
    callback: CallbackFunc<Manga[]> = () => {},
  ): Promise<Manga[]> {
    const { genre = null, status = '', orderBy = 'latest_updates', page = 1, searchFor = 'all' } = options;

    function convertToSearch(query?: string): string {
      let g_i: string = ''; // short for genre_includes
      let g_e: string = ''; // short for genre_excludes
      const keyw: string = (query && `keyw=${query.replace(/[^a-zA-Z0-9]/g, '_')}`) || ''; // Basically search query for manganato
      const sts = `sts=${status}` || ''; // short for status
      const orby = (() => {
        /** Converts 'orderBy' into an argument manganato can use for its filters */
        switch (orderBy) {
          case 'A-Z':
            return 'orby=az';
          case 'new_manga':
            return 'orby=newest';
          case 'latest_updates':
            return '';
          case 'top_view':
            return 'orby=topview';
          default:
            console.warn(
              `The value "orderBy" is equal to "${orderBy}". Use a matching value such as "top_view" to get the correct search results`,
            );
            return '';
        }
      })(); // short for Order By
      const keyt = (() => {
        /** Converts 'searchFor' into an argument manganato can use for its filters */
        switch (searchFor) {
          case 'all':
            return '';
          case 'alt_titles':
            return 'keyt=alternative';
          case 'title':
            return 'keyt=title';
          case 'authors':
            return 'keyt=author';
          default:
            console.warn(
              `The value "searchFor" is equal to "${searchFor}". Use a matching value such as "all" to get the correct search results`,
            );
            return '';
        }
      })(); // short for keyword type; this just tells manganato what do we want to search for from the query (such as manga author, manga title, manga alternate titles)

      /** Check if there is a genre object */
      if (genre) {
        /** Put each genre from 'includes' into 'genre_includes' */
        g_i = (genre.include && `g_i=_${genre.include.map((genre) => MangaNatoGenres[genre]).join('_')}_`) || '';

        /** Put each genre from 'excludes' into 'genre_excludes' */
        g_e = (genre.exclude && `g_e=_${genre.exclude.map((genre) => MangaNatoGenres[genre]).join('_')}_`) || '';
      }
      let url_args: string[] = [g_i, g_e, sts, orby, keyw].filter((arg) => arg.length > 0);

      return `https://manganato.com/advanced_search?s=all&${url_args.join('&')}&page=${page}`;
    }
    return new Promise(async (res, rej) => {
      if (page <= 0) return failure(new Error("'page' must be greater than 0"));

      try {
        /** Parse HTML document */
        const $ = await readHtml(convertToSearch(title));
        const titles: string[] = [];
        const urls: string[] = [];
        const authors: string[][] = [];
        const updatedAt: Date[] = [];
        const views: string[] = [];
        const coverImage: MangaAttributeCoverImage[] = [];

        /** Get manga URLs and titles */
        $(`div.panel-content-genres > div.content-genres-item > div.genres-item-info > h3 > a`).each((_, element) => {
          const title = $(element).text();
          const url = $(element).attr('href');
          if (typeof title !== 'undefined' && typeof url !== 'undefined') {
            urls.push(url);
            titles.push(title);
          }
        });

        /** Get manga author(s) */
        $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-author`,
        ).each((_, element) => {
          const author = $(element).text();
          if (typeof author !== 'undefined') authors.push(author.split(','));
        });

        /** Get manga date */
        $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-time`,
        ).each((_, element) => {
          const updated_at = $(element).text();
          if (typeof updated_at !== 'undefined') updatedAt.push(moment(updated_at, 'MMM DD,YY').toDate());
        });

        /** Get manga views */
        $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-view`,
        ).each((_, element) => {
          const viewCount = $(element).text();
          if (typeof viewCount !== 'undefined') views.push(viewCount);
        });

        /** Get manga cover image */
        $(`div.panel-content-genres > div.content-genres-item > a.genres-item-img > img`).each((_, element) => {
          const img = $(element).attr('src');
          const alt = $(element).attr('alt');
          if (typeof alt !== 'undefined') coverImage.push({ url: img, alt });
        });

        const mangaList: Manga[] = new Array(titles.length).fill('').map((_, index) => ({
          title: titles[index],
          url: urls[index],
          authors: authors[index],
          updatedAt: updatedAt[index],
          views: views[index],
          coverImage: coverImage[index],
        }));

        success(mangaList, callback, res);
      } catch (e) {
        failure(new Error(e));
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
  public getMangaMeta(url: string, callback: CallbackFunc<MangaMeta> = () => {}): Promise<MangaMeta> {
    return new Promise(async (res, rej) => {
      if (typeof url === 'undefined') return failure(new Error("Argument 'url' is required"));
      try {
        /** Parse HTML Document */
        const $ = await readHtml(url);
        let mainTitle: string = '';
        let altTitles: string[] = [];
        let authors: MangaAuthors[] = [];
        let status: string = '';
        let updatedAt: Date = new Date();
        let views: string = '';
        const genres: MangaGenres[] = [];
        let coverImage: MangaAttributeCoverImage = { url: '', alt: '' };
        let summary: string = '';
        const chapters_names: string[] = [];
        const chapters_urls: string[] = [];
        const chapters_views: string[] = [];
        const chapters_dates: Date[] = [];

        /** Get manga title */
        $(`div.panel-story-info > div.story-info-right > h1`).each((_, element) => {
          const main_title = $(element).text();
          if (typeof main_title !== 'undefined') mainTitle = main_title;
        });

        /** Get manga alternate titles */
        $(`div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-value > h2`).each((_, el) => {
          const alternate_titles = $(el).text();
          if (typeof alternate_titles === 'undefined') return;
          altTitles = splitAltTitles(alternate_titles);
        });

        /** Get manga author(s) */
        $(`div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-value > a[rel="nofollow"]`).each(
          (_, el) => {
            const author = $(el).text();
            const url = $(el).attr('href');

            if (typeof author !== 'undefined' && typeof url !== 'undefined') authors.push({ name: author, url });
          },
        );

        /** Get manga status */
        $(`div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-label > i.info-status`)
          .parent()
          .siblings('td.table-value')
          .each((_, el) => {
            const manga_status = $(el).text();
            if (typeof manga_status !== 'undefined') status = manga_status;
          });

        /** Get manga genres */
        $(`div.story-info-right > table.variations-tableInfo > tbody > tr > td.table-label > i.info-genres`)
          .parent()
          .siblings('td.table-value')
          .children(`a`)
          .each((_, el) => {
            const genre = $(el).text();
            const genre_url = $(el).attr('href');

            if (typeof genre !== 'undefined' && typeof genre_url !== 'undefined') {
              genres.push({ genre: genre as MangakakalotGenre, url: genre_url });
            }
          });

        /** Get manga updated date */
        $(`div.story-info-right-extent > p > span.stre-label > i.info-time`)
          .parent()
          .siblings('span.stre-value')
          .each((_, el) => {
            const date = $(el).text();
            if (typeof date !== 'undefined') updatedAt = moment(date, 'MMM DD,YYYY - hh:mm A').toDate();
          });

        /** Get manga views */
        $(`div.story-info-right-extent > p > span.stre-label > i.info-view`)
          .parent()
          .siblings('span.stre-value')
          .each((_, el) => {
            const viewCount = $(el).text();
            if (typeof views !== 'undefined') views = viewCount;
          });

        /** Get manga rating */
        let rating_text: string[] = [];
        $(`div.story-info-right-extent > p > em#rate_row_cmd > em > em`).each((_, el) => {
          const string = $(el).text();
          if (typeof string !== 'undefined') {
            const rate_text = string.trim().split(' ').join('').split('\n');

            rate_text.forEach((text) => rating_text.push(text));
          }
        });
        let rating: MangaRating = {
          sourceRating: rating_text[0],
          voteCount: Number(rating_text[4]),
          rating_percentage: `${(Number(rating_text[2].substring(0, 3)) / Number(rating_text[3])) * 100}%`,
          rating_stars: `${rating_text[2].substring(0, 3)} / ${rating_text[3]}`,
        };

        /** Get manga summary */
        summary = $(`div.panel-story-info-description`)
          .clone()
          .children()
          .remove()
          .end()
          .text()
          .replace(/\r?\n|\r/g, ' ')
          .trim();

        /** Get manga cover image */
        $(`div.story-info-left > span.info-image > img`).each((_, el) => {
          const img = $(el).attr('src');
          const alt = $(el).attr('alt');

          if (typeof alt !== 'undefined') coverImage = { url: img, alt };
        });

        /** Get manga chapters */
        // Get chapter names and URLs
        $(`div.panel-story-chapter-list > ul.row-content-chapter > li > a.chapter-name`).each((_, el) => {
          const chapter_name = $(el).text();
          const chapter_url = $(el).attr('href');
          if (typeof chapter_name !== 'undefined' && typeof chapter_url !== 'undefined') {
            chapters_names.push(chapter_name);
            chapters_urls.push(chapter_url);
          }
        });

        // Get chapter views
        $(`div.panel-story-chapter-list > ul.row-content-chapter > li > span.chapter-view`).each((_, el) => {
          const chapter_views = $(el).text();
          if (typeof chapter_views !== 'undefined') chapters_views.push(chapter_views);
        });

        // Get chapter dates
        $(`div.panel-story-chapter-list > ul.row-content-chapter > li > span.chapter-time`).each((_, el) => {
          const chapter_dates = $(el).text();
          if (typeof chapter_dates !== 'undefined') chapters_dates.push(moment(chapter_dates, 'MMM DD,YY').toDate());
        });

        /** Get data from chapters and arrange them into JSON-like data */
        const chapters: MangaChapters[] = new Array(chapters_names.length).fill('').map((_, index) => ({
          name: chapters_names[index],
          url: chapters_urls[index],
          views: chapters_views[index],
          uploadDate: chapters_dates[index],
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
            genres,
            rating,
            updatedAt,
            views,
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
   * Get raw image URLs from a chapter URL. Since readmanganato uses cloudflare, make sure
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
  public getPages(url: string, callback: CallbackFunc<string[]> = () => {}): Promise<string[]> {
    return new Promise(async (res, rej) => {
      if (typeof url === 'undefined') return failure(new Error("Argument 'url' is required"), callback);

      try {
        /** Parse HTML Document */
        const $ = await readHtml(url);
        const pages: string[] = [];

        /** Get each page url */
        $(`div.container-chapter-reader > img`).each((_, el) => {
          const img = $(el).attr('src');
          if (typeof img !== 'undefined') pages.push(img);
        });

        success(pages, callback, res);
      } catch (e) {
        return failure(new Error(e), callback);
      }
    });
  }

  /**
   * Get a list of manga that contain the given genre.
   * This can only search for one genre at a time, so if you
   * want to search multiple genres, use the `getMangas()` method instead.
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
    genre: MangaNatoGenre,
    options: MangaNatoGenreOptions = {},
    callback: CallbackFunc<Manga[]> = () => {},
  ): Promise<Manga[]> {
    const { type = 'updated', status = 'all', page = 1 } = options;

    function generateURL(): string {
      const filter_state = `state=${status}`;
      const filter_type = `type=${type === 'updated' ? 'latest' : 'newest'}`;
      const base_url = `https://manganato.com/genre-${MangaNatoGenres[genre]}?${filter_type}&${filter_state}`;

      return base_url;
    }

    return new Promise(async (res, rej) => {
      if (typeof genre === 'undefined') return failure(new Error("Argument 'genres' is required"), callback);
      if (page <= 0) return failure(new Error("'page' must be greater than 0"), callback);

      try {
        /** Parse HTML document */
        const $ = await readHtml(generateURL());
        const titles: string[] = [];
        const urls: string[] = [];
        const authors: string[][] = [];
        const updatedAt: Date[] = [];
        const views: string[] = [];
        const coverImage: MangaAttributeCoverImage[] = [];

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
          const time_string = $(el).text();
          if (typeof time_string !== 'undefined') updatedAt.push(moment(time_string, 'MMM DD,YY').toDate());
        });

        /** Get manga authors */
        $(
          `div.panel-content-genres > div.content-genres-item > div.genres-item-info > p.genres-item-view-time > span.genres-item-author`,
        ).each((_, el) => {
          const author = $(el).text();
          if (typeof author !== 'undefined') authors.push(author.split(','));
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

        const mangas: Manga[] = new Array(titles.length).fill('').map((_, index) => ({
          title: titles[index],
          url: urls[index],
          authors: authors[index],
          updatedAt: updatedAt[index],
          views: views[index],
          coverImage: coverImage[index],
        }));

        success(mangas, callback, res);
      } catch (e) {
        return failure(new Error(e), callback);
      }
    });
  }
}
