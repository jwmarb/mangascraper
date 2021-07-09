import Mangahasu, { MangahasuGenre, MangahasuManga, MangahasuMeta, MangahasuOptions } from './mangahasu';
import Mangakakalot, {
  MangakakalotAlt,
  MangakakalotGenre,
  MangakakalotManga,
  MangakakalotOptions,
} from './mangakakalot';
import Manganato, { ManganatoGenre, ManganatoManga, ManganatoOptions, ManganatoQuery } from './manganato';
import MangaSee, { MangaSeeGenre, MangaSeeManga, MangaSeeMangaAlt, MangaSeeMeta, MangaSeeOptions } from './mangasee';
import MangaPark, { MangaParkManga, MangaParkGenre, MangaParkOptions, MangaParkMeta } from './mangapark';
import randomUserAgent from 'random-useragent';
import { LaunchOptions, BrowserLaunchArgumentOptions, BrowserConnectOptions, Product } from 'puppeteer';

export { default as Mangakakalot } from './mangakakalot';
export { default as Manganato } from './manganato';
export { default as Mangahasu } from './mangahasu';
export { default as MangaSee } from './mangasee';
export { default as MangaPark } from './mangapark';

export interface ScrapingOptions {
  proxy?: {
    host: string;
    port: number;
  };
  debug?: boolean;
  puppeteerInstance?: PuppeteerInstance;
}

type PuppeteerDefault = {
  instance: 'default';
  launch?: LaunchOptions &
    BrowserLaunchArgumentOptions &
    BrowserConnectOptions & {
      product?: Product;
      extraPrefsFirefox?: Record<string, unknown>;
    };
};
type PuppeteerServer = { instance: 'server'; wsEndpoint: string };
type PuppeteerInstance = PuppeteerDefault | PuppeteerServer;

export const initPuppeteer = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-accelerated-2d-canvas',
    '--no-zygote',
    '--renderer-process-limit=1',
    '--no-first-run',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-dev-shm-usage',
    '--disable-infobars',
    '--lang=en-US,en',
    '--window-size=1920x1080',
    '--disable-extensions',
    '--disable-gpu',
    `--user-agent=${randomUserAgent.getRandom((ua) => ua.osName === 'Windows' && ua.browserName === 'Chrome')}`,
  ],
  ignoreHTTPSErrors: true,
};

export type MangaCallback<T> = (error?: Error | undefined, result?: T) => void;

export interface MangaBase {
  title: string;
  url: string;
  authors: string[];
  updatedAt: Date;
  views: string;
  coverImage: MangaCoverImage;
}

export type Manga<T, S extends 'main' | 'alt' = 'main'> = T extends Mangakakalot
  ? S extends 'main'
    ? MangakakalotManga
    : MangakakalotAlt
  : T extends Manganato
  ? ManganatoManga
  : T extends Mangahasu
  ? MangahasuManga
  : T extends MangaSee
  ? S extends 'main'
    ? MangaSeeManga
    : MangaSeeMangaAlt
  : T extends MangaPark
  ? MangaParkManga
  : never;

export type MangaSearch<T> = T extends Manganato
  ? ManganatoQuery
  :
      | {
          title?: string;
          author?: T extends Mangahasu | MangaSee | MangaPark ? string : never;
          artist?: T extends Mangahasu ? string : never;
        }
      | string;

export type MangaFilters<T> = T extends Manganato
  ? ManganatoOptions
  : T extends Mangakakalot
  ? MangakakalotOptions
  : T extends Mangahasu
  ? MangahasuOptions
  : T extends MangaSee
  ? MangaSeeOptions
  : T extends MangaPark
  ? MangaParkOptions
  : never;

export type MangaGenre<T> = T extends Mangakakalot
  ? MangakakalotGenre
  : T extends Manganato
  ? ManganatoGenre
  : T extends Mangahasu
  ? MangahasuGenre
  : T extends MangaSee
  ? MangaSeeGenre
  : T extends MangaPark
  ? MangaParkGenre
  : never;

export type MangaMeta<T> = T extends Mangakakalot | Manganato
  ? {
      title: {
        main: string;
        alt: string[];
      };
      authors: string[];
      status: string;
      updatedAt: Date;
      views: string;
      genres: MangaGenre<T>[];
      rating: MangaRating;
      coverImage: MangaCoverImage;
      summary: string | null;
      chapters: MangaChapters<T>[];
    }
  : T extends Mangahasu
  ? MangahasuMeta
  : T extends MangaSee
  ? MangaSeeMeta
  : T extends MangaPark
  ? MangaParkMeta
  : never;

export type MangaChapters<T> = T extends Manganato | Mangakakalot
  ? {
      name: string;
      url: string;
      views: string;
      uploadDate: Date;
    }
  : T extends Mangahasu | MangaSee
  ? { name: string; url: string; uploadDate: Date }
  : T extends MangaPark
  ? { name: string; url: string; uploadWhen: string }
  : never;

export type MangaRating = {
  sourceRating: string;
  voteCount: number;
  rating_percentage: string;
  rating_stars: string;
};

export type MangaCoverImage = {
  url?: string;
  alt: string;
};

export type MangaOrder<T> = T extends Manganato | Mangakakalot
  ? 'latest_updates' | 'most_views' | 'new_manga' | 'A-Z'
  : T extends MangaSee
  ? keyof typeof MangaSeeOrderBy
  : T extends MangaPark
  ? keyof typeof MangaParkOrderBy
  : never;

export enum MangaParkOrderBy {
  'A-Z' = 'a-z',
  'latest_updates' = 'update',
  'rating' = 'rating',
  'new_manga' = 'create',
  'views' = 'views',
}

export enum MangaSeeOrderBy {
  'A-Z' = 's',
  'latest_updates' = 'lt',
  'year_released' = 'y',
  'popularity(all_time)' = 'v',
  'popularity(monthly)' = 'vm',
}

export enum MangaSeeGenres {
  'Action',
  'Adult',
  'Adventure',
  'Comedy',
  'Doujinshi',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Gender Bender',
  'Harem',
  'Hentai',
  'Historical',
  'Horror',
  'Isekai',
  'Josei',
  'Lolicon',
  'Martial Arts',
  'Mature',
  'Mecha',
  'Mystery',
  'Psychological',
  'Romance',
  'School Life',
  'Sci-fi',
  'Seinen',
  'Seinen Supernatural',
  'Shotacon',
  'Shoujo',
  'Shoujo Ai',
  'Shounen',
  'Shounen Ai',
  'Slice of Life',
  'Smut',
  'Sports',
  'Supernatural',
  'Tragedy',
  'Yaoi',
  'Yuri',
}

export type MangaGenreFilters<T> = T extends Mangakakalot | Manganato ? BaseMangaGenreOptions<T> : never;

export interface BaseMangaGenreOptions<T> {
  age?: MangaAge;
  status?: MangaStatus<T>;
  page?: number;
}

export type MangaStatus<T> = T extends Mangakakalot | Mangahasu | Manganato | MangaPark
  ? 'ongoing' | 'completed' | 'any'
  : T extends MangaSee
  ? 'any' | 'cancelled' | 'complete' | 'discontinued' | 'paused' | 'ongoing'
  : never;

export type MangaType<T> = T extends MangaSee
  ? 'any' | 'doujinshi' | 'manga' | 'manhua' | 'manhwa'
  : T extends Mangahasu
  ? keyof typeof MangahasuTypes
  : T extends MangaPark
  ? 'manhua' | 'manga' | 'manhwa'
  : never;

export type MangaAge = 'new' | 'updated';

export enum MangaParkGenres {
  '4 koma' = '4-koma',
  'Action' = 'action',
  'Adaptation' = 'adaptation',
  'Adult' = 'adult',
  'Adventure' = 'adventure',
  'Aliens' = 'aliens',
  'Animals' = 'animals',
  'Anthology' = 'anthology',
  'Award winning' = 'award-winning',
  'Comedy' = 'comedy',
  'Cooking' = 'cooking',
  'Crime' = 'crime',
  'Crossdressing' = 'crossdressing',
  'Delinquents' = 'delinquents',
  'Demons' = 'demons',
  'Doujinshi' = 'doujinshi',
  'Drama' = 'drama',
  'Ecchi' = 'ecchi',
  'Fan colored' = 'fan-colored',
  'Fantasy' = 'fantasy',
  'Food' = 'food',
  'Full color' = 'full-color',
  'Game' = 'game',
  'Gender bender' = 'gender-bender',
  'Genderswap' = 'genderswap',
  'Ghosts' = 'ghosts',
  'Gore' = 'gore',
  'Gossip' = 'gossip',
  'Gyaru' = 'gyaru',
  'Harem' = 'harem',
  'Historical' = 'historical',
  'Horror' = 'horror',
  'Incest' = 'incest',
  'Isekai' = 'isekai',
  'Josei' = 'josei',
  'Kids' = 'kids',
  'Loli' = 'loli',
  'Lolicon' = 'lolicon',
  'Long strip' = 'long-strip',
  'Mafia' = 'mafia',
  'Magic' = 'magic',
  'Magical girls' = 'magical-girls',
  'Manhwa' = 'manhwa',
  'Martial arts' = 'martial-arts',
  'Mature' = 'mature',
  'Mecha' = 'mecha',
  'Medical' = 'medical',
  'Military' = 'military',
  'Monster girls' = 'monster-girls',
  'Monsters' = 'monsters',
  'Music' = 'music',
  'Mystery' = 'mystery',
  'Ninja' = 'ninja',
  'Office workers' = 'office-workers',
  'Official colored' = 'official-colored',
  'One shot' = 'one-shot',
  'Parody' = 'parody',
  'Philosophical' = 'philosophical',
  'Police' = 'police',
  'Post apocalyptic' = 'post-apocalyptic',
  'Psychological' = 'psychological',
  'Reincarnation' = 'reincarnation',
  'Reverse harem' = 'reverse-harem',
  'Romance' = 'romance',
  'Samurai' = 'samurai',
  'School life' = 'school-life',
  'Sci fi' = 'sci-fi',
  'Seinen' = 'seinen',
  'Shota' = 'shota',
  'Shotacon' = 'shotacon',
  'Shoujo' = 'shoujo',
  'Shoujo ai' = 'shoujo-ai',
  'Shounen' = 'shounen',
  'Shounen ai' = 'shounen-ai',
  'Slice of life' = 'slice-of-life',
  'Smut' = 'smut',
  'Space' = 'space',
  'Sports' = 'sports',
  'Super power' = 'super-power',
  'Superhero' = 'superhero',
  'Supernatural' = 'supernatural',
  'Survival' = 'survival',
  'Suspense' = 'suspense',
  'Thriller' = 'thriller',
  'Time travel' = 'time-travel',
  'Toomics' = 'toomics',
  'Traditional games' = 'traditional-games',
  'Tragedy' = 'tragedy',
  'User created' = 'user-created',
  'Vampire' = 'vampire',
  'Vampires' = 'vampires',
  'Video games' = 'video-games',
  'Villainess' = 'villainess',
  'Virtual reality' = 'virtual-reality',
  'Web comic' = 'web-comic',
  'Webtoon' = 'webtoon',
  'Wuxia' = 'wuxia',
  'Yaoi' = 'yaoi',
  'Yuri' = 'yuri',
  'Zombies' = 'zombies',
}

export enum MangahasuTypes {
  'any' = '',
  'manga' = '10',
  'manhwa' = '12',
  'manhua' = '19',
}

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
