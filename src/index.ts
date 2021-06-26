export interface Manga {
  id: string;
  url: string;
  title: string;
  synopsis: string;
  chapters: number;
}

export class Mangakakalot {
  /**
   * Get a list of manga that match the title
   *
   * @param title - Title of Manga (e.g Black Clover, One Piece, Naruto)
   *
   * @returns List of Manga that match `title`
   */
  public getMangaByTitle(title: string): Manga {
    return { id: '123', url: 'youtube.com', title, synopsis: '', chapters: 10 };
  }
}
