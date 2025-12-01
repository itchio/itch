const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs-extra");
const childProcess = require("child_process");

const production = process.argv.includes("--production");
const start = process.argv.includes("--start");

const outDir = path.resolve(__dirname, "../dist");
const mainOutDir = path.join(outDir, "main");
const rendererOutDir = path.join(outDir, "renderer");

async function build() {
  console.log(`Building for ${production ? "production" : "development"}...`);

  // Clean output directory
  await fs.emptyDir(outDir);

  // Main process build
  console.log("Building main process...");
  await esbuild.build({
    entryPoints: [
      "src/main/index.ts",
      "src/main/inject/inject-game.ts",
      "src/main/inject/inject-captcha.ts",
      "src/main/inject/inject-preload.ts",
    ],
    bundle: true,
    platform: "node",
    target: "node14", // Electron 12 uses Node 14
    outdir: mainOutDir,
    external: ["electron", "systeminformation", "fsevents", "react-hot-loader", "original-fs"], // Dependencies that shouldn't be bundled
    sourcemap: !production,
    minify: production,
    define: {
      "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
    },
    logLevel: "info",
  });

  // Renderer process build
  console.log("Building renderer process...");
  await esbuild.build({
    entryPoints: ["src/renderer/index.tsx"],
    bundle: true,
    platform: "browser",
    target: "es2017",
    outfile: path.join(rendererOutDir, "renderer.bundle.js"),
    sourcemap: !production,
    minify: production,
    external: ["electron", "fs", "path", "systeminformation"], // Electron modules accessed via preload or specific internals
    loader: {
      ".png": "file",
      ".svg": "file",
      ".woff": "file",
      ".woff2": "file",
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
      "global": "window", // Polyfill global for browser
    },
    alias: {
      "querystring": "querystring-es3",
      "url": "url",
      "events": "events",
      "stream": "stream-browserify",
      "zlib": "browserify-zlib",
      "buffer": "buffer",
    },
    inject: [path.resolve(__dirname, "shim.js")], // Polyfill Buffer
    logLevel: "info",
  });

  // Generate HTML
  console.log("Generating HTML...");
  const ejsContent = await fs.readFile(path.resolve(__dirname, "../src/index.ejs"), "utf8");

  // Simple EJS replacement for the specific tag we know exists
  let htmlContent = ejsContent;
  if (production) {
    htmlContent = htmlContent.replace(
      '<% if (process.env.NODE_ENV === "production") { %>',
      ""
    ).replace(
      '<% } %>',
      ""
    );
  } else {
    // Remove the block
     htmlContent = htmlContent.replace(
      /<% if \(process\.env\.NODE_ENV === "production"\) \{ %>[\s\S]*?<% \} %>/g,
      ""
    );
  }

  // Inject script tag and css link
  htmlContent = htmlContent.replace(
    "</head>",
    '<link rel="stylesheet" href="renderer.bundle.css"></head>'
  );
  htmlContent = htmlContent.replace(
    "</body>",
    '<script src="renderer.bundle.js"></script></body>'
  );

  await fs.ensureDir(rendererOutDir);
  await fs.writeFile(path.join(rendererOutDir, "index.html"), htmlContent);

  console.log("Build complete!");

  if (start) {
    startApp();
  }
}

function startApp() {
  const electronBinaryPath = require("electron");
  console.log(`Starting app with ${electronBinaryPath}`);

  const proc = childProcess.spawn(electronBinaryPath, [".", "--inspect=9222", "--color"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: production ? "production" : "development",
    },
  });

  proc.on("close", (code) => {
    console.log(`App exited with code ${code}`);
    process.exit(code);
  });
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
