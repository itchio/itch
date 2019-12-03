export type Deferred<T, E> = {
  resolve: (t: T) => void;
  reject: (e: E) => void;
};
