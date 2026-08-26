import {
  DATE_FORMAT,
  formatDate,
  formatPreciseDurationAsMessage,
} from "common/format/datetime";
import React from "react";
import ReactHintFactory from "react-hint";
import { IntlShape } from "react-intl";
import { injectIntl } from "renderer/hocs/injectIntl";
import styled from "renderer/styles";
import { TString } from "renderer/t";

const ReactHint = ReactHintFactory(React);

const ReactHintContainer = styled.div`
  pointer-events: none;

  .react-hint__content {
    padding: 5px;
    border-radius: 2px;
    background: ${(props) => props.theme.tooltipBackground};
    color: ${(props) => props.theme.tooltipText};
    font-size: 90%;
  }

  .react-hint--top:after {
    border-top-color: ${(props) => props.theme.tooltipBackground};
  }

  .react-hint--left:after {
    border-left-color: ${(props) => props.theme.tooltipBackground};
  }

  .react-hint--right:after {
    border-right-color: ${(props) => props.theme.tooltipBackground};
  }

  .react-hint--bottom:after {
    border-bottom-color: ${(props) => props.theme.tooltipBackground};
  }
`;

/**
 * Renders `data-rh` tooltips for elements near its mount point. Mounted
 * once in Layout for the app, and once inside the modal <dialog>: the
 * dialog lives in the browser's top layer, which no outside element can
 * paint above, so it needs its own instance.
 */
class HintTooltip extends React.PureComponent<Props> {
  override render() {
    return (
      <ReactHintContainer>
        <ReactHint events onRenderContent={this.renderContent} />
      </ReactHintContainer>
    );
  }

  renderContent = (target: HTMLElement, content: string) => {
    const { intl } = this.props;
    let { rh } = target.dataset;
    if (!rh) {
      return null;
    }

    const firstChar = rh[0];
    if (firstChar === "[" || firstChar === "{" || firstChar === `"`) {
      try {
        const obj = JSON.parse(rh);
        if (Array.isArray(obj)) {
          rh = TString(intl, obj);
        } else if (obj.hasOwnProperty("date")) {
          rh = formatDate(new Date(obj.date), intl.locale, DATE_FORMAT);
        } else if (obj.hasOwnProperty("duration")) {
          const durationMsg = formatPreciseDurationAsMessage(obj.duration);
          rh = TString(intl, [durationMsg.id, durationMsg.values]);
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
  };
}

interface Props {
  intl: IntlShape;
}

export default injectIntl(HintTooltip);
