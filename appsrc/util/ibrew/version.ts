
/* A very small, very bad implementation of versioning */

let self = {
  normalize: (v: string): string => {
    if (!v) {
      return v;
    }
    return v.replace(/^v/, "");
  },

  equal: (a: string, b: string) => {
    return self.normalize(a) === self.normalize(b);
  },
};

export default self;
