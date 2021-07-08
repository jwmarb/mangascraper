import cheerio from 'cheerio';
import { Manga, MangaCallback, MangaCoverImage, MangaRating, ScrapingOptions } from '..';
import automateBrowser from '../functions/automateBrowser';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';
import success from '../functions/success';
import jquery from 'jquery';
import numberSeperator from '../functions/numberSeperator';

export type MangaParkManga = {
  title: {
    main: string;
    alt: string[];
  };
  url: string;
  authors: string[];
  coverImage: MangaCoverImage;
  genres: string[];
  rating: MangaRating;
};

let memo: string[] = [];

export default class MangaPark {
  private options: ScrapingOptions;

  constructor(options: ScrapingOptions = {}) {
    this.options = options;
  }

  search(title: string, callback: MangaCallback<Manga<MangaPark>[]> = () => {}): Promise<Manga<MangaPark>[]> {
    return new Promise(async (res) => {
      try {
        // Parse HTML document
        const $ = await readHtml(title, this.options);
        const titleURLs = $('h2 > a')
          .map((_, el) => {
            const anchorEl = $(el);
            const url = anchorEl.attr('href') || '';
            const title = anchorEl.attr('title') || '';
            return {
              url,
              title,
            };
          })
          .get();

        const altTitles = $('div.field:contains("Alternative:")')
          .map((_, el) => [
            $(el)
              .text()
              .trim()
              .replace(/(\r\n|\r|\n|\t)|[Alternative:]/g, '')
              .split(' , ')
              .map((text) => text.trim()),
          ])
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
          title: {
            main: title,
            alt: altTitles[i],
          },
          url,
          authors: authors[i],
          coverImage: coverImage[i],
          genres: genres[i],
          rating: rating[i],
        }));

        success(data, callback, res);
      } catch (e) {
        failure(new Error(e), callback);
      }
    });
  }
}
