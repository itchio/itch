
// return '.zip', '.exe', etc given any file path. Always lowercase.
export function ext(filename) {
  let matches = filename.toLowerCase().match(/\.[\w]+$/);
  if (matches) {
    return matches[0];
  } else {
    return null;
  }
}

export default {
  ext
};

