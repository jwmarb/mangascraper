import { MangaCallback } from '../';

export default function failure<T>(err: Error, callback?: MangaCallback<T>) {
  if (callback) return callback(err);
  throw err;
}
