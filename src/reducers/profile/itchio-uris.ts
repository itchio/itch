import { actions } from "../../actions";
import reducer from "../reducer";

const initialState = [];

export default reducer<string[]>(initialState, on => {
  on(actions.pushItchioURI, (state, action) => {
    const { uri } = action.payload;
    return [...state, uri];
  });

  on(actions.clearItchioURIs, (state, action) => {
    return [];
  });
});
