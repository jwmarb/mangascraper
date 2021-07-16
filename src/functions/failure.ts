import { MangaCallback } from '..';

export default function failure<T>(err: string, callback: MangaCallback<T>, rej: (reason: Error) => void): void {
  callback(Error(err));
  rej(Error(err));
}
