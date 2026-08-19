const originalItchio = "https://itch.io";
// NODE_ENV is baked in at bundle time, so production builds can never be
// repointed at another origin
const itchio =
  (process.env.NODE_ENV === "development" && process.env.WHEN_IN_ROME) ||
  originalItchio;
const manual = "https://itch.io/docs/itch";
const itchRepo = "https://github.com/itchio/itch";
const butlerRepo = "https://github.com/itchio/butler";
const itchSetupRepo = "https://github.com/itchio/itch-setup";

export const ITCH_URL_RE = /^itch:/i;

/**
 * True if the URL is on itch.io or a subdomain, over https. When
 * WHEN_IN_ROME repoints the base origin, its scheme and host are
 * matched instead.
 */
export function isItchioOrigin(url: string): boolean {
  try {
    const parsed = new URL(url);
    const base = new URL(itchio);
    return (
      parsed.protocol === base.protocol &&
      parsed.port === base.port &&
      (parsed.hostname === base.hostname ||
        parsed.hostname.endsWith(`.${base.hostname}`))
    );
  } catch {
    return false;
  }
}

export default {
  itchRepo,
  butlerRepo,
  itchSetupRepo,
  originalItchio,
  itchio,
  appHomepage: "https://itch.io/app",
  itchTranslationPlatform: "https://weblate.itch.zone",
  brothRepo: "https://broth.itch.zone",
  manual,

  termsOfService: `${itchio}/docs/legal/terms`,
  twoFactorHelp: `${itchio}/docs/advanced/two-factor-authentication`,
  accountRegister: `${itchio}/register`,
  accountForgotPassword: `${itchio}/user/forgot-password`,
  dashboard: `${itchio}/dashboard`,
  myCollections: `${itchio}/my-collections`,
  sandboxDocs: `${manual}/using/sandbox.html`,
  proxyDocs: `${manual}/using/proxy.html`,
  releasesPage: `${itchRepo}/releases`,
  butlerReleasesPage: `${butlerRepo}/releases`,
  itchSetupReleasesPage: `${itchSetupRepo}/releases`,
  installingOnLinux: `${manual}/installing/linux/`,
  windowsAntivirus: `${manual}/installing/windows.html#antivirus-software`,
};
