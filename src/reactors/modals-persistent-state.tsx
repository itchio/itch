import { ModalResponse } from "../types/index";

// this is a separate module so it doesn't get reloaded when doing HMR
// otherwise cancelling dialogs after code has reloaded doesn't work properly.

interface IModalResolveMap {
  [modalId: string]: (response: ModalResponse) => void;
}
const modalResolves: IModalResolveMap = {};
export default modalResolves;
