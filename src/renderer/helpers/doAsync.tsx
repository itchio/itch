export function doAsync(f: () => Promise<void>) {
  f().catch((e) => {
    console.error(e.stack);
  });
}
