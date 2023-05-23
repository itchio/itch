const crypto = require("crypto");
const rng = () => crypto.randomBytes(16);
export default rng;
