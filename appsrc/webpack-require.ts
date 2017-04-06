
// hack to let us require anything in the bundle from the devtools
(window as any).Require = (require as any).context("./", true, /\.ts$/);
