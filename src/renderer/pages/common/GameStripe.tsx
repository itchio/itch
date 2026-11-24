import { RequestCreator } from "@itchio/butlerd";
import { Game } from "common/butlerd/messages";
import { LocalizedString } from "common/types";
import { ambientTab } from "common/util/navigation";
import { isNetworkError } from "main/net/errors";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import Floater from "renderer/basics/Floater";
import { useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useTab } from "renderer/hooks/useTab";
import { Title, TitleBox } from "renderer/pages/PageStyles/games";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import StandardGameCover, {
  standardCoverHeight,
} from "renderer/pages/common/StandardGameCover";

const StripeDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  overflow: hidden;
  position: relative;

  height: ${standardCoverHeight + 2}px;

  padding: 1.2em 0;
  margin-bottom: 32px;
`;

const FloaterContainer = styled.div`
  background: ${(props) => props.theme.breadBackground};
  opacity: 0.7;
  padding: 4px;

  position: absolute;
  left: 5px;
  top: 5px;
  z-index: 20;
`;

const ViewAll = styled.a`
  position: absolute;
  background: ${(props) => props.theme.breadBackground};
  box-shadow: 0 0 30px ${(props) => props.theme.breadBackground};
  padding: 0 4em;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;

  z-index: 4;
`;

const StripeItemDiv = styled.div`
  ${styles.boxy};
  flex-shrink: 0;
  margin-right: 0.8em;
`;

interface FetchRes<Item> {
  items: Item[];
}

interface GenericProps<Params, Item> {
  title: LocalizedString;
  href: string;
  params: Params;
  renderTitleExtras?: () => JSX.Element | null;
  /** items without a game are skipped when rendering */
  getGame: (item: Item) => Game | undefined;
  /** every game in this stripe is owned (e.g. owned-bundle contents) */
  forceOwned?: boolean;

  linkId?: string; // useful for integration tests
}

const stripeLimit = 12;

const placeholders = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface StripeItemProps extends React.HTMLAttributes<HTMLDivElement> {
  game?: Game;
  forceOwned?: boolean;
}

const StripeItem = React.memo(
  ({ game, forceOwned, ...restProps }: StripeItemProps) => (
    <StripeItemDiv {...restProps}>
      <StandardGameCover game={game} showInfo forceOwned={forceOwned} />
    </StripeItemDiv>
  )
);

function identity<T>(t: T) {
  return t;
}

export function makeGameStripe<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  type Item = Res["items"][0];
  type Props = GenericProps<Params, Item>;

  const Stripe = ({
    title,
    href,
    params,
    renderTitleExtras,
    getGame,
    forceOwned,
    linkId,
  }: Props) => {
    const tab = useTab();
    const sequence = useAppSelector((rs) => ambientTab(rs, { tab }).sequence);
    const { loading, error, result } = useButlerd(
      rc,
      { ...(params as any), limit: stripeLimit },
      { sequence }
    );

    const items: Item[] = result?.items ?? [];
    const doneSet = new Set<number>();

    return (
      <>
        <TitleBox>
          <Title>
            <a id={linkId} href={href}>
              {T(title)}
            </a>
            {renderTitleExtras?.()}
          </Title>
        </TitleBox>
        {
          // a network error is not worth showing over cached items
          error && !(items.length > 0 && isNetworkError(error)) ? (
            <ErrorState error={error} />
          ) : null
        }
        <StripeDiv>
          {loading ? (
            <FloaterContainer>
              <Floater />
            </FloaterContainer>
          ) : null}
          <ViewAll href={href}>{T(["game_stripe.view_all"])}</ViewAll>
          {items.map((item) => {
            const game = getGame(item);
            if (!game || doneSet.has(game.id)) {
              return null;
            }
            doneSet.add(game.id);
            return (
              <StripeItem
                key={game.id}
                className="stripe--item"
                data-game-id={game.id}
                game={game}
                forceOwned={forceOwned}
              />
            );
          })}
          {placeholders.map((id) => (
            <StripeItem key={`empty-${id}`} />
          ))}
        </StripeDiv>
      </>
    );
  };

  return Object.assign(React.memo(Stripe), {
    // only here to infer the item type at call sites
    getGameCallback: identity as (
      f: (item: Item) => Game | undefined
    ) => (item: Item) => Game | undefined,
  });
}
