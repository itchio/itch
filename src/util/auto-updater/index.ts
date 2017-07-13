import { platform } from "../../os";
import { AutoUpdaterStart } from "./types";

const exported: AutoUpdaterStart = require(`./${platform()}`).default;
export default exported;
