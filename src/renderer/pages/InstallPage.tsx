import { actions } from "common/actions";
import { ambientTab, urlForGame } from "common/util/navigation";
import { useEffect } from "react";
import { dispatchTabEvolve } from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useTab } from "renderer/hooks/useTab";
import { rendererLogger } from "renderer/logger";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const logger = rendererLogger.child("InstallPage");

const InstallPage = (_props: MeatProps) => {
  const tab = useTab();
  const dispatch = useAppDispatch();
  const location = useAppSelector((rs) => ambientTab(rs, { tab }).location);

  // hands the URL to the install flow once, then turns into the game's tab
  useEffect(() => {
    const url = location?.url;
    if (url) {
      dispatch(actions.handleItchioURI({ uri: url }));
    } else {
      logger.warn("no URL for install page tab, not handling itchio URI");
    }

    const gameId = parseInt(location?.query.game_id ?? "", 10);
    if (Number.isNaN(gameId)) {
      logger.warn(
        "missing or unparseable game_id in install page URL, not navigating"
      );
      return;
    }
    dispatchTabEvolve(
      { tab, dispatch },
      { url: urlForGame(gameId), replace: true }
    );
  }, []);

  return null;
};

export default InstallPage;
