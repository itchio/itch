type WindowExt = Window & {
  $RefreshReg$: () => void;
  $RefreshSig$: (typ: any) => any;
};

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const runtime = require("react-refresh/runtime");
  runtime.injectIntoGlobalHook(window);
  let winExt = (window as any) as WindowExt;
  winExt.$RefreshReg$ = () => {};
  winExt.$RefreshSig$ = () => (typ: any) => typ;
}

require(".");

// appease --isolatedModules
export default "IAMA entrypoint AMA";
