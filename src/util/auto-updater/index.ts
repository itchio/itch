
import {platform} from "../../os";

export default require(`./${platform()}`).default;
