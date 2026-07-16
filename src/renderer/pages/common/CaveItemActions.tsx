import React from "react";
import { Cave } from "common/butlerd/messages";
import { actions } from "common/actions";
import { Dispatch } from "common/types";
import IconButton from "renderer/basics/IconButton";
import { hook } from "renderer/hocs/hook";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import styled from "renderer/styles";
import { _ } from "renderer/t";

const Spacer = styled.div`
  width: 12px;
  flex-shrink: 0;
`;

class CaveItemActions extends React.PureComponent<Props> {
  override render() {
    const { cave } = this.props;
    return (
      <>
        <IconButton
          className="manage-cave"
          big
          emphasized
          icon="cog"
          hint={_("grid.item.manage")}
          onClick={this.onManage}
        />
        <Spacer />
        <StandardMainAction game={cave.game} caveId={cave.id} />
      </>
    );
  }

  onManage = () => {
    const { dispatch, cave } = this.props;
    dispatch(actions.manageCave({ caveId: cave.id }));
  };
}

interface Props {
  cave: Cave;

  dispatch: Dispatch;
}

export default hook()(CaveItemActions);
