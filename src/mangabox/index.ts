import { parse } from 'date-fns';
import {
  Manga,
  MangaBoxGenres,
  MangaBoxOrderBy,
  MangaBoxStatus,
  MangaCallback,
  MangaChapters,
  MangaFilters,
  MangaGenre,
  MangaMeta,
  MangaOrder,
  MangaRating,
  MangaSearch,
  MangaStatus,
  ScrapingOptions,
} from '..';
import automateBrowser from '../functions/automateBrowser';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import cheerio from 'cheerio';

export type MangaBoxGenre = keyof typeof MangaBoxGenres;

export interface MangaBoxMeta {
  title: {
    main: string;
    alt: string[];
  };
  authors: string[];
  artists: string[];
  genres: MangaGenre<MangaBox>[];
  status: MangaStatus<MangaBox>;
  rating: MangaRating;
  coverImage: string;
  summary: string;
  chapters: MangaChapters<MangaBox>[];
  rank: string;
}

export interface MangaBoxManga {
  title: string;
  url: string;
  genres: MangaBoxGenre[];
  coverImage: string;
  authors: string[];
  status: MangaStatus<MangaBox>;
  updatedAt: Date;
}

export interface MangaBoxOptions {
  genres?: {
    include?: MangaBoxGenre[];
    condition?: 'or' | 'and';
  };
  yearReleased?: number;
  includeNSFW?: boolean;
  status?: MangaStatus<MangaBox>[] | 'any';
  orderBy?: MangaOrder<MangaBox>;
}

class MangaBox {
  private options: ScrapingOptions;
  private BLOCKED_DOMAINS = [
    'https://jsc.adskeeper.co.uk/',
    'https://pagead2.googlesyndication.com/',
    'https://mc.yandex.ru/metrika/tag.js',
    'https://mangabox.org/wp-includes/js/wp-emoji-release.min.js?ver=5.8',
    'https://mangabox.org/wp-content/themes/madara/js/core.js',
    'https://mangabox.org/wp-includes/js/jquery/jquery-migrate.min.js?ver=3.3.2',
    'https://mangabox.org/wp-includes/js/wp-embed.min.js',
    'https://mangabox.org/wp-content/plugins/madara-core/assets/js/manga-single.js',
    'https://mangabox.org/wp-includes/js/comment-reply.min.js',
    'https://mangabox.org/wp-content/themes/madara/js/smoothscroll.js',
    'https://mangabox.org/wp-includes/js/imagesloaded.min.js',
    'https://mangabox.org/wp-content/themes/madara/js/bootstrap.min.js',
    'https://mangabox.org/wp-content/themes/madara/js/lazysizes/lazysizes.min.js',
    'https://mangabox.org/wp-content/themes/madara/js/aos.js',
    'https://mangabox.org/wp-content/themes/madara/js/shuffle.min.js?ver=5.3.0',
    'https://mangabox.org/wp-content/plugins/madara-shortcodes/shortcodes/js/ct-shortcodes.js',
    'https://mangabox.org/wp-includes/js/jquery/ui/core.min.js',
    'https://mangabox.org/wp-content/themes/madara/js/slick/slick.min.js',
    'https://mangabox.org/wp-includes/js/jquery/ui/autocomplete.min.js',
    'https://mangabox.org/wp-includes/js/dist/a11y.min.js',
    'https://mangabox.org/wp-includes/js/dist/i18n.min.js',
    'https://mangabox.org/wp-includes/js/dist/hooks.min.js',
    'https://mangabox.org/wp-includes/js/dist/dom-ready.min.js',
    'https://mangabox.org/wp-includes/js/dist/vendor/wp-polyfill.min.js',
    'https://mangabox.org/wp-includes/js/dist/vendor/regenerator-runtime.min.js',
    'https://mangabox.org/wp-includes/js/jquery/ui/menu.min.js',
    'https://mangabox.org/wp-content/plugins/madara-core/assets/slick/slick.min.js',
    'https://mangabox.org/wp-content/plugins/madara-core/assets/js/login.js',
    'https://mangabox.org/wp-content/themes/madara/js/template.js',
    'https://mangabox.org/wp-content/themes/madara/js/ajax.js',
  ];

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  /**
   * Search up a manga from MangaBox
   *
   * @param query - Query to provide to MangaBox's search
   * @param filters - Filters to apply in MangaBox's search
   * @param callback - Callback function
   * @returns Returns an array of mangas from MangaBox's search results
   * @example
   *
   * ```js
   * await mangabox.search(null, {
   *    genres: {
   *        include: ['Detective', 'Martial Arts'],
   *        condition: 'or'
   *    },
   *    status: ['completed', 'ongoing'],
   *    orderBy: 'trending'
   * })
   * ```
   */
  public search(
    query?: MangaSearch<MangaBox>,
    filters?: MangaFilters<MangaBox>,
    callback: MangaCallback<any> = () => void 0,
  ): Promise<any> {
    if (query == null) query = '';
    if (filters == null) filters = {};
    const {
      genres = { include: [], condition: 'and' },
      yearReleased,
      includeNSFW = false,
      status = 'any',
      orderBy = 'relevance',
    } = filters;
    const searchURL = (() => {
      const searchQueryParam = (() => {
        switch (typeof query) {
          case 'string':
            return `s=${query.replace(/ /g, '+')}`;
          case 'object': {
            const authorParam = query.author ? `author=${query.author}` : '';
            const artistParam = query.artist ? `artist=${query.artist}` : '';
            const titleParam = query.title ? `s=${query.title.replace(/ /g, '+')}` : '';
            return [titleParam, artistParam, authorParam].filter((string) => string.length !== 0).join('&');
          }
        }
      })();
      const genreParam = genres?.include
        ? [
            ...genres.include.map((genre) => `genre[]=${MangaBoxGenres[genre]}`),
            `op=${genres.condition === 'and' || genres.condition == null ? '1' : ''}`,
          ].join('&')
        : '';
      const yearReleasedParam = yearReleased ? `release=${yearReleased}` : '';
      const adultContentParam = includeNSFW ? 'adult=' : 'adult=0';
      const statusParam =
        status === 'any' || status == null
          ? ''
          : status.map((statusInput) => `status[]=${MangaBoxStatus[statusInput]}`).join('&');

      const orderParam = `m_orderby=${MangaBoxOrderBy[orderBy]}`;

      return `https://mangabox.org/?${[
        searchQueryParam,
        'post_type=wp-manga',
        genreParam,
        yearReleasedParam,
        adultContentParam,
        statusParam,
        orderParam,
      ]
        .filter((param) => param.length !== 0)
        .join('&')}`;
    })();
    return new Promise(async (res, rej) => {
      try {
        const $ = await readHtml(searchURL, this.options);
        const mangaList = $('div.row.c-tabs-item__content');
        const mangaListLength = mangaList.length;
        const mangas: Manga<MangaBox>[] = [];

        for (let i = 0; i < mangaListLength; i++) {
          const divContainer = mangaList.eq(i);
          const imgEl = divContainer.find('div.c-image-hover > a > img');
          const coverImage = imgEl.attr('data-src') ?? '';
          const anchorEl = divContainer.find('div.post-title > h3 > a');
          const title = anchorEl.text().trim();
          const url = anchorEl.attr('href') ?? '';
          const authors = divContainer.find('div.mg_author > div.summary-content > a').text().trim().split(' - ');
          const genres = divContainer
            .find('div.mg_genres > div.summary-content')
            .text()
            .trim()
            .split(', ') as MangaGenre<MangaBox>[];
          const status = (() => {
            const mangaBoxStatus = divContainer.find('div.mg_status > div.summary-content').text().trim();
            switch (mangaBoxStatus) {
              case 'OnGoing':
                return 'ongoing';
              case 'Completed':
                return 'completed';
              default:
                return mangaBoxStatus.toLowerCase();
            }
          })() as MangaStatus<MangaBox>;
          const updatedAt = new Date(divContainer.find('div.meta-item.post-on > span.font-meta').text());
          mangas.push({ title, url, authors, coverImage, genres, status, updatedAt });
        }

        success(mangas, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }

  public getMangaMeta(
    url: string,
    callback: MangaCallback<MangaMeta<MangaBox>> = () => void 0,
  ): Promise<MangaMeta<MangaBox>> {
    return new Promise(async (res, rej) => {
      if (url == null) return failure('Argument "url" is required', callback, rej);
      try {
        const html = await automateBrowser(
          this.options,
          async (page) => {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('ul.main');
            return await page.evaluate(() => document.body.outerHTML);
          },
          {
            resource: { type: ['document', 'script', 'xhr'], method: 'unblock' },
            domains: { method: 'block', value: this.BLOCKED_DOMAINS },
          },
        );
        const $ = cheerio.load(html);
        const title = $('h1').text().trim();
        const ratingStars = $('div.post-rating > div.post-total-rating > span').text();
        const ratingTotalVotes = $(
          'div.post-content_item > div.summary-content.vote-details > span[property="ratingCount"]#countrate',
        ).text();
        const rating: MangaRating = {
          sourceRating: 'mangabox.org',
          ratingStars: `${ratingStars}/5`,
          ratingPercentage: `${((Number(ratingStars) / 5) * 100).toFixed(2)}%`,
          voteCount: ratingTotalVotes,
        };
        const rank =
          $('div.summary-heading:contains("Rank")')
            .siblings('div.summary-content')
            .text()
            .trim()
            .match(/\d+(st|nd|rd|th|),/g)
            ?.toString()
            .slice(0, -1) ?? '?';
        const altTitles = $('div.summary-heading:contains("Alternative")')
          .siblings('div.summary-content')
          .text()
          .replace(/\n/g, '')
          .split('; ')
          .slice(0, -1);
        const authors = $('div.author-content > a')
          .map((_, el) => $(el).text())
          .get();
        const artists = $('div.artist-content > a')
          .map((_, el) => $(el).text())
          .get();
        const genres = $('div.genres-content > a')
          .map((_, el) => $(el).text())
          .get() as MangaGenre<MangaBox>[];
        const summary = $('div.summary__content.show-more').children().remove().end().text().trim();
        const status = (() => {
          const mangaStatus = $('div.post-status > div.post-content_item > div.summary-heading:contains("Status")')
            .siblings('div.summary-content')
            .text()
            .trim();
          switch (mangaStatus) {
            case 'OnGoing':
              return 'ongoing';
            case 'Completed':
              return 'completed';
            default:
              return mangaStatus.toLowerCase();
          }
        })() as MangaStatus<MangaBox>;
        const coverImage = $('div.summary_image > a > img').attr('data-src') ?? '';
        const chapters: MangaChapters<MangaBox>[] = [];
        const chapterList = $('ul.main > li');
        const chapterListLength = chapterList.length;

        for (let i = 0; i < chapterListLength; i++) {
          const chapterContainer = chapterList.eq(i);
          const anchorEl = chapterContainer.find('a');
          const chapterName = anchorEl.text().trim();
          const chapterUrl = anchorEl.attr('href') ?? '';
          const date = chapterContainer.find('span.chapter-release-date').text().trim();
          const chapterDate = parse(date, 'dd.MM.yyyy', new Date());
          console.log(chapterDate);
          chapters.push({ name: chapterName, url: chapterUrl, uploadDate: chapterDate });
        }

        success(
          {
            title: { main: title, alt: altTitles },
            authors,
            artists,
            genres,
            coverImage,
            status,
            rank,
            rating,
            summary,
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

  public getPages(url: string, callback: MangaCallback<string[]> = () => void 0): Promise<string[]> {
    return new Promise(async (res, rej) => {
      try {
        const $ = await readHtml(url, this.options);
        const pages = $('div.reading-content > div.page-break.no-gaps > img')
          .map((_, el) => $(el).attr('data-src')?.trim() ?? '')
          .get();
        success(pages, callback, res);
      } catch (e) {
        failure(e, callback, rej);
      }
    });
  }
}

export default MangaBox;
