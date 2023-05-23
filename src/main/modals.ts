import { prepModals } from "common/modals";
import uuid from "common/util/uuid";
import rng from "main/util/rng";

const modals = prepModals(() => uuid(rng));
export default modals;
