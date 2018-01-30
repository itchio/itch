import * as React from "react";
import { createStructuredSelector } from "reselect";
import { connect } from "./connect";

import GatePage from "./pages/gate";
import HubPage from "./pages/hub";
import StatusBar from "./status-bar";
import NonLocalIndicator from "./non-local-indicator";
import ContextMenuHandler from "./context-menu-handler";
import ReactHintFactory = require("react-hint");
const ReactHint = ReactHintFactory(React);

import { IRootState } from "../types";

import styled from "./styles";
import { formatString } from "./format";
import { injectIntl, InjectedIntl } from "react-intl";
import { DATE_FORMAT } from "../format/index";
import { formatDate } from "../format/datetime";
import { fromDateTimeField } from "../db/datetime-field";

const LayoutContainer = styled.div`
  background: ${props => props.theme.baseBackground};
  color: ${props => props.theme.baseText};
  font-size: ${props => props.theme.fontSizes.baseText};

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2px;

  &,
  input {
    font-family: LatoWeb, sans-serif;
  }
`;

const ReactHintContainer = styled.div`
  pointer-events: none;

  .react-hint__content {
    padding: 5px;
    border-radius: 2px;
    background: ${props => props.theme.tooltipBackground};
    color: ${props => props.theme.tooltipText};
    font-size: 90%;
  }

  .react-hint--top:after {
    border-top-color: ${props => props.theme.tooltipBackground};
  }

  .react-hint--left:after {
    border-left-color: ${props => props.theme.tooltipBackground};
  }

  .react-hint--right:after {
    border-right-color: ${props => props.theme.tooltipBackground};
  }

  .react-hint--bottom:after {
    border-bottom-color: ${props => props.theme.tooltipBackground};
  }
`;

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl } = this.props;

    return (
      <LayoutContainer>
        {this.main()}
        <StatusBar />
        <ReactHintContainer>
          <ReactHint
            events
            onRenderContent={(target, content) => {
              let { rh } = target.dataset;
              if (!rh) {
                return null;
              }

              const firstChar = rh[0];
              if (firstChar === "[" || firstChar === "{" || firstChar === `"`) {
                try {
                  const obj = JSON.parse(rh);
                  if (Array.isArray(obj)) {
                    rh = formatString(intl, obj);
                  } else if (obj.hasOwnProperty("date")) {
                    rh = formatDate(
                      fromDateTimeField(obj.date),
                      intl.locale,
                      DATE_FORMAT
                    );
                  } else {
                    rh = obj;
                  }
                } catch (e) {
                  // muffin
                }
              }
              if (!rh) {
                return null;
              }

              return <div className="react-hint__content">{rh}</div>;
            }}
          />
        </ReactHintContainer>
        <NonLocalIndicator />
        <ContextMenuHandler />
      </LayoutContainer>
    );
  }

  main() {
    const { page } = this.props;

    switch (page) {
      case "gate":
        return <GatePage />;
      case "hub":
        return <HubPage />;
      default:
        return <div>Unknown page: {page}</div>;
    }
  }
}

interface IProps {}

interface IDerivedProps {
  page: string;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(Layout), {
  state: createStructuredSelector({
    page: (rs: IRootState) => rs.session.navigation.page,
  }),
});
