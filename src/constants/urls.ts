const originalItchio = "https://itch.io";
const itchio = process.env.WHEN_IN_ROME || originalItchio;
const manual = "https://itch.io/docs/itch";
const itchRepo = "https://github.com/itchio/itch";

interface IUpdateServers {
  [key: string]: string;
  stable: string;
  canary: string;
}

export default {
  itchRepo,
  watchlistRepo: "https://github.com/itchio/itch-compatibility-watchlist",
  originalItchio,
  itchio,
  appHomepage: "https://itch.io/app",
  itchTranslationPlatform: "https://weblate.itch.ovh/",
  githubApi: "https://api.github.com",
  ibrewRepo: "https://dl.itch.ovh",
  remoteLocalePath: "https://locales.itch.ovh/itch",
  manual,
  updateServers: {
    stable: "https://nuts.itch.zone",
    canary: "https://nuts-canary.itch.ovh",
  } as IUpdateServers,
  javaDownload: "https://www.java.com/en/download",

  itchioApi: itchio,
  termsOfService: `${itchio}/docs/legal/terms`,
  twoFactorHelp: `${itchio}/docs/advanced/two-factor-authentication`,
  accountRegister: `${itchio}/register`,
  accountForgotPassword: `${itchio}/user/forgot-password`,
  developersLearnMore: `${itchio}/developers`,
  dashboard: `${itchio}/dashboard`,
  myCollections: `${itchio}/my-collections`,
  rarPolicy: `${itchio}/t/11918/rar-support-is-not-happening-repack-your-games`,
  debPolicy: `${itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`,
  rpmPolicy: `${itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`,
  sandboxDocs: `${manual}/using/sandbox.html`,
  proxyDocs: `${manual}/using/proxy.html`,
  linuxSandboxSetup: `${manual}/using/sandbox/linux.html#one-time-setup`,
  windowsSandboxSetup: `${manual}/using/sandbox/windows.html#one-time-setup`,
  releasesPage: `${itchRepo}/releases`,
  installingOnLinux: `${manual}/installing/linux/`,
  redistsBase: `https://dl.itch.ovh/itch-redists`,
};
