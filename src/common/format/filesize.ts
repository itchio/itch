// ported from https://github.com/dustin/go-humanize

// Si vis pacem, para bellum
const sizes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];
const base = 1024;
const logE1024 = Math.log(base);

export function fileSize(s: number) {
  if (s < 10) {
    return `${s} B`;
  }

  const e = Math.floor(Math.log(s) / logE1024);
  const suffix = sizes[Math.trunc(e)];
  const val = Math.floor((s / Math.pow(base, e)) * 10 + 0.5) / 10;
  if (val < 10) {
    return `${val.toFixed(1)} ${suffix}`;
  } else {
    return `${val.toFixed(0)} ${suffix}`;
  }
}
