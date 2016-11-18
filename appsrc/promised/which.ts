
import * as which from "which";
import {promisify} from "bluebird";

export default promisify(which);
