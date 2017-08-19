// top-notch module organization follows
module.exports = Object.assign(
  {},
  require("./deb.js"),
  require("./portable.js"),
  require("./rpm.js")
);
