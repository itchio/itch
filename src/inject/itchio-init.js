
let readOnly = false;
try {
  require("fs").statSync(".cache")
  readOnly = true;
} catch (e) {}

require("electron-compile/lib/initialize-renderer").initializeRendererProcess(readOnly);
require("./itchio");
