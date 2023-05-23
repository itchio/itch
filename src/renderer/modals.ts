import { prepModals } from "common/modals";
import uuid from "common/util/uuid";
import rng from "renderer/util/rng";

const modals = prepModals(() => uuid(rng));
export default modals;
