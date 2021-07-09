import { MangaCallback } from '../';

export default function failure<T>(err: string, callback: MangaCallback<T>) {
  if (callback) return callback(Error(err));
  throw Error(err);
}
