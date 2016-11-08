
import os from "../os";

export default require(`./${os.platform()}`).default;
