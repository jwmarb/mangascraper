import { MangaCallback } from '..';

export default function success<T>(
  result: T,
  callback: MangaCallback<T>,
  resolve: (value: T | PromiseLike<T>) => void,
): void {
  callback(undefined, result);
  resolve(result);
}
