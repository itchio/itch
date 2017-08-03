let rng: () => Uint8Array;

// tslint:disable:no-bitwise

if (process.type === "browser") {
  const crypto = require("crypto");
  rng = () => crypto.randomBytes(16);
} else {
  rng = () => {
    const rnds8 = new Uint8Array(16);
    window.crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

export default function v4() {
  const rnds = rng();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  return bytesToUuid(rnds);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
const bth = [];
for (let i = 0; i < 256; ++i) {
  bth[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf) {
  let i = 0;
  return (
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    "-" +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]] +
    bth[buf[i++]]
  );
}
