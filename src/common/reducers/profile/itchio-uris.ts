import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

const initialState: string[] = [];

export default reducer<string[]>(initialState, (on) => {
  on(actions.pushItchioURI, (state, action) => {
    const { uri } = action.payload;
    return [...state, uri];
  });

  on(actions.clearItchioURIs, (state, action) => {
    return [];
  });
});
