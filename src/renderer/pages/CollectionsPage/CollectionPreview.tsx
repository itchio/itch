import * as messages from "common/butlerd/messages";
import { Collection } from "common/butlerd/messages";
import { urlForCollection } from "common/util/navigation";
import React from "react";
import TimeAgo from "renderer/basics/TimeAgo";
import { useProfile } from "renderer/hooks/useProfile";
import { makeGameStripe } from "renderer/pages/common/GameStripe";
import styled from "renderer/styles";
import { T } from "renderer/t";

const CollectionGameStripe = makeGameStripe(messages.FetchCollectionGames);

const CollectionInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  font-size: ${(props) => props.theme.fontSizes.baseText};
  color: ${(props) => props.theme.ternaryText};
  font-weight: 700;
  margin: 0 0.5em;
`;

const CollectionInfoSpacer = styled.div`
  width: 0.4em;
`;

const getGame = CollectionGameStripe.getGameCallback((cg) => cg.game);

interface Props {
  coll: Collection;
}

const CollectionPreview = ({ coll }: Props) => {
  const profile = useProfile();

  return (
    <CollectionGameStripe
      title={coll.title}
      href={urlForCollection(coll.id)}
      params={{ profileId: profile.id, collectionId: coll.id }}
      renderTitleExtras={() => (
        <>
          <CollectionInfoSpacer />
          <CollectionInfo>
            {T(["collection.item_count", { itemCount: coll.gamesCount }])}
          </CollectionInfo>
          <CollectionInfo>
            {T(["collection.info.updated"])}
            <CollectionInfoSpacer />
            <TimeAgo date={coll.updatedAt} />
          </CollectionInfo>
        </>
      )}
      getGame={getGame}
    />
  );
};

export default React.memo(CollectionPreview);
