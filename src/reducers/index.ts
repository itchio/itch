
import {combineReducers} from "redux";

import history from "./history";
import modals from "./modals";
import system from "./system";
import setup from "./setup";
import rememberedSessions from "./remembered-sessions";
import session from "./session";
import i18n from "./i18n";
import ui from "./ui";
import selfUpdate from "./self-update";
import preferences from "./preferences";
import tasks from "./tasks";
import downloads from "./downloads";
import status from "./status";
import gameUpdates from "./game-updates";
import queries from "./queries";
import commons from "./commons";

const reducer = combineReducers({
  history,
  modals,
  system,
  setup,
  rememberedSessions,
  session,
  i18n,
  ui,
  selfUpdate,
  preferences,
  tasks,
  downloads,
  status,
  gameUpdates,
  queries,
  commons,
});
export default reducer;
