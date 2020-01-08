import _ from "lodash";

interface Dictionary<T> {
  [index: string]: T;
}
interface NumericDictionary<T> {
  [index: number]: T;
}

/**
 * Filter an object by only keeping values for which a predicate returns true
 * @param collection A dictionary, {[key: number | string]: T}
 * @param predicate Returns true when an item should be kept
 */
export function filterObject<T>(
  collection: Dictionary<T> | NumericDictionary<T>,
  predicate: (t: T) => boolean
): Dictionary<T> {
  return _.fromPairs(_.filter(_.toPairs(collection), ([k, v]) => predicate(v)));
}
