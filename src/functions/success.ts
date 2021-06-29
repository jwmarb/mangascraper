import { CallbackFunc } from '../';

export default function success<T>(result: T, callback: CallbackFunc<T>, resolve: (value: T | PromiseLike<T>) => void) {
  callback(undefined, result);
  resolve(result);
}
