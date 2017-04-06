
// when preparing a new release, this file is replaced
// with a 'production' one. in test, 'name' is overwritten
// to be test.
const self = {
  name: process.env.WEBPACK_NODE_ENV || "development",
  channel: "canary",
};

export = self;
