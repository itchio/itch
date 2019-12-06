export const envSettings = {
  // booleans
  verboseWebSocket: process.env.ITCH_VERBOSE_WS === "1",
  devtools: process.env.DEVTOOLS === "1",
  integrationTests: process.env.ITCH_INTEGRATION_TESTS === "1",

  // strings
  customItchServer: process.env.WHEN_IN_ROME,
};
