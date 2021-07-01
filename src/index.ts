export { default as Mangakakalot } from './mangakakalot';
export { default as MangaNato } from './manganato';

export type CallbackFunc<T> = (error?: Error | undefined, result?: T) => void;

export interface Manga {
  title: string;
  url: string;
  authors?: string[];
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

export interface MangakakalotOptions {
  genre?: MangakakalotGenre | null;
  status?: MangaStatus | null;
  type?: MangaAge | null;
}

export interface MangaNatoOptions {
  genre?: { include?: MangaNatoGenre[]; exclude?: MangaNatoGenre[] } | null;
  status?: MangaStatus | null;
  searchFor?: 'title' | 'alt_titles' | 'authors' | 'all';
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

export type MangaType = 'manga' | 'manhwa' | 'manhua' | 'unknown';

export type MangaAge = 'new' | 'updated';

export type MangaParkRating = '5 stars' | '4 stars' | '3 stars' | '2 stars' | '1 stars' | '0 stars';

export interface MangaParkv2Options {
  genres?: {
    include?: MangaParkv2Genre[];
    exclude?: MangaParkv2Genre[];
  };
  searchFor?: 'title' | 'author/artist';
  status?: MangaStatus;
  rating?: MangaParkRating;
  type?: MangaType;
  yearReleased?: number | null;
}

export type MangakakalotGenre = keyof typeof MangakakalotGenres;

export type MangaNatoGenre = keyof typeof MangaNatoGenres;

export type MangaParkv2Genre = keyof typeof MangaParkv2Genres;

export enum MangaParkv2Genres {
  '4 koma' = '4-koma',
  'Aliens' = 'aliens',
  'Cooking' = 'cooking',
  'Doujinshi' = 'doujinshi',
  'Food' = 'food',
  'Ghosts' = 'ghosts',
  'Historical' = 'historical',
  'Kids' = 'kids',
  'Magic' = 'magic',
  'Mecha' = 'mecha',
  'Music' = 'music',
  'One shot' = 'one-shot',
  'Psychological' = 'psychological',
  'School life' = 'school-life',
  'Shoujo' = 'shoujo',
  'Smut' = 'smut',
  'Supernatural' = 'supernatural',
  'Toomics' = 'toomics',
  'Vampires' = 'vampires',
  'Webtoon' = 'webtoon',
  'Action' = 'action',
  'Animals' = 'animals',
  'Crime' = 'crime',
  'Drama' = 'drama',
  'Full color' = 'full-color',
  'Gore' = 'gore',
  'Horror' = 'horror',
  'Loli' = 'loli',
  'Magical girls' = 'magical-girls',
  'Medical' = 'medical',
  'Mystery' = 'mystery',
  'Parody' = 'parody',
  'Reincarnation' = 'reincarnation',
  'Sci fi' = 'sci-fi',
  'Shoujo ai' = 'shoujo-ai',
  'Space' = 'space',
  'Survival' = 'survival',
  'Traditional games' = 'traditional-games',
  'Wuxia' = 'wuxia',
  'Adaptation' = 'adaptation',
  'Anthology' = 'anthology',
  'Crossdressing' = 'crossdressing',
  'Ecchi' = 'ecchi',
  'Game' = 'game',
  'Gossip' = 'gossip',
  'Incest' = 'incest',
  'Lolicon' = 'lolicon',
  'Manhwa' = 'manhwa',
  'Military' = 'military',
  'Ninja' = 'ninja',
  'Philosophical' = 'philosophical',
  'Reverse harem' = 'reverse-harem',
  'Seinen' = 'seinen',
  'Shounen' = 'shounen',
  'Sports' = 'sports',
  'Suspense' = 'suspense',
  'Tragedy' = 'tragedy',
  'Villainess' = 'villainess',
  'Yaoi' = 'yaoi',
  'Adult' = 'adult',
  'Award winning' = 'award-winning',
  'Delinquents' = 'delinquents',
  'Fan colored' = 'fan-colored',
  'Gender bender' = 'gender-bender',
  'Gyaru' = 'gyaru',
  'Isekai' = 'isekai',
  'Long strip' = 'long-strip',
  'Martial arts' = 'martial-arts',
  'Monster girls' = 'monster-girls',
  'Office workers' = 'office-workers',
  'Police' = 'police',
  'Romance' = 'romance',
  'Shota' = 'shota',
  'Shounen ai' = 'shounen-ai',
  'Super power' = 'super-power',
  'Thriller' = 'thriller',
  'User created' = 'user-created',
  'Virtual reality' = 'virtual-reality',
  'Yuri' = 'yuri',
  'Adventure' = 'adventure',
  'Comedy' = 'comedy',
  'Demons' = 'demons',
  'Fantasy' = 'fantasy',
  'Genderswap' = 'genderswap',
  'Harem' = 'harem',
  'Josei' = 'josei',
  'Mafia' = 'mafia',
  'Mature' = 'mature',
  'Monsters' = 'monsters',
  'Official colored' = 'official-colored',
  'Post apocalyptic' = 'post-apocalyptic',
  'Samurai' = 'samurai',
  'Shotacon' = 'shotacon',
  'Slice of life' = 'slice-of-life',
  'Superhero' = 'superhero',
  'Time travel' = 'time-travel',
  'Vampire' = 'vampire',
  'Web comic' = 'web-comic',
  'Zombies' = 'zombies',
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
