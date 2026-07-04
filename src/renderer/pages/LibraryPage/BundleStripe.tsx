import * as messages from "common/butlerd/messages";
import { BundleKey, Profile } from "common/butlerd/messages";
import { urlForBundle } from "common/util/navigation";
import React from "react";
import TimeAgo from "renderer/basics/TimeAgo";
import { withProfile } from "renderer/hocs/withProfile";
import { makeGameStripe } from "renderer/pages/common/GameStripe";
import styled from "renderer/styles";
import { T } from "renderer/t";

const BundleGameStripe = makeGameStripe(messages.FetchBundleGames);

const BundleInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  font-size: ${(props) => props.theme.fontSizes.baseText};
  color: ${(props) => props.theme.ternaryText};
  font-weight: 700;
  margin: 0 0.5em;
`;

const BundleInfoSpacer = styled.div`
  width: 0.4em;
`;

class BundleStripe extends React.PureComponent<Props> {
  override render() {
    const { profile, bundleKey } = this.props;
    const bundle = bundleKey.bundle;
    if (!bundle) {
      return null;
    }
    return (
      <BundleGameStripe
        title={bundle.title}
        href={urlForBundle(bundle.id)}
        params={{ profileId: profile.id, bundleId: bundle.id }}
        renderTitleExtras={this.renderTitleExtras}
        getGame={this.getGame}
      />
    );
  }

  getGame = BundleGameStripe.getGameCallback((bg) => bg.game);

  renderTitleExtras = () => {
    const { bundleKey } = this.props;
    const bundle = bundleKey.bundle;
    return (
      <>
        <BundleInfoSpacer />
        <BundleInfo>
          {T(["bundle.item_count", { itemCount: bundle.gamesCount }])}
        </BundleInfo>
        <BundleInfo>
          {T(["bundle.info.acquired"])}
          <BundleInfoSpacer />
          <TimeAgo date={bundleKey.createdAt} />
        </BundleInfo>
      </>
    );
  };
}

export default withProfile(BundleStripe);

interface Props {
  bundleKey: BundleKey;
  profile: Profile;
}
