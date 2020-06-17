//@ts-check
"use strict";

/**
 * @param {import("@babel/core").ConfigAPI} api
 * @returns {import("@babel/core").TransformOptions}
 */
module.exports = function (api) {
  let isProduction = api.env("production");

  /** @type {import("@babel/core").TransformOptions["presets"]} */
  let presets = [
    "@babel/react",
    "@babel/typescript",
    [
      "@babel/env",
      {
        targets: { electron: "9.0.0" },
      },
    ],
  ];

  /** @type {import("@babel/core").TransformOptions["plugins"]} */
  let plugins = [
    ["@babel/proposal-class-properties"],
    ["@babel/proposal-object-rest-spread"],
    ["@babel/plugin-proposal-optional-chaining"],
    ["@babel/plugin-proposal-nullish-coalescing-operator"],
    ["inline-json-import", {}],
    [
      "module-resolver",
      {
        root: ["./src"],
        alias: {
          common: "./src/common",
          renderer: "./src/renderer",
          main: "./src/main",
          static: "./src/static",
        },
      },
    ],
  ];

  if (isProduction) {
    // production plugins
  } else {
    // development plugins
    plugins.push(["react-refresh/babel"]);
  }

  plugins.push([
    "babel-plugin-styled-components",
    {
      displayName: !isProduction,
      pure: isProduction,
      minify: isProduction,
      transpileTemplateLiterals: isProduction,
    },
  ]);

  return {
    presets,
    plugins,
  };
};
