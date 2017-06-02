
require("electron-compile/lib/initialize-renderer").initializeRendererProcess(
  require("electron").remote.getGlobal("globalCompilerHost").readOnlyMode
);
