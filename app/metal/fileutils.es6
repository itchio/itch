
// return '.zip', '.exe', etc given any file path. Always lowercase.
export function ext(filename) {
  return filename.toLowerCase().match(/\.[\w]+$/);
}

export default {
  ext
};

