import { writeFileSync } from "fs";
import { join } from "path";
import { get } from "https";
import { SteamGameInfo } from "./index";

export async function downloadImage(
  url: string,
  filePath: string
): Promise<void> {
  if (!url) return;

  return new Promise((resolve) => {
    get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          writeFileSync(filePath, Buffer.concat(chunks));
          resolve();
        });
      } else {
        resolve();
      }
    }).on("error", () => resolve());
  });
}

export async function setupSteamImages(
  configDir: string,
  appId: string,
  shortAppId: string,
  gameInfo: SteamGameInfo
): Promise<string> {
  const gridDir = join(configDir, "grid");

  if (!require("fs").existsSync(gridDir)) {
    require("fs").mkdirSync(gridDir, { recursive: true });
  }

  // Use otherGridAppID (shortAppId) for image files like the working implementation
  const imageId = shortAppId;

  // Get file extension from URL
  const getExt = (url: string) => {
    const match = url.match(/\.(png|jpg|jpeg)/);
    return match ? match[0] : ".jpg";
  };

  const coverExt = getExt(gameInfo.art_cover || "");
  const iconExt = getExt(gameInfo.art_square || gameInfo.art_cover || "");

  // Steam image formats
  const iconPath = join(gridDir, `${imageId}_icon${iconExt}`);
  const images = [
    { url: gameInfo.art_cover, path: join(gridDir, `${imageId}p.jpg`) }, // Portrait (coverArt)
    { url: gameInfo.art_cover, path: join(gridDir, `${imageId}.jpg`) }, // Header (headerArt)
    {
      url: gameInfo.art_cover,
      path: join(gridDir, `${imageId}_hero.jpg`),
    }, // Background (backGroundArt)
    { url: gameInfo.art_square || gameInfo.art_cover, path: iconPath }, // Icon
  ];

  console.log(`Creating Steam images for shortcut ID ${imageId}:`);
  for (const image of images) {
    if (image.url) {
      console.log(`  ${image.path}`);
      await downloadImage(image.url, image.path);
    }
  }
  console.log(
    `Steam should look for background image at: ${join(
      gridDir,
      `${imageId}_hero.jpg`
    )}`
  );

  return iconPath;
}
