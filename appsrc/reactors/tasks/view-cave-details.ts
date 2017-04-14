
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {getGlobalMarket} from "../market";

import {ICaveRecord} from "../../types";
import {IViewCaveDetailsParams} from "../../components/modal-widgets/view-cave-details";

export default function (watcher: Watcher) {
  watcher.on(actions.viewCaveDetails, async (store, action) => {
    const {caveId} = action.payload;

    const globalMarket = getGlobalMarket();
    const cave = globalMarket.getEntity<ICaveRecord>("caves", caveId);
    if (!cave) {
      return;
    }

    store.dispatch(actions.openModal({
      title: `Cave details for ${cave.game.title}`,
      message: "",
      widget: "view-cave-details",
      widgetParams: {
        currentCave: cave,
      } as IViewCaveDetailsParams,
      buttons: [
        {
          label: ["prompt.action.ok"],
          action: actions.closeModal({}),
        },
        {
          label: "Nuke prereqs",
          action: actions.nukeCavePrereqs({caveId: cave.id}),
          className: "secondary",
        },
        {
          label: "Re-configure",
          action: actions.configureCave({caveId: cave.id}),
          className: "secondary",
        },
      ],
    }));
  });
}
