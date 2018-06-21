import React from "react";
import { IRequestCreator } from "butlerd";
import { Game } from "common/butlerd/messages";
import butlerCaller from "renderer/hocs/butlerCaller";
import { LocalizedString } from "common/types";
import {
  Title,
  TitleSpacer,
  StandardGameCover,
  TitleBox,
} from "renderer/pages/PageStyles/games";
import ErrorState from "renderer/basics/ErrorState";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { T } from "renderer/t";
import { isEmpty } from "underscore";
import styled, * as styles from "renderer/styles";

const StripeDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  overflow-x: hidden;

  padding: 1em 0;
`;

const StripeItem = styled.div`
  ${styles.boxy()};
  flex-shrink: 0;
  margin-right: 1em;
`;

interface Props<Params, Res> {
  title: LocalizedString;
  href: string;
  params: Params;
  sequence?: number;
  map: (r: Res) => Game[];
}

interface FetchRes {
  items?: any[];
}

const stripeLimit = 12;

export default <Params, Res extends FetchRes>(
  rc: IRequestCreator<Params, Res>
) => {
  const Call = butlerCaller(rc);

  return class extends React.PureComponent<Props<Params, Res>> {
    render() {
      const { params, sequence } = this.props;

      return (
        <Call
          params={{ ...(params as any), limit: stripeLimit }}
          sequence={sequence}
          loadingHandled
          errorsHandled
          render={({ result, error, loading }) => (
            <>
              {this.renderTitle(loading, error)}
              {this.renderItems(result)}
            </>
          )}
        />
      );
    }

    renderTitle(loading: boolean, error: any): JSX.Element {
      const { href, title } = this.props;
      return (
        <>
          <TitleBox>
            <Title>
              <a href={href}>{T(title)}</a>
              {loading ? (
                <>
                  <TitleSpacer />
                  <LoadingCircle progress={-1} />
                </>
              ) : null}
            </Title>
          </TitleBox>
          {error ? (
            <>
              <ErrorState error={error} />
            </>
          ) : null}
        </>
      );
    }

    renderItems(result: Res): JSX.Element {
      if (!result) {
        return null;
      }

      if (isEmpty(result.items)) {
        return null;
      }

      const games = this.props.map(result);
      return (
        <StripeDiv>
          {games.map(game => (
            <StripeItem key={game.id}>
              <StandardGameCover game={game} />
            </StripeItem>
          ))}
        </StripeDiv>
      );
    }
  };
};
