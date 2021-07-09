import {
  Manga,
  MangaCallback,
  MangaCoverImage,
  MangaFilters,
  MangaGenre,
  MangaParkGenres,
  MangaRating,
  MangaSearch,
  MangaStatus,
  MangaType,
  ScrapingOptions,
} from '..';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';

export type MangaParkManga = {
  title: string;
  url: string;
  authors: string[];
  coverImage: MangaCoverImage;
  genres: string[];
  rating: MangaRating;
};

export interface MangaParkOptions {
  genre?: {
    include?: MangaGenre<MangaPark>[];
    exclude?: MangaGenre<MangaPark>[];
  };
  status?: MangaStatus<MangaPark>;
  rating?: '5☆' | '4☆' | '3☆' | '2☆' | '1☆' | '0☆';
  type?: MangaType<MangaPark>;
  yearReleased?: string;
}

export type MangaParkGenre = keyof typeof MangaParkGenres;

let memo: string[] = [];

export default class MangaPark {
  private options: ScrapingOptions;

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  search(
    title: MangaSearch<MangaPark>,
    filters: MangaFilters<MangaPark> = {},
    callback: MangaCallback<Manga<MangaPark>[]> = () => {},
  ): Promise<Manga<MangaPark>[]> {
    const { genre, status = 'any', rating, type, yearReleased } = filters;

    function generateURL() {
      const query = (() => {
        if (title == null || (typeof title === 'string' && title.length === 0)) return '';
        if (typeof title === 'string') return `q=${title}`;

        let author;
        let query;

        if (title.author == null) author = '';
        else author = `autart=${title.author}`;
        if (query == null) query = '';
        else query = `q=${title.title}`;
        return [query, author].filter((item) => item.length !== 0).join('');
      })();

      const includeGenres =
        genre && genre.include && genre.include.length > 0
          ? `genres=${genre.include.map((genre) => MangaParkGenres[genre])}`
          : '';

      const excludeGenres =
        genre && genre.exclude && genre.exclude.length > 0
          ? `genres-exclude=${genre.exclude.map((genre) => MangaParkGenres[genre])}`
          : '';

      const mangaRating = rating ? `rating=${rating.substring(0, 0)}` : '';

      const mangaStatus = status !== 'any' ? `status=${status}` : '';

      const mangaType = type ? `types=${type}` : '';

      const year = yearReleased ? `years=${yearReleased}` : '';

      const args = [query, includeGenres, excludeGenres, mangaRating, mangaStatus, mangaType, year]
        .filter((i) => i.length !== 0)
        .join('&');

      return `https://v2.mangapark.net/search?${args}`;
    }

    return new Promise(async (res) => {
      try {
        // Parse HTML document
        const $ = await readHtml(generateURL(), this.options);
        const titleURLs = $('h2 > a')
          .map((_, el) => {
            const anchorEl = $(el);
            const url = `https://v2.mangapark.net${anchorEl.attr('href')}` || '';
            const title = anchorEl.attr('title') || '';
            return {
              url,
              title,
            };
          })
          .get();

        const authors = $('div:contains("Authors/Artists") > b.pd')
          .prevAll()
          .map((_, el) => {
            const text = $(el).text();
            if (!text.match('Authors/Artists:')) memo = [...memo, text];
            else {
              const prevMemo = memo;
              memo = [];
              return [prevMemo];
            }
          })
          .get();

        const genres = $('div.field.last > a')
          .map((_, el) => {
            const anchorEl = $(el);
            const text = anchorEl.text();
            if (anchorEl.next().is('a')) memo = [...memo, text];
            else {
              const prevMemo = memo;
              memo = [];
              return [prevMemo];
            }
          })
          .get();

        const rating = $('div.rate').map((_, el) => {
          const divEl = $(el);
          const rating = divEl.attr('title')?.split(' ') || [];
          const numerator = Number(rating[1]);
          const denominator = Number(rating[3]);
          const voteCount = Number(rating[6]);
          return {
            sourceRating: 'MangaPark.net',
            voteCount,
            rating_percentage: `${((numerator / denominator) * 100).toFixed(2)}%`,
            rating_stars: `${numerator} / ${denominator}`,
          };
        });

        const coverImage = $('a.cover > img')
          .map((_, el) => {
            const imgEl = $(el);
            const img = imgEl.attr('src');
            const alt = imgEl.attr('alt') || '';
            return {
              url: img,
              alt,
            };
          })
          .get();

        const data = titleURLs.map(({ title, url }, i) => ({
          title,
          url,
          authors: authors[i],
          coverImage: coverImage[i],
          genres: genres[i],
          rating: rating[i],
        }));

        success(data as any, callback, res);
      } catch (e) {
        failure(new Error(e), callback);
      }
    });
  }
}
