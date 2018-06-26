import { describe, it, assert } from "test";

import { t } from "./t";

describe("t", () => {
  it("formats a french string", () => {
    const i18n = {
      lang: "fr",
      strings: {
        fr: {
          "hello.there": "Bonjour, {name}",
        },
      },
      queued: null as any,
      downloading: null as any,
      locales: null as any,
    };
    assert.equal(t(i18n, ["hello.there", { name: "Brock" }]), "Bonjour, Brock");
  });
  it("falls back to english", () => {
    const i18n = {
      lang: "fr",
      strings: {
        en: {
          "hello.there": "Hi, {name}",
        },
      },
      queued: null as any,
      downloading: null as any,
      locales: null as any,
    };
    assert.equal(t(i18n, ["hello.there", { name: "Brock" }]), "Hi, Brock");
  });
  it("falls back to defaultValue", () => {
    const i18n = {
      lang: "en",
      strings: {
        en: {},
      },
      queued: null as any,
      downloading: null as any,
      locales: null as any,
    };
    assert.equal(
      t(i18n, ["hello.there", { name: "Brock", defaultValue: "Bye brock" }]),
      "Bye brock"
    );
  });
});
