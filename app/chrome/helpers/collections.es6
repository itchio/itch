
/**
 * Generator that returns a tuple of [key, value] for objects
 */
export function* entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

