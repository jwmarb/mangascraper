export { default as Mangakakalot } from './mangakakalot';
export { default as MangaNato } from './manganato';

export type CallbackFunc<T> = (error?: Error | undefined, result?: T) => void;

export interface Manga {
  title: string;
  url: string;
  authors: string[];
  updatedAt: Date;
  views: string;
  coverImage: MangaAttributeCoverImage;
}

export interface MangaList {
  title: string;
  url: string;
  views: string;
  coverImage: MangaAttributeCoverImage;
}

export interface MangaMeta {
  title: {
    main: string;
    alt: string[];
  };
  authors: MangaAuthors[];
  status: string;
  updatedAt: Date;
  views: string;
  genres: MangaGenres[];
  rating: MangaRating;
  coverImage: MangaAttributeCoverImage;
  summary: string | null;
  chapters: MangaChapters[];
}

export type MangaAuthors = {
  name: string;
  url: string;
};

export interface MangaChapters {
  name: string;
  url: string;
  views: string;
  uploadDate: Date;
}

export type MangaRating = {
  sourceRating: string;
  voteCount: number;
  rating_percentage: string;
  rating_stars: string;
};

export type MangaAttribute = {
  index: number;
  item: string | string[];
};

export type MangaGenres = {
  genre: MangakakalotGenre;
  url: string;
};

export type MangaAttributeCoverImage = {
  url: string | undefined;
  alt: string;
};

export type MangaOrder = 'latest_updates' | 'top_view' | 'new_manga' | 'A-Z';

export interface MangaOptions {
  genre?: MangakakalotGenre | null;
  status?: MangaStatus | null;
  type?: MangaType | null;
}

export interface MangaNatoOptions {
  genre?: { include?: MangaNatoGenre[]; exclude?: MangaNatoGenre[] } | null;
  status?: MangaStatus | null;
  searchFor?: 'title' | 'alt_titles' | 'authors' | 'all';
  orderBy?: MangaOrder;
  page?: number;
}

export type MangaStatus = 'ongoing' | 'completed' | 'all';

export type MangaType = 'new' | 'updated';

export type MangakakalotGenre = keyof typeof MangakakalotGenres;

export type MangaNatoGenre = keyof typeof MangaNatoGenres;

export enum MangakakalotGenres {
  'All' = 'all',
  'Action' = '2',
  'Adult' = '3',
  'Adventure' = '4',
  'Comedy' = '6',
  'Cooking' = '7',
  'Doujinshi' = '9',
  'Drama' = '10',
  'Ecchi' = '11',
  'Fantasy' = '12',
  'Gender bender' = '13',
  'Harem' = '14',
  'Historical' = '15',
  'Horror' = '16',
  'Isekai' = '45',
  'Josei' = '17',
  'Manhua' = '44',
  'Manhwa' = '43',
  'Martial arts' = '19',
  'Mature' = '20',
  'Mecha' = '21',
  'Medical' = '22',
  'Mystery' = '24',
  'One shot' = '25',
  'Psychological' = '26',
  'Romance' = '27',
  'School life' = '28',
  'Sci fi' = '29',
  'Seinen' = '30',
  'Shoujo' = '31',
  'Shoujo ai' = '32',
  'Shounen' = '33',
  'Shounen ai' = '34',
  'Slice of life' = '35',
  'Smut' = '36',
  'Sports' = '37',
  'Supernatural' = '38',
  'Tragedy' = '39',
  'Webtoons' = '40',
  'Yaoi' = '41',
  'Yuri' = '42',
}

export enum MangaNatoGenres {
  'Action' = '2',
  'Adult' = '3',
  'Adventure' = '4',
  'Comedy' = '6',
  'Cooking' = '7',
  'Doujinshi' = '9',
  'Drama' = '10',
  'Ecchi' = '11',
  'Fantasy' = '12',
  'Gender bender' = '13',
  'Harem' = '14',
  'Historical' = '15',
  'Horror' = '16',
  'Isekai' = '45',
  'Josei' = '17',
  'Manhua' = '44',
  'Manhwa' = '43',
  'Martial arts' = '19',
  'Mature' = '20',
  'Mecha' = '21',
  'Medical' = '22',
  'Mystery' = '24',
  'One shot' = '25',
  'Psychological' = '26',
  'Romance' = '27',
  'School life' = '28',
  'Sci fi' = '29',
  'Seinen' = '30',
  'Shoujo' = '31',
  'Shoujo ai' = '32',
  'Shounen' = '33',
  'Shounen ai' = '34',
  'Slice of life' = '35',
  'Smut' = '36',
  'Sports' = '37',
  'Supernatural' = '38',
  'Tragedy' = '39',
  'Webtoons' = '40',
  'Yaoi' = '41',
  'Yuri' = '42',
}
