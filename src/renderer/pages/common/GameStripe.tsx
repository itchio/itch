import { RequestCreator } from "butlerd";
import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import { Dispatch, LocalizedString } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import { isNetworkError } from "main/net/errors";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import Floater from "renderer/basics/Floater";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook, hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import { Title, TitleBox } from "renderer/pages/PageStyles/games";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isEmpty } from "underscore";
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
  renderTitleExtras?: () => JSX.Element;
  getGame: (item: Item) => Game;

  dispatch: Dispatch;
  tab: string;

  sequence: number;
  linkId?: string; // useful for integration tests
}

const stripeLimit = 12;

export function makeGameStripe<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  const Call = butlerCaller(rc);
  type Item = Res["items"][0];

  const hasItems = (result: Res): boolean => {
    if (!result) {
      return false;
    }
    return !isEmpty(result.items);
  };

  type Props = GenericProps<Params, Item>;

  class Stripe extends React.PureComponent<Props> {
    render() {
      const { params, sequence } = this.props;

      return (
        <Call
          params={{ ...(params as any), limit: stripeLimit }}
          sequence={sequence}
          loadingHandled
          errorsHandled
          render={this.renderCallContents}
        />
      );
    }

    renderCallContents = Call.renderCallback(({ result, error, loading }) => (
      <>
        {this.renderTitle(loading, result, error)}
        <StripeDiv>
          {loading ? (
            <FloaterContainer>
              <Floater />
            </FloaterContainer>
          ) : null}
          {this.renderViewAll()}
          {this.renderItems(result)}
          {this.renderEmpty()}
        </StripeDiv>
      </>
    ));

    renderTitle(loading: boolean, result: Res, error: any): JSX.Element {
      const {
        linkId,
        href,
        title,
        renderTitleExtras = renderNoop,
      } = this.props;
      return (
        <>
          <TitleBox>
            <Title>
              <a id={linkId} href={href}>
                {T(title)}
              </a>
              {renderTitleExtras()}
            </Title>
          </TitleBox>
          {this.renderError(result, error)}
        </>
      );
    }

    renderError(result: Res, error: Error) {
      if (!error) {
        return null;
      }

      if (hasItems(result) && isNetworkError(error)) {
        return null;
      }
      return <ErrorState error={error} />;
    }

    renderItems(result: Res): JSX.Element {
      if (!result) {
        return null;
      }

      if (isEmpty(result.items)) {
        return null;
      }

      const doneSet = new Set<number>();
      const { getGame } = this.props;
      return (
        <>
          {result.items.map((item) => {
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
              />
            );
          })}
        </>
      );
    }

    renderEmpty(): JSX.Element {
      const { dispatch } = this.props;
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((id) => (
            <StripeItem key={`empty-${id}`} />
          ))}
        </>
      );
    }

    renderViewAll(): JSX.Element {
      return (
        <ViewAll href={this.props.href}>{T(["game_stripe.view_all"])}</ViewAll>
      );
    }
  }
  let result = withTab(
    hookWithProps(Stripe)((map) => ({
      sequence: map((rs, props) => ambientTab(rs, props).sequence),
    }))(Stripe)
  );
  type ResultType = typeof result;
  function identity<T>(t: T) {
    return t;
  }
  let augmentedResult: ResultType & {
    getGameCallback?(f: (item: Item) => Game): (item: Item) => Game;
  } = result;
  augmentedResult.getGameCallback = identity;
  return augmentedResult;
}

export function makeStripeCallbacks<Params, Res extends FetchRes<any>>(
  rc: RequestCreator<Params, Res>
) {
  type Item = Res["items"][0];

  return {
    getGame(f: (item: Item) => Game) {
      return f;
    },
  };
}

function renderNoop(): JSX.Element {
  return null;
}

class StripeItem extends React.PureComponent<
  {
    game?: Game;
  } & React.HTMLAttributes<HTMLDivElement>
> {
  render() {
    const { game, ...restProps } = this.props;
    return (
      <StripeItemDiv {...restProps}>
        <StandardGameCover game={game} showInfo />
      </StripeItemDiv>
    );
  }
}
