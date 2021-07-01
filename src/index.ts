import Mangahasu from './mangahasu';
import Mangakakalot from './mangakakalot';
import Manganato from './manganato';

export { default as Mangakakalot } from './mangakakalot';
export { default as Manganato } from './manganato';
export { default as Mangahasu } from './mangahasu';

export type MangaCallback<T> = (error?: Error | undefined, result?: T) => void;

export interface Manga {
  title: string;
  url: string;
  authors: string[];
  updatedAt: Date;
  views: string;
  coverImage: MangaAttributeCoverImage;
}

export interface MangakakalotManga extends Manga {}
export interface ManganatoManga extends Manga {}
export interface MangahasuManga {
  title: string;
  url: string;
  coverImage: MangaAttributeCoverImage;
}

export type ManganatoQuery = { keywords: 'author' | 'title' | 'alt_title' | 'everything'; search: string } | string;

export type MangaSearch<T> = T extends Manganato
  ? ManganatoQuery
  :
      | {
          title: string;
          author?: T extends Mangahasu ? string : never;
          artist?: T extends Mangahasu ? string : never;
        }
      | string;

export type MangaFilters<T> = T extends Manganato
  ? ManganatoOptions
  : T extends Mangakakalot
  ? MangakakalotOptions
  : T extends Mangahasu
  ? MangahasuOptions
  : never;

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

export interface MangakakalotOptions {
  genre?: MangakakalotGenre | null;
  status?: MangaStatus | null;
  type?: MangaAge | null;
  page?: number;
}

export interface ManganatoOptions {
  genre?: { include?: ManganatoGenre[]; exclude?: ManganatoGenre[] } | null;
  status?: MangaStatus | null;
  orderBy?: MangaOrder;
  page?: number;
}

export interface MangakakalotGenreOptions extends MangaNatoGenreOptions {}

export interface MangaNatoGenreOptions {
  age?: MangaAge;
  status?: MangaStatus;
  page?: number;
}

export type MangaStatus = 'ongoing' | 'completed' | 'all';

export type MangaAge = 'new' | 'updated';

export interface MangahasuOptions {
  genres?: {
    include?: MangahasuGenre[];
    exclude?: MangahasuGenre[];
  };
  status?: MangaStatus;
  type?: MangahasuType;
  page?: number;
}

export type MangahasuType = keyof typeof MangahasuTypes;

export enum MangahasuTypes {
  'any' = '',
  'manga' = '10',
  'manhwa' = '12',
  'manhua' = '19',
}

export type MangakakalotGenre = keyof typeof MangakakalotGenres;

export type ManganatoGenre = keyof typeof ManganatoGenres;

export type MangahasuGenre = keyof typeof MangahasuGenres;

export enum MangahasuGenres {
  '4-koma' = '46',
  'Action' = '1',
  'Adaptation' = '101',
  'Adult' = '2',
  'Adventure' = '3',
  'Aliens' = '103',
  'Animals' = '73',
  'Anime' = '57',
  'Anthology' = '99',
  'Award Winning' = '48',
  'Bara' = '60',
  'Comedy' = '4',
  'Comic' = '5',
  'Cooking' = '6',
  'Crime' = '92',
  'Crossdressing' = '86',
  'Delinquents' = '83',
  'Demons' = '51',
  'Doujinshi' = '7',
  'Drama' = '8',
  'Ecchi' = '9',
  'Fan Colored' = '107',
  'Fantasy' = '10',
  'Full Color' = '95',
  'Game' = '68',
  'Gender Bender' = '11',
  'Genderswap' = '81',
  'Ghosts' = '90',
  'Gore' = '100',
  'Gyaru' = '97',
  'Harem' = '12',
  'Historical' = '13',
  'Horror' = '14',
  'Incest' = '84',
  'Isekai' = '67',
  'Josei' = '15',
  'Live Action' = '59',
  'Loli' = '91',
  'Lolicon' = '16',
  'Long Strip' = '93',
  'Mafia' = '113',
  'Magic' = '55',
  'Magical Girls' = '89',
  'Manga Reviews' = '64',
  'Martial Arts' = '20',
  'Mature' = '21',
  'Mecha' = '22',
  'Medical' = '23',
  'Military' = '62',
  'Monster Girls' = '87',
  'Monsters' = '72',
  'Music' = '24',
  'Mystery' = '25',
  'Netorare/NTR' = '123',
  'Ninja' = '112',
  'Office' = '119',
  'Office Workers' = '80',
  'Official Colored' = '96',
  'One shot' = '26',
  'Others' = '114',
  'Philosophical' = '110',
  'Police' = '105',
  'Post-Apocalyptic' = '76',
  'Psychological' = '27',
  'Reincarnation' = '74',
  'Reverse harem' = '69',
  'Romance' = '28',
  'Samurai' = '108',
  'school' = '118',
  'School Life' = '29',
  'School Life. Seinen' = '115',
  'Sci-fi' = '30',
  'Seinen' = '31',
  'Seinen  Supernatural' = '66',
  'Sexual Violence' = '98',
  'Shota' = '104',
  'Shotacon' = '32',
  'Shoujo' = '33',
  'Shoujo Ai' = '34',
  'Shoujoai' = '63',
  'Shounen' = '35',
  'Shounen Ai' = '36',
  'Shounenai' = '61',
  'Slice of Life' = '37',
  'SM/BDSM' = '122',
  'Smut' = '38',
  'Sports' = '39',
  'Super power' = '70',
  'Superhero' = '88',
  'Supernatural' = '40',
  'Survival' = '77',
  'Thriller' = '75',
  'Time Travel' = '78',
  'Traditional Games' = '111',
  'Tragedy' = '41',
  'Uncategorized' = '65',
  'User Created' = '102',
  'Vampire' = '58',
  'Vampires' = '82',
  'Video Games' = '85',
  'Villainess' = '116',
  'Violence' = '120',
  'Virtual Reality' = '109',
  'Web Comic' = '94',
  'Webtoon' = '42',
  'Webtoons' = '56',
  'Western' = '121',
  'Wuxia' = '71',
  'Yaoi' = '43',
  'Youkai' = '106',
  'Yuri' = '44',
  'Zombies' = '79',
}

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

export enum ManganatoGenres {
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
