// maybe do this through the bridge eventually?
const rng = () => {
  const rnds8 = new Uint8Array(16);
  window.crypto.getRandomValues(rnds8);
  return rnds8;
};
export default rng;
