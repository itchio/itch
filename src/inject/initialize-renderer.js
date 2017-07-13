
require("electron-compile-ftl/lib/initialize-renderer").initializeRendererProcess(
  require("electron").remote.getGlobal("globalCompilerHost").readOnlyMode
);
