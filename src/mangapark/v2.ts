import {
  CallbackFunc,
  MangaParkv2Genres,
  MangaParkv2Manga,
  MangaParkv2Options,
  MangaParkv2RatingEnum,
  MangaParkv2SortByEnum,
} from '..';
import failure from '../functions/failure';
import readHtml from '../functions/readHtml';

export default class MangaParkv2 {
  public getMangas(
    search: string = '',
    options: MangaParkv2Options = {},
    callback?: CallbackFunc<MangaParkv2Manga>,
  ): Promise<MangaParkv2Manga> {
    const {
      genres,
      searchFor = 'title',
      status = 'all',
      rating,
      type,
      page = 1,
      yearReleased,
      showSummary = false,
      sortBy = 'Rating',
    } = options;

    function generateURL(query: string): string {
      const q = encodeURIComponent(query); // Short for query
      const orderBy = `orderby=${MangaParkv2SortByEnum[sortBy]}`;
      const include_genres = genres?.include
        ? `genres=${genres?.include.map((genre) => MangaParkv2Genres[genre]).join(',')}`
        : '';
      const exclude_genres = genres?.exclude
        ? `genres-exclude=${genres?.include?.map((genre) => MangaParkv2Genres[genre]).join(',')}`
        : '';
      const mangaStatus = status === 'all' ? `status=${status}` : ``;
      const mangaRating = rating ? `rating=${MangaParkv2RatingEnum[rating]}` : '';
      const mangaType = type ? `types=${type}` : '';
      const stss = `st-ss=${showSummary ? '1' : '0'}`; // Short for show summary
      const years = typeof yearReleased !== 'undefined' ? `years=${yearReleased}` : '';
      const url_page = `page=${page}`;

      let url_args = [
        q,
        orderBy,
        include_genres,
        exclude_genres,
        mangaStatus,
        mangaRating,
        mangaType,
        years,
        stss,
        url_page,
      ]
        .filter((el) => el.length > 0)
        .join('&');

      const base_url = `https://v2.mangapark.net/search?${url_args}`;
      console.log(base_url);
      return base_url;
    }

    return new Promise(async (res) => {
      if (page <= 0) return failure(new Error('"page" must be greater than 0'), callback);

      try {
        const $ = await readHtml(generateURL(search));
      } catch (e) {
        return failure(new Error(e), callback);
      }
    });
  }
}
