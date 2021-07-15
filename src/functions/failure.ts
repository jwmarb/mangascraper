import { MangaCallback } from '..';

export default function failure<T>(err: string, callback: MangaCallback<T>): void {
  if (callback) return callback(Error(err));
  throw Error(err);
}
