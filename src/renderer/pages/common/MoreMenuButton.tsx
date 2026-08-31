import { actions } from "common/actions";
import { MenuTemplate } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import { useAppDispatch } from "renderer/hooks/redux";
import { _ } from "renderer/t";

const MoreMenuButton = ({ template }: { template: MenuTemplate }) => {
  const dispatch = useAppDispatch();

  const onMore = (ev: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY } = ev;
    dispatch(
      actions.popupContextMenu({
        wind: ambientWind(),
        clientX,
        clientY,
        template,
      })
    );
  };

  return (
    <IconButton
      icon="more_vert"
      hint={_("browser.more_menu")}
      hintPosition="left"
      onClick={onMore}
    />
  );
};

export default MoreMenuButton;
