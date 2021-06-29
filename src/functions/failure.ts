import { CallbackFunc } from '../';

export default function failure<T>(err: Error, callback?: CallbackFunc<T>) {
  if (callback) return callback(err);
  throw err;
}
