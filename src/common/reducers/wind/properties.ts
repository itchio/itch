import { WindPropertiesState } from "common/types";
import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

const initialState: WindPropertiesState = {
  initialURL: "",
  role: null,
};

export default reducer<WindPropertiesState>(initialState, (on) => {
  on(actions.windOpened, (state, action) => {
    const { initialURL, role } = action.payload;
    return { initialURL, role };
  });
});
