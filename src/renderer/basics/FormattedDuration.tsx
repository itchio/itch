import {
  formatDurationAsMessage,
  formatExactDuration,
} from "common/format/datetime";
import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
  /** A duration, in seconds */
  secs: number;
}

/**
 * Renders a human-friendly (and localized) duration with exact time on hover
 */
export default ({ secs }: Props) => (
  <span
    data-rh={JSON.stringify({ duration: secs })}
    title={formatExactDuration(secs)}
  >
    <FormattedMessage {...formatDurationAsMessage(secs)} />
  </span>
);
